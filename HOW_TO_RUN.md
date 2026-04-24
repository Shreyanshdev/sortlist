# How to Run Shortlist

You need **3 terminals** to run the full stack, plus **MongoDB** and **Redis** running.

---

## Prerequisites

Make sure these are running before starting:

| Service | How to start | Default URL |
|---------|-------------|-------------|
| **MongoDB** | `brew services start mongodb-community` or use [MongoDB Atlas](https://cloud.mongodb.com) | `mongodb://localhost:27017` |
| **Redis** | `brew install redis && brew services start redis` | `redis://localhost:6379` |

---

## Step 1 — Fill in Environment Variables

### Backend (`apps/api/.env`)
```
MONGODB_URI=mongodb://localhost:27017/shortlist
JWT_SECRET=your-super-secret-key-here
S3_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_SECRET=dev_secret
GITHUB_TOKEN=your-github-pat
REDIS_URL=redis://localhost:6379
PORT=3001
```

### Frontend (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Step 2 — Start ML Service (Terminal 1)

```bash
cd ml
source venv/bin/activate
python3 main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Verify: Open http://localhost:8000/health → should return `{"status": "ok"}`

---

## Step 3 — Start Backend API (Terminal 2)

```bash
cd apps/api
npx ts-node -r dotenv/config src/index.ts
```

You should see:
```
MongoDB connected
Server listening on port 3001
```

Verify: Open http://localhost:3001/api/candidate/jobs → should return `{"jobs":[],...}`

---

## Step 4 — Start Frontend (Terminal 3)

```bash
cd apps/web
npm run dev
```

You should see:
```
▲ Next.js 16.x
- Local: http://localhost:3000
```

Open http://localhost:3000 → Landing page should appear.

---

## Quick Smoke Test Flow

1. Open http://localhost:3000/register → Register as a **Recruiter**
2. You need an admin to verify. Create one manually:
   ```bash
   # In a new terminal, run:
   cd apps/api
   npx ts-node -e "
   require('dotenv').config();
   const mongoose = require('mongoose');
   const bcrypt = require('bcrypt');
   mongoose.connect(process.env.MONGODB_URI).then(async () => {
     const hash = await bcrypt.hash('admin123', 10);
     await mongoose.connection.db.collection('users').insertOne({
       email: 'admin@shortlist.io',
       passwordHash: hash,
       role: 'ADMIN',
       createdAt: new Date(),
       updatedAt: new Date()
     });
     console.log('Admin created: admin@shortlist.io / admin123');
     process.exit(0);
   });
   "
   ```
3. Login as admin at `/login` → Go to `/admin` → Verify the recruiter
4. Login as the recruiter → Create a job at `/recruiter/create-job`
5. Register as a **Candidate** → Browse jobs at `/jobs` → Apply with a PDF
6. Login as recruiter → Go to the job → Click **Do Analyse**
7. Wait for analysis → Select candidates → Click **Send Feedback**
8. Login as candidate → Check `/applications` → See your score!

---

## Ports Summary

| Service | Port | URL |
|---------|------|-----|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend API (Express) | 3001 | http://localhost:3001 |
| ML Service (FastAPI) | 8000 | http://localhost:8000 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Redis | 6379 | redis://localhost:6379 |
