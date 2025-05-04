from dotenv import load_dotenv
from flask_cors import CORS
from flask import Flask, Response, request, session, send_file, jsonify, redirect, url_for, render_template, send_from_directory, flash
import bs4
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_chroma import Chroma
from chromadb.config import Settings as ChromaSettings
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_openai import OpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

import uuid
import os
load_dotenv()
app = Flask(__name__)

CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

chat_history_store = {}

@app.route("/", methods=["GET"])
def getall():
    return jsonify({"answer": "hello", "session_id": "23fd23"})

@app.route("/generate", methods=["POST", "OPTIONS"])
def generate():
    if request.method == "OPTIONS":
        return '', 204
    data = request.get_json() or {}
    question = data.get("question", "").strip()
    session_id = data.get("session_id")
    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400

    try:
        print(os.environ.get('OPENAI_API_KEY'))
        llm = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
    
        loader = WebBaseLoader(
            web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent/",),
            bs_kwargs=dict(
                parse_only=bs4.SoupStrainer(
                    class_=("post-content", "post-title", "post-header")
                )
            ),
        )
        docs = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=OpenAIEmbeddings(),
            client_settings=ChromaSettings(tenant_id="default_tenant")
        )

        retriever = vectorstore.as_retriever()


        ### Contextualize question ###
        contextualize_q_system_prompt = """Given a chat history and the latest user question \
        which might reference context in the chat history, formulate a standalone question \
        which can be understood without the chat history. Do NOT answer the question, \
        just reformulate it if needed and otherwise return it as is."""
        contextualize_q_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", contextualize_q_system_prompt),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ]
        )
        history_aware_retriever = create_history_aware_retriever(
            llm, retriever, contextualize_q_prompt
        )

        ### Answer question ###
        qa_system_prompt = """You are an assistant for question-answering tasks. \
        Use the following pieces of retrieved context to answer the question. \
        If you don't know the answer, just say that you don't know. \
        Use three sentences maximum and keep the answer concise.\

        {context}"""
        qa_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", qa_system_prompt),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ]
        )
        question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

        rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

        conversational_rag_chain = RunnableWithMessageHistory(
            rag_chain,
            get_session_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer",
        )

        qa_chain = conversational_rag_chain

        if session_id not in chat_history_store:
            session_id = str(uuid.uuid4())
        answer = qa_chain.invoke(
            {"input": question},
            config={"configurable": {"session_id": session_id}}
        )["answer"]
        return jsonify({"success": True, "answer": answer, "session_id": session_id})
    except Exception as e:
        print('err',e)
        return jsonify({"error": str(e)}), 500

def format_docs(docs):
    return "\n\n".join([d.page_content for d in docs])

def setup_rag():
    print('api',os.environ.get('OPENAI_API_KEY'))



def get_session_history(session_id: str) -> ChatMessageHistory:
    if session_id not in chat_history_store:
        chat_history_store[session_id] = ChatMessageHistory()
    return chat_history_store[session_id]

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)