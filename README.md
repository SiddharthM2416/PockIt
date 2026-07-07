# PockIt

PockIt is a full-stack personal budgeting app. Users sign in with Firebase Authentication, log income and expenses, view spending trends on a dashboard, and can add transactions using natural language (e.g. *"spent 500 on groceries yesterday"*), which is parsed into structured data by an LLM (Groq via LangChain).

## Tech Stack

**Frontend** (`/Frontend`)
- React 19 + Vite
- Tailwind CSS
- React Router
- Recharts (charts/analytics)
- Firebase Auth (client SDK)
- Axios

**Backend** (`/backend`)
- Node.js + Express 5
- MongoDB + Mongoose
- Firebase Admin SDK (verifies ID tokens issued by the frontend)
- LangChain + Groq (`llama-3.1-8b-instant`) for parsing natural-language transaction input into structured JSON

**Deployment**
- Configured for [Vercel](https://vercel.com) as a single project: `backend/app.js` runs as a serverless function behind `/api/*`, and the built frontend is served as a static site (see `vercel.json`).

## Project Structure

```
PockIt/
├── Frontend/          # React + Vite client
│   └── src/
│       ├── axios/          # Axios instance with Firebase auth interceptor
│       ├── components/     # Header, Profile, AddTransaction, Transactions
│       ├── pages/           # Home, Login, Register, Dashboard
│       └── firebase.js      # Firebase client init
├── backend/           # Express API
│   ├── controllers/    # Transaction CRUD logic
│   ├── db/              # Mongoose connection
│   ├── middleware/      # Firebase token auth middleware
│   ├── models/          # User, Transaction schemas
│   ├── routes/           # transactionRouter, aiRouter (Groq parsing)
│   └── app.js
└── vercel.json
```

## Prerequisites

- Node.js 18+
- A MongoDB connection string (e.g. from [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Firebase](https://console.firebase.google.com/) project with **Email/Password** (or your preferred method) authentication enabled
- A Firebase **service account key** for the backend (`serviceAccount.json`) — see step 2 below
- A [Groq](https://console.groq.com/) API key

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/SiddharthM2416/PockIt.git
cd PockIt
```

### 2. Backend

```bash
cd backend
npm install
```

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

**⚠️ Required: Firebase service account key.** The backend uses Firebase Admin to verify the ID tokens sent by the frontend, so it will not start without a service account key.

1. Go to the [Firebase Console](https://console.firebase.google.com/) → your project → **Project Settings** → **Service Accounts**.
2. Click **Generate new private key**. This downloads a JSON file.
3. Rename it to `serviceAccount.json` and place it directly inside `backend/`:

   ```
   backend/serviceAccount.json
   ```

4. Do **not** commit this file — it should already be covered by `.gitignore`, but double-check.

> This file is only read when `NODE_ENV` is **not** `production`. In production (e.g. on Vercel), the backend instead reads the same JSON from the `FIREBASE_SERVICE_ACCOUNT` environment variable (see `backend/.env.example`) — paste the full file contents there as one line, since you can't upload a file to Vercel. Locally, `.env` + `serviceAccount.json` are both needed; in production, only `FIREBASE_SERVICE_ACCOUNT` is needed.

Start the backend:

```bash
npm start
```

By default it runs on `http://localhost:3000` (or the `PORT` you set).

### 3. Frontend

```bash
cd ../Frontend
npm install
```

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

Start the dev server:

```bash
npm run dev
```

By default it runs on `http://localhost:5173`.

## Environment Variables

Each part of the app has its own `.env.example`:

- [`backend/.env.example`](./backend/.env.example)
- [`Frontend/.env.example`](./Frontend/.env.example)

Copy each to `.env` in the corresponding folder and fill in real values. Never commit real `.env` files or `serviceAccount.json`.

## API Overview

All routes below are prefixed with `/api` and require an `Authorization: Bearer <Firebase ID token>` header unless noted.

| Method | Route                        | Description                                              |
|--------|-------------------------------|-----------------------------------------------------------|
| GET    | `/api/transactions`           | Get all transactions for the authenticated user           |
| POST   | `/api/transactions`           | Create a transaction                                       |
| DELETE | `/api/transactions/:id`       | Delete a transaction (only if owned by the user)           |
| POST   | `/api/send-to-dialogflow`     | Parse free-text input into a structured transaction via Groq |

## Deployment (Vercel)

`vercel.json` builds `backend/app.js` as a serverless function and the `Frontend` as a static site, routing `/api/*` to the backend and everything else to the frontend build. Set all backend and frontend environment variables (see below) in your Vercel project settings, using `NODE_ENV=production` so the backend reads `FIREBASE_SERVICE_ACCOUNT` instead of a local file.

