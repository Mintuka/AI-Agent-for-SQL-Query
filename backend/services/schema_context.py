"""
Builds a compact Postgres schema description for the LLM: exact identifiers,
column types, and up to one sample row per table (cached by the caller).
"""

from __future__ import annotations

import json
import re
from typing import Any

from psycopg2 import sql as psql


def _pg_quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def _needs_quotes(ident: str) -> bool:
    if not ident:
        return True
    if ident.lower() != ident:
        return True
    if not re.match(r"^[a-z_][a-z0-9_]*$", ident):
        return True
    return False


def _sql_ident_fragment(name: str) -> str:
    """Human-facing SQL fragment: quoted when Postgres would not fold to lower-case."""
    return _pg_quote_ident(name) if _needs_quotes(name) else name


def _json_safe_sample(v: Any, max_len: int = 160) -> Any:
    if v is None:
        return None
    if isinstance(v, (bytes, memoryview)):
        return "<binary>"
    if isinstance(v, (dict, list)):
        try:
            s = json.dumps(v, default=str)
        except TypeError:
            s = str(v)
    else:
        s = str(v)
    if len(s) > max_len:
        return s[: max_len - 1] + "…"
    return s


def build_postgres_llm_schema_context(postgres_url: str | None, max_tables: int = 25) -> str:
    """
    Pull public table list, column names (catalog-accurate), and one sample row per table.
    """
    if not postgres_url:
        return ""

    import psycopg2

    tables_sql = """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type IN ('BASE TABLE', 'VIEW')
        ORDER BY table_name
        LIMIT %s
    """
    columns_sql = """
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ANY(%s)
        ORDER BY table_name, ordinal_position
    """

    try:
        conn = psycopg2.connect(postgres_url)
    except Exception:
        return ""

    blocks: list[str] = []
    try:
        with conn.cursor() as cur:
            cur.execute(tables_sql, (max_tables,))
            tables = [r[0] for r in cur.fetchall()]
            if not tables:
                return ""

            cur.execute(columns_sql, (tables,))
            cols_by_table: dict[str, list[tuple[str, str]]] = {}
            for table_name, column_name, data_type in cur.fetchall():
                cols_by_table.setdefault(table_name, []).append((column_name, data_type))

        header = (
            "PostgreSQL rules for identifiers:\n"
            "- Unquoted names are lowercased. Mixed-case / camelCase columns and tables "
            "MUST be double-quoted exactly as shown (e.g. \"createdAt\").\n"
            "- Use only tables and columns listed below; do not invent names.\n\n"
            "Schema (public) — each block lists SQL-safe identifiers, types, and one sample row:\n"
        )

        for t in tables:
            cols = cols_by_table.get(t, [])
            col_sql_list = ", ".join(_sql_ident_fragment(c) for c, _ in cols[: 60]) if cols else "(no columns)"
            type_line = (
                ", ".join(f"{_sql_ident_fragment(c)} ({dt})" for c, dt in cols[: 25])
                if cols
                else ""
            )
            if len(cols) > 25:
                type_line += ", …"

            sample_line = "(no sample — table empty or unreadable)"
            try:
                with conn.cursor() as cur:
                    stmt = psql.SQL("SELECT * FROM {}.{} LIMIT 1").format(
                        psql.Identifier("public"),
                        psql.Identifier(t),
                    )
                    cur.execute(stmt)
                    colnames = [d[0] for d in (cur.description or [])]
                    row = cur.fetchone()
                    if row is None:
                        sample_line = "(no rows yet — use columns only)"
                    else:
                        sample_dict = {
                            colnames[i]: _json_safe_sample(row[i]) for i in range(len(colnames))
                        }
                        sample_line = json.dumps(sample_dict, ensure_ascii=False, default=str)
                        if len(sample_line) > 1200:
                            sample_line = sample_line[:1199] + "…"
            except Exception as e:
                sample_line = f"(sample unavailable: {e})"

            table_sql = _sql_ident_fragment(t)
            blocks.append(
                f"### Table public.{table_sql}\n"
                f"Columns for SQL: {col_sql_list}\n"
                f"Types: {type_line}\n"
                f"Sample row (1): {sample_line}\n"
            )

        return header + "\n".join(blocks)
    finally:
        conn.close()
