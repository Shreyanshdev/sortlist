# Shortlist — Test Credentials

> **Password for ALL accounts:** `Test@1234`

---

## 🔑 Admin (Full access — verify/reject recruiters, view stats)

| Email | Password | Role |
|-------|----------|------|
| admin@shortlist.io | Test@1234 | ADMIN |

**How to access:** Login at `/login` → auto-redirects to `/admin`

---

## 🏢 Recruiters (Post jobs, analyse resumes, send feedback)

| # | Name | Email | Password | Company | Status |
|---|------|-------|----------|---------|--------|
| 1 | Priya Sharma | priya@google.com | Test@1234 | Google India | ✅ Verified |
| 2 | Rahul Mehta | rahul@microsoft.com | Test@1234 | Microsoft | ✅ Verified |
| 3 | Ananya Gupta | ananya@flipkart.com | Test@1234 | Flipkart | ✅ Verified |
| 4 | Vikram Singh | vikram@razorpay.com | Test@1234 | Razorpay | ⏳ Pending |
| 5 | Neha Joshi | neha@cred.club | Test@1234 | CRED | ⏳ Pending |

> Recruiters 1-3 are pre-verified and can post jobs immediately.
> Recruiters 4-5 need admin approval — login as admin and verify them from `/admin`.

---

## 👤 Candidates (Browse jobs, apply with resume, view scores)

| # | Name | Email | Password | GitHub | LeetCode |
|---|------|-------|----------|--------|----------|
| 1 | Aarav Patel | aarav@gmail.com | Test@1234 | ✅ | ✅ |
| 2 | Diya Krishnan | diya@gmail.com | Test@1234 | ✅ | ✅ |
| 3 | Arjun Reddy | arjun@gmail.com | Test@1234 | ✅ | ❌ |
| 4 | Meera Nair | meera@gmail.com | Test@1234 | ❌ | ✅ |
| 5 | Rohan Desai | rohan@gmail.com | Test@1234 | ✅ | ✅ |
| 6 | Ishita Banerjee | ishita@gmail.com | Test@1234 | ✅ | ❌ |
| 7 | Karan Chopra | karan@gmail.com | Test@1234 | ❌ | ❌ |
| 8 | Sneha Iyer | sneha@gmail.com | Test@1234 | ✅ | ✅ |
| 9 | Aditya Verma | aditya@gmail.com | Test@1234 | ✅ | ✅ |
| 10 | Kavya Menon | kavya@gmail.com | Test@1234 | ✅ | ❌ |

---

## 📋 Pre-Seeded Jobs

| Job Title | Posted By | Deadline | Criteria |
|-----------|-----------|----------|----------|
| Senior Frontend Engineer | Priya (Google) | 14 days | React, Performance, System Design, Testing |
| Backend Engineer — Node.js | Rahul (Microsoft) | 21 days | Node.js, MongoDB, Distributed Systems, DevOps |
| ML Engineer — NLP | Ananya (Flipkart) | 30 days | Python/ML, NLP/Transformers, Data Eng, Prod ML |

---

## 🧪 Testing Flow

1. **Login as Admin** → `/admin` → Verify Vikram & Neha (pending recruiters)
2. **Login as Recruiter** (e.g. `priya@google.com`) → See jobs on `/recruiter`
3. **Login as Candidate** (e.g. `aarav@gmail.com`) → Browse `/jobs` → Apply with a PDF
4. **Login as Recruiter** → Go to job → Click **Do Analyse** → View ranked results
5. **Select top candidates** → Click **Send Feedback**
6. **Login as Candidate** → Check `/applications` → See score & selection status

---

## 🔧 Environment Variables (`apps/api/.env`)

```
MONGODB_URI=mongodb+srv://Shreyanshdodev:Shreyanshop1@cluster0.dxwyrja.mongodb.net/sortlist
JWT_SECRET=shortlist-dev-jwt-secret-2024-xK9mP2
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_SECRET=dev_secret
GITHUB_TOKEN=<your-github-pat>
REDIS_URL=redis://localhost:6379
PORT=3001
```

> **How to get Cloudinary credentials (free):**
> 1. Go to https://cloudinary.com → Sign up (free tier: 25GB storage)
> 2. Dashboard → Copy **Cloud Name**, **API Key**, and **API Secret**
> 3. Paste them into `apps/api/.env`
