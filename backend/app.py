from controllers.generate import generate_answer
from controllers.login import login_user
from controllers.register import register_user
from dotenv import load_dotenv, set_key
from flask_cors import CORS
from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
import certifi
import os

load_dotenv()
app = Flask(__name__)
bcrypt = Bcrypt(app)

CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:3000", "http://104.154.92.239", "http://104.154.92.239:80","http://104.154.92.239/:1", "https://ai-agent-for-sql-query.vercel.app/"],  # No port 80 needed
    methods=["GET", "POST", "OPTIONS"],  # Explicitly allow OPTIONS
    allow_headers=["Content-Type", "Authorization"],  # Required for credentials
    expose_headers=["Content-Type"]
)

client = MongoClient(os.environ.get('MONGODB_URL'), tlsCAFile=certifi.where())
db = client['querygpt']
users_collection = db['users']

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    allowed_prefixes = [
        "http://localhost",
        "http://127.0.0.1",
        "http://104.154.92.239",
        "http://104.154.92.239:8080",
        "http://104.154.92.239/:1",
        "https://ai-agent-for-sql-query.vercel.app/"
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
    return register_user(data, users_collection, hash_password)

@app.route('/login', methods=['POST'])
def login():
    if request.method == "OPTIONS":
        return '', 204
    data = request.get_json() or {}
    return login_user(data, users_collection, is_valid)


@app.route("/generate", methods=["POST", "OPTIONS"])
def generate():
    if request.method == "OPTIONS":
        return '', 204
    data = request.get_json() or {}
    return generate_answer(data, users_collection, is_valid)

@app.route('/settings/load', methods=['POST', 'OPTIONS'])
def settings_load():
    if request.method == "OPTIONS":
        return '', 204

    data = request.get_json() or {}
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email})
    if not user or not is_valid(user["password"], password):
        return jsonify({"error": "Incorrect email or password"}), 400

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
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))
    db_api_key_in = data.get("db_api_key")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email})
    if not user or not is_valid(user["password"], password):
        return jsonify({"error": "Incorrect email or password"}), 400

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