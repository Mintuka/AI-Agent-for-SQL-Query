from controllers.generate import generate_answer
from controllers.login import login_user
from controllers.register import register_user
from dotenv import load_dotenv, set_key
from flask_cors import CORS
from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import certifi
import os

load_dotenv()
app = Flask(__name__)
bcrypt = Bcrypt(app)

CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:3000", "http://104.154.92.239", "http://104.154.92.239:80","http://104.154.92.239/:1", "https://ai-agent-for-sql-query.vercel.app"],  # No port 80 needed
    methods=["GET", "POST", "OPTIONS"],  # Explicitly allow OPTIONS
    allow_headers=["Content-Type", "Authorization"],  # Required for credentials
    expose_headers=["Content-Type"]
)

client = MongoClient(os.environ.get('MONGODB_URL'), tlsCAFile=certifi.where())
db = client['querygpt']
users_collection = db['users']


def _get_token_serializer() -> URLSafeTimedSerializer:
    secret = os.environ.get("AUTH_SECRET_KEY") or os.environ.get("FLASK_SECRET_KEY") or os.environ.get("SECRET_KEY")
    if not secret:
        secret = "dev-insecure-secret-change-me"
    return URLSafeTimedSerializer(secret_key=secret, salt="auth-token")


def create_auth_token(email: str) -> str:
    serializer = _get_token_serializer()
    return serializer.dumps({"email": email})


def verify_auth_token(token: str, max_age_seconds: int = 60 * 60 * 24 * 7) -> str | None:
    serializer = _get_token_serializer()
    try:
        data = serializer.loads(token, max_age=max_age_seconds)
        email = (data.get("email") or "").strip()
        return email or None
    except (BadSignature, SignatureExpired):
        return None


def get_email_from_request_auth() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None
    return verify_auth_token(token)

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    allowed_prefixes = [
        "http://localhost",
        "http://127.0.0.1",
        "http://104.154.92.239",
        "http://104.154.92.239:8080",
        "http://104.154.92.239/:1",
        "https://ai-agent-for-sql-query.vercel.app"
    ]

    if origin and any(origin.startswith(p) for p in allowed_prefixes):
        response.headers.update({
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        })
    return response

@app.route('/register', methods=['POST'])
def register():
    if request.method == "OPTIONS":
        return '', 204
    data = request.get_json() or {}
    result = register_user(data, users_collection, hash_password)
    if isinstance(result, tuple):
        return result
    token = create_auth_token(result["email"])
    return jsonify({"message": result["message"], "user_id": result["user_id"], "email": result["email"], "token": token}), 201

@app.route('/login', methods=['POST'])
def login():
    if request.method == "OPTIONS":
        return '', 204
    data = request.get_json() or {}
    result = login_user(data, users_collection, is_valid)
    if isinstance(result, tuple):
        return result
    token = create_auth_token(result["email"])
    return jsonify({"message": result["message"], "email": result["email"], "token": token}), 200


@app.route("/generate", methods=["POST", "OPTIONS"])
def generate():
    if request.method == "OPTIONS":
        return '', 204
    email = get_email_from_request_auth()
    if not email:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json() or {}
    data["authenticated_email"] = email
    return generate_answer(data, users_collection, is_valid)


@app.route("/me", methods=["GET"])
def me():
    email = get_email_from_request_auth()
    if not email:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"email": email}), 200

@app.route('/settings/load', methods=['POST', 'OPTIONS'])
def settings_load():
    if request.method == "OPTIONS":
        return '', 204

    email = get_email_from_request_auth()
    if not email:
        return jsonify({"error": "Unauthorized"}), 401
    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(
        {
            "gemini_api_key": user.get("gemini_api_key") or "",
            "db_api_key": user.get("db_api_key") or "",
        }
    ), 200


@app.route('/settings', methods=['POST', 'OPTIONS'])
def settings():
    # Needed so the browser CORS preflight doesn't fail with a 404.
    if request.method == "OPTIONS":
        return '', 204

    data = request.get_json() or {}
    apikey = str(data.get("apikey", "")).strip()
    email = get_email_from_request_auth()
    if not email:
        return jsonify({"error": "Unauthorized"}), 401
    db_api_key_in = data.get("db_api_key")

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    updates = {}
    if apikey:
        if "AIza" not in apikey:
            return jsonify({"error": "Invalid apikey format"}), 400
        updates["gemini_api_key"] = apikey
        os.environ["GEMINI_API_KEY"] = apikey
        try:
            env_path = os.path.join(os.path.dirname(__file__), ".env")
            set_key(env_path, "GEMINI_API_KEY", apikey)
        except Exception:
            pass

    if db_api_key_in is not None:
        updates["db_api_key"] = str(db_api_key_in).strip()

    if not updates:
        return jsonify({"error": "Nothing to save"}), 400

    users_collection.update_one({"email": email}, {"$set": updates})

    return jsonify({"success": True}), 200

@app.route('/documents', methods=['GET'])
def get_documents():
    docs = list(users_collection.find({}, {'_id': 0}))
    return jsonify(docs), 200

@app.route("/test", methods=["GET"])
def getall():
    return jsonify({"answer": "hello", "session_id": "23fd23"})

def hash_password(password):
    return bcrypt.generate_password_hash(password).decode('utf-8')

def is_valid(hashed_password, passowrd):
    return bcrypt.check_password_hash(hashed_password.encode('utf-8'), passowrd.encode('utf-8'))

def format_docs(docs):
    return "\n\n".join([d.page_content for d in docs])

def setup_rag():
    print('api',os.environ.get('GEMINI_API_KEY'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)