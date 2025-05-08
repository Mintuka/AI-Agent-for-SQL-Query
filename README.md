QueryGPT - AI-Powered Query Assistant
Overview
QueryGPT is an AI-powered application that provides intelligent responses to user queries by leveraging large language models. The application consists of a Next.js frontend and a Python backend service.

Prerequisites
Docker

Docker Compose

Node.js (for development)

Python 3.8+ (for development)

Getting Started
Running the Application Locally

Getting Started
Running the Application Locally
Clone the repository

`git clone https://github.com/your-repo/querygpt.git`
`cd querygpt`

Start the application
`docker-compose up --build`
The application will be available at `http://localhost:3000`

Development Setup
To run the application in development mode:
Frontend Configuration

Edit frontend/Dockerfile:
Remove
`ENV NODE_ENV=production`
`CMD ["npm", "start"]`
Uncomment
`ENV NODE_ENV=development`
`CMD ["npm", "run", "dev"]`

Edit backend/Dockerfile:
Remove
`ENV FLASK_ENV=production`
`CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "4", "--timeout", "120", "app:app"]`
Uncomment
`ENV FLASK_ENV=development`
`CMD ["flask", "run", "--host=0.0.0.0", "--port=8080", "--reload"]`

Edit frontend/next.config.ts to enable development settings
Uncomment
 `webpackDevMiddleware: (config: WebpackConfigContext['webpack']) => {`
   `config.watchOptions = {`
    ` poll: 1000,`
     `aggregateTimeout: 300,`
   `};`
   `return config;`
 `},`

To deploy frontend changes
`cd frontend`
Run deployment script
`./deploy-frontend.sh`

To deploy frontend changes
`cd backend`
Run deployment script
`./deploy-backend.sh`

Project File Structure
querygpt/
├── frontend/          # Next.js application
│   ├── public/        # Static files
│   ├── src/           # Application source code
│   ├── Dockerfile     # Frontend container configuration
│   └── next.config.ts # Next.js configuration
├── backend/           # Python backend service
│   ├── app/           # Application code
│   ├── Dockerfile     # Backend container configuration
│   └── requirements.txt # Python dependencies
├── docker-compose.yml # Orchestration configuration
└── README.md          # This file

Environment Variables
Create a .env file in both frontend and backend directories with the following variables:

Frontend (.env)
`NEXT_PUBLIC_API_URL=YOUR_API_BASE_URL`
Backend (.env)
`OPENAI_API_KEY=YOUR_OPENAPI_KEY`
`DATABASE_URL=YOUR_MONGODB_URL`