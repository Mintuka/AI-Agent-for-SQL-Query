from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_google_genai import ChatGoogleGenerativeAI
from flask import jsonify
from dotenv import load_dotenv
import re
import uuid
import os

load_dotenv()

chat_history_store = {}
schema_cache = {"ts": 0.0, "context": ""}
SCHEMA_CACHE_TTL_SEC = 60 * 30  # refresh schema + samples every 30 minutes


def _get_postgres_url() -> str | None:
    url = os.environ.get("POSTGRES_URL")
    if not url:
        return None
    return _normalize_postgres_url(url)


def _normalize_postgres_url(url: str) -> str:
    """
    Accept Prisma-style Postgres URLs and try to convert them into a
    libpq/psycopg2-compatible URI.

    Note: If your Prisma Accelerate URL still can't be used by psycopg2,
    you must provide a direct `postgresql://user:pass@host:port/dbname` URL.
    """
    u = url.strip().strip('"').strip("'")

    # Prisma uses a non-standard scheme prefix for Postgres connections.
    if u.startswith("prisma+postgres://"):
        u = "postgresql://" + u[len("prisma+postgres://") :]
    if u.startswith("prisma://"):
        # Best-effort normalization. Some Prisma URLs may require Prisma-specific auth.
        u = "postgresql://" + u[len("prisma://") :]

    # psycopg2/libpq does not understand Prisma `api_key` query params.
    # If present, you need a direct connection string.
    if "api_key=" in u:
        raise ValueError(
            "POSTGRES_URL appears to be a Prisma Accelerate URL (contains `api_key`). "
            "psycopg2 can't use it. Please set POSTGRES_URL to a direct "
            "`postgresql://user:pass@host:port/dbname` connection string (no `prisma+` / no `api_key`)."
        )

    return u


def get_db_schema_context() -> str:
    """
    Cached schema + one sample row per table (see services.schema_context).
    """
    import time

    from services.schema_context import build_postgres_llm_schema_context

    now = time.time()
    if schema_cache["context"] and (now - schema_cache["ts"]) < SCHEMA_CACHE_TTL_SEC:
        return schema_cache["context"]

    url = _get_postgres_url()
    ctx = build_postgres_llm_schema_context(url, max_tables=25) if url else ""
    schema_cache["context"] = ctx
    schema_cache["ts"] = now
    return ctx


def _extract_sql_and_explanation(model_text: str) -> tuple[str, str]:
    text = model_text.strip()

    # Prefer ```sql ... ``` code blocks.
    code_match = re.search(r"```sql\s*(.*?)```", text, flags=re.DOTALL | re.IGNORECASE)
    if not code_match:
        # Fallback to any fenced code block.
        code_match = re.search(r"```\s*(.*?)```", text, flags=re.DOTALL)

    sql = code_match.group(1).strip() if code_match else ""

    # Extract "Explanation:" section if present.
    exp_match = re.search(r"Explanation\s*:\s*(.*)$", text, flags=re.DOTALL | re.IGNORECASE)
    explanation = exp_match.group(1).strip() if exp_match else ""

    if not sql:
        # Last resort: try to find first SELECT statement.
        select_match = re.search(r"\b(SELECT\b[\s\S]*)", text, flags=re.IGNORECASE)
        sql = select_match.group(1).strip() if select_match else text
        cut = re.search(r"\n\s*Explanation\s*:", sql, flags=re.IGNORECASE)
        if cut:
            sql = sql[: cut.start()].strip()

    if not explanation:
        explanation = text

    # Drop any trailing "Explanation:" markers or extra content after the explanation.
    sql = _normalize_sql_for_execution(sql)
    return sql, explanation


def _strip_trailing_semicolons(sql: str) -> str:
    q = sql.rstrip()
    while q.endswith(";"):
        q = q[:-1].rstrip()
    return q


def _first_sql_statement(sql: str) -> str:
    """
    Keep a single statement: drop everything after the first top-level ';' (not inside
    strings or nested parens). Trailing semicolons are removed afterward.
    """
    q = sql.strip()
    q = _strip_trailing_semicolons(q)
    if not q or ";" not in q:
        return q

    in_single = False
    depth = 0
    i = 0
    while i < len(q):
        c = q[i]
        if in_single:
            if c == "'":
                if i + 1 < len(q) and q[i + 1] == "'":
                    i += 2
                    continue
                in_single = False
            i += 1
            continue
        if c == "'":
            in_single = True
            i += 1
            continue
        if c == "(":
            depth += 1
        elif c == ")":
            depth = max(0, depth - 1)
        elif c == ";" and depth == 0:
            return q[:i].strip()
        i += 1
    return _strip_trailing_semicolons(q)


def _normalize_sql_for_execution(sql: str) -> str:
    """Trim, strip leading junk semicolons, keep first statement only, no trailing ';'."""
    q = (sql or "").strip()
    while q.startswith(";"):
        q = q[1:].lstrip()
    if not q:
        return q
    q = _first_sql_statement(q)
    return _strip_trailing_semicolons(q.strip())


def _json_safe(v):
    # psycopg returns datetime/decimal/etc; convert non-basic types to string.
    if v is None:
        return None
    if isinstance(v, (bool, int, float, str)):
        return v
    return str(v)


def _enforce_readonly_sql(sql: str) -> str:
    """
    Basic guardrails to prevent executing non-SELECT statements.
    This is not perfect SQL sanitization, but it blocks common destructive keywords.
    """
    q = _normalize_sql_for_execution(sql)
    if not q:
        raise ValueError("Model did not return any SQL.")

    # Reject any remaining ';' (e.g. inside unparseable dollar-quoted strings).
    if ";" in q:
        raise ValueError("SQL must not contain ';' characters (single statement only).")

    q_lower = q.lower()
    if not (q_lower.startswith("select") or q_lower.startswith("with")):
        raise ValueError("Only SELECT (or WITH ... SELECT) queries are allowed.")

    # SELECT INTO creates/overwrites tables in Postgres.
    if re.search(r"\bselect\b[\s\S]*\binto\b", q_lower):
        raise ValueError("SELECT INTO is not allowed (read-only queries only).")

    forbidden = [
        "insert",
        "update",
        "delete",
        "drop",
        "alter",
        "create",
        "truncate",
        "grant",
        "revoke",
        "comment",
        "call",
        "do ",
        "copy ",
        "vacuum",
    ]
    for kw in forbidden:
        if re.search(rf"\\b{re.escape(kw)}\\b", q_lower):
            raise ValueError(f"Forbidden SQL keyword detected: {kw}")

    return q


def _add_limit_if_missing(sql: str, limit_rows: int) -> str:
    if re.search(r"\\blimit\\b", sql, flags=re.IGNORECASE):
        return sql
    # Wrap the query so we can safely apply a LIMIT without rewriting the query body.
    return f"SELECT * FROM ({sql}) AS sub LIMIT {limit_rows}"


def execute_postgres_readonly(sql: str, limit_rows: int = 50) -> dict:
    import psycopg2

    postgres_url = _get_postgres_url()
    if not postgres_url:
        raise ValueError("Missing POSTGRES_URL in backend/.env")

    sql_readonly = _enforce_readonly_sql(sql)
    sql_to_run = _add_limit_if_missing(sql_readonly, limit_rows)

    try:
        conn = psycopg2.connect(postgres_url)
    except Exception as e:
        raise ValueError(
            "Failed to connect to Postgres using POSTGRES_URL. "
            "If you're using a Prisma Accelerate URL like `prisma+postgres://...`, "
            "psycopg2 may not support it. Provide a direct "
            "`postgresql://user:pass@host:port/dbname` connection string."
        ) from e
    try:
        # Server-side enforcement: even if we miss a keyword, Postgres will reject writes.
        conn.set_session(readonly=True, autocommit=True)
        with conn.cursor() as cur:
            # Safety timeout in ms.
            cur.execute("SET statement_timeout = %s", (5000,))
            cur.execute(sql_to_run)
            cols = [desc[0] for desc in cur.description] if cur.description else []
            rows = cur.fetchmany(limit_rows) if cur.description else []

        row_dicts = [{cols[i]: _json_safe(row[i]) for i in range(len(cols))} for row in rows]
        return {"columns": cols, "rows": row_dicts}
    finally:
        conn.close()

def get_llm(google_api_key: str | None = None):
    # Allow overriding the Gemini model without code changes.
    # Set `GEMINI_MODEL` in `backend/.env` to a model you have access to.
    model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    key = google_api_key or os.environ.get("GEMINI_API_KEY")
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=key,
        temperature=0.3,
        convert_system_message_to_human=True,
    )

def build_chain(system_prompt: str, google_api_key: str | None = None):
    llm = get_llm(google_api_key)

    # Use {system_content} so JSON / braces in the schema are not parsed as template fields.
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "{system_content}"),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    ).partial(system_content=system_prompt)

    chain = prompt | llm

    return RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
    )


def _escape_langchain_template_literals(text: str) -> str:
    """No-op; schema is bound via ChatPromptTemplate.partial(system_content=...) instead."""
    return text


def get_session_history(session_id: str) -> ChatMessageHistory:
    if session_id not in chat_history_store:
        chat_history_store[session_id] = ChatMessageHistory()
    return chat_history_store[session_id]

def _resolve_gemini_api_key(data, users_collection, is_valid):
    """Prefer per-user key from MongoDB when credentials match; else server env."""
    key = os.environ.get("GEMINI_API_KEY")
    if users_collection is None or is_valid is None:
        return key
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    if not email or not password:
        return key
    user = users_collection.find_one({"email": email})
    if not user or not is_valid(user["password"], password):
        return key
    return user.get("gemini_api_key") or key


def generate_answer(data, users_collection=None, is_valid=None):
    question = data.get("question", "").strip()
    session_id = data.get("session_id")
    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400

    try:
        google_api_key = _resolve_gemini_api_key(data, users_collection, is_valid)
        if not google_api_key:
            return jsonify({"error": "Missing GEMINI_API_KEY. Please set it via /settings."}), 400

        postgres_url = _get_postgres_url()
        if not postgres_url:
            return jsonify({"error": "Missing POSTGRES_URL in backend/.env"}), 400

        schema_context = get_db_schema_context()
        schema_block = (
            schema_context
            if schema_context
            else "(no schema available; try best-effort using common names)"
        )

        system_prompt = (
            "You are GenSQL, an expert PostgreSQL SQL assistant.\n\n"
            "You must write a single READ-ONLY SQL query that answers the user's question.\n\n"
            "Database context (tables, exact column identifiers, sample rows):\n"
            + schema_block
            + "\n\n"
            "Output format (MUST follow exactly):\n"
            "SQL:\n"
            "```sql\n"
            "<one SELECT or WITH ... SELECT query>\n"
            "```\n\n"
            "Explanation:\n"
            "<short explanation>\n\n"
            "Constraints:\n"
            "- SQL must be SELECT or WITH ... SELECT only.\n"
            "- No INSERT/UPDATE/DELETE/DDL.\n"
            "- Never use `SELECT ... INTO` (it creates tables).\n"
            "- No data-modifying CTEs (DELETE/UPDATE in subqueries).\n"
            "- Do not use functions/clauses that can cause side effects (no CALL/DO/COPY).\n"
            "- Prefer PostgreSQL dialect.\n"
            "- Include LIMIT (<=50) when you expect many rows.\n"
            "- Output exactly one SQL statement in the code block.\n"
            "- Do not end the SQL with a semicolon; omit trailing ';' entirely.\n"
            "- For mixed-case or camelCase columns/tables, use double quotes exactly as in the context (e.g. \"createdAt\").\n"
        )

        # Rebuild the chain per request so dynamic prompt + /settings changes take effect immediately.
        conversational_chain = build_chain(system_prompt, google_api_key)

        if not session_id or session_id not in chat_history_store:
            session_id = str(uuid.uuid4())

        result = conversational_chain.invoke(
            {"input": question},
            config={"configurable": {"session_id": session_id}}
        )

        model_text = result.content if hasattr(result, "content") else str(result)
        sql, explanation = _extract_sql_and_explanation(model_text)

        try:
            results = execute_postgres_readonly(sql, limit_rows=50)
        except Exception as exec_err:
            # Still return the generated SQL + explanation even if execution fails.
            results = {"error": str(exec_err)}

        # Keep `answer` for backwards-compat with the frontend, but prefer `explanation/results/sql`.
        answer = explanation
        return jsonify(
            {
                "success": True,
                "session_id": session_id,
                "answer": answer,
                "sql": sql,
                "explanation": explanation,
                "results": results,
            }
        )
    except Exception as e:
        print('err', e)
        return jsonify({"error": str(e)}), 500
