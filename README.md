# QueryGPT - AI-Powered Query Assistant

## Overview

QueryGPT is an AI-powered application that provides intelligent responses to user queries by leveraging large language models. The application consists of a **Next.js frontend** and a **Python backend** service.

---

## Prerequisites

- Docker  
- Docker Compose  
- Node.js (for development)  
- Python 3.8+ (for development)

---

## Getting Started

### Running the Application Locally

**Clone the repository**

```bash
git clone https://github.com/your-repo/querygpt.git
cd querygpt
```

**Start the application**

```bash
docker-compose up --build
```

The application will be available at:  
👉 `http://localhost:3000`

---

## Development Setup

### Frontend Configuration

Edit `frontend/Dockerfile`:

**Remove:**

```dockerfile
ENV NODE_ENV=production
CMD ["npm", "start"]
```

**Uncomment:**

```dockerfile
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]
```

---

### Backend Configuration

Edit `backend/Dockerfile`:

**Remove:**

```dockerfile
ENV FLASK_ENV=production
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "4", "--timeout", "120", "app:app"]
```

**Uncomment:**

```dockerfile
ENV FLASK_ENV=development
CMD ["flask", "run", "--host=0.0.0.0", "--port=8080", "--reload"]
```

---

### Frontend: Development Mode Watch Config

Edit `frontend/next.config.ts` and **uncomment** the following block:

```ts
webpackDevMiddleware: (config: WebpackConfigContext['webpack']) => {
  config.watchOptions = {
    poll: 1000,
    aggregateTimeout: 300,
  };
  return config;
},
```

---

## Deployment

### Create Your Cluster

To run the project in your own Google Cloud Clusters
1. Run the script in kubernetes/create-cluster.sh
```bash
cd kubernetes
./create-cluster.sh
```

2. Update the docker image in frontend/frontend-deployment.yaml with your docker hub image
```image: mintuka2015/querygpt-frontend:v1.1```

3. Update the docker image in backend/backend-deployment.yaml with your docker hub image
```image: mintuka2015/querygpt-backend:v1.1```

### Deploy Frontend Changes

```bash
cd frontend
./deploy-frontend.sh
```

### Deploy Backend Changes

```bash
cd backend
./deploy-backend.sh
```

---

## Project File Structure

```
querygpt/
├── frontend/              # Next.js application
│   ├── public/            # Static files
│   ├── src/               # Application source code
│   ├── Dockerfile         # Frontend container config
│   └── next.config.ts     # Next.js config
├── backend/               # Python backend service
│   ├── app/               # Application code
│   ├── Dockerfile         # Backend container config
│   └── requirements.txt   # Python dependencies
├── docker-compose.yml     # Orchestration config
└── README.md              # This file
```

---

## Environment Variables

### Frontend (`frontend/.env`)

```env
NEXT_PUBLIC_API_URL=YOUR_API_BASE_URL
```

### Backend (`backend/.env`)

```env
OPENAI_API_KEY=YOUR_OPENAI_KEY
DATABASE_URL=YOUR_MONGODB_URL
```

---