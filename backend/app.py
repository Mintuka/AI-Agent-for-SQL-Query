from controllers.generate import generate_answer
from controllers.login import login_user
from controllers.register import register_user
from dotenv import load_dotenv
from flask_cors import CORS
from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
import os

load_dotenv()
app = Flask(__name__)
bcrypt = Bcrypt(app)

CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:3000", "http://104.154.92.239", "http://104.154.92.239:80","http://104.154.92.239/:1"],  # No port 80 needed
    methods=["GET", "POST", "OPTIONS"],  # Explicitly allow OPTIONS
    allow_headers=["Content-Type", "Authorization"],  # Required for credentials
    expose_headers=["Content-Type"]
)

app = Flask(__name__)
bcrypt = Bcrypt(app)
# Connect to MongoDB (adjust the URI as needed)
client = MongoClient(os.environ.get('MONGODB_URL'))
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
        "http://104.154.92.239/:1"
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
    return generate_answer(data)

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
    print('api',os.environ.get('OPENAI_API_KEY'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)