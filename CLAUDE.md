# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack AI chat application for SQL query assistance. React (Vite) frontend + Flask backend using LangChain with Google Gemini API.

## Commands

### Frontend (from `frontend/`)
```bash
npm run dev          # Dev server on localhost:3000
npm run build        # Production build (tsc + vite build)
npm run preview      # Preview production build
npm run lint         # ESLint
```

### Backend (from `backend/`)
```bash
pip install -r requirements.txt
flask run --host=0.0.0.0 --port=8080 --reload
```

### Environment Variables
- **Frontend** `.env`: `VITE_API_BASE_URL=http://localhost:8080`
- **Backend** `.env`: `MONGODB_URL`, `GEMINI_API_KEY`

## Architecture

### Frontend (React 19 / Vite / TypeScript / Tailwind v4)
- **`src/App.tsx`** — Root component acting as router. Manages auth state (`'loading' | 'login' | 'home' | 'register'`) and auto-login via localStorage credentials validated against `/login` endpoint.
- **`src/components/ChatPage.tsx`** — Main chat UI with sidebar (chat history, settings), message display with word-by-word animation, and input. Manages multiple chat sessions in local state.
- **`src/components/AuthPage.tsx`** — Login and Register forms.
- **`src/components/Settings.tsx`** — Modal for Gemini API key.
- **`src/components/AddSchema.tsx`** — Modal for database schema input.
- **`src/types/component-types.ts`** — TypeScript interfaces (`Chat`, `ChatHistory`).
- **`src/utils/component-utils.ts`** — Fetch helper functions for API calls.
- **`src/globals.css`** — Global CSS with CSS variables for theming (colors, surfaces, borders).

### Backend (Flask / Python)
- **`app.py`** — Flask app entry point. CORS config, MongoDB connection to `querygpt` db, route registration.
- **`controllers/generate.py`** — Conversational chain using Gemini 2.0 Flash via LangChain. SQL-focused system prompt. Per-session chat history in memory.
- **`controllers/login.py`** — Validates email exists and bcrypt password match.
- **`controllers/register.py`** — Creates user with bcrypt-hashed password in MongoDB.

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/register` | POST | Create user (`{email, password}`) |
| `/login` | POST | Authenticate (`{email, password}`) |
| `/generate` | POST | SQL query generation (`{question, session_id}`) |
| `/settings` | POST | Save API key (partially implemented) |
| `/documents` | GET | Fetch user documents |
| `/test` | GET | Health check |

### Data Flow
1. User authenticates → credentials stored in localStorage
2. User sends query → POST `/generate` with question + session_id
3. Backend generates SQL via Gemini → returns answer
4. Frontend displays answer with word-by-word animation
5. Chat history maintained client-side (not persisted to DB)

### Database
MongoDB `querygpt` database with a `users` collection (`email`, `password` as bcrypt hash). Chat history is in-memory only on the backend.
