# Semantic ATS Postman Guide

Postman supports importing raw `cURL` commands directly. 
**How to use this file:**
1. Open Postman.
2. Click **Import** (top left).
3. Select **Raw text**.
4. Paste any of the `curl` commands below. Postman will automatically convert it into a fully formatted request!

*(Remember to replace `<YOUR_TOKEN>` and `<JOB_ID>` with real values after logging in and creating/finding a job).*

---

## 1. Authentication

### Register Candidate
```bash
curl --location 'http://localhost:3001/api/auth/register' \
--header 'Content-Type: application/json' \
--data '{
    "email": "candidate@example.com",
    "password": "password123",
    "role": "CANDIDATE",
    "name": "John Doe"
}'
```

### Register Recruiter
```bash
curl --location 'http://localhost:3001/api/auth/register' \
--header 'Content-Type: application/json' \
--data '{
    "email": "recruiter@techcorp.com",
    "password": "password123",
    "role": "RECRUITER",
    "name": "Jane Smith",
    "companyName": "Tech Corp"
}'
```

### Login (Use token from response in subsequent requests)
```bash
curl --location 'http://localhost:3001/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{
    "email": "recruiter@techcorp.com",
    "password": "password123"
}'
```

---

## 2. Admin Operations

*(Requires logging in as an ADMIN user to get the token)*

### Verify Recruiter
```bash
curl --location --request POST 'http://localhost:3001/api/admin/recruiters/<RECRUITER_ID>/verify' \
--header 'Authorization: Bearer <YOUR_TOKEN>'
```

### Get System Stats
```bash
curl --location 'http://localhost:3001/api/admin/stats' \
--header 'Authorization: Bearer <YOUR_TOKEN>'
```

---

## 3. Candidate Flow

### Browse Active Jobs
```bash
curl --location 'http://localhost:3001/api/candidate/jobs'
```

### Apply to Job (Upload Resume)
```bash
curl --location 'http://localhost:3001/api/candidate/jobs/<JOB_ID>/apply' \
--header 'Authorization: Bearer <YOUR_TOKEN>' \
--form 'resume=@"/path/to/your/resume.pdf"'
```

### View My Applications
```bash
curl --location 'http://localhost:3001/api/candidate/applications' \
--header 'Authorization: Bearer <YOUR_TOKEN>'
```

---

## 4. Recruiter Flow

*(Requires logging in as a VERIFIED RECRUITER)*

### Bulk Upload Resumes
```bash
curl --location 'http://localhost:3001/api/recruiter/jobs/<JOB_ID>/bulk-upload' \
--header 'Authorization: Bearer <YOUR_TOKEN>' \
--form 'resumes=@"/path/to/resume1.pdf"' \
--form 'resumes=@"/path/to/resume2.docx"'
```

### Trigger "One-Click Analyse"
```bash
curl --location --request POST 'http://localhost:3001/api/recruiter/jobs/<JOB_ID>/analyse' \
--header 'Authorization: Bearer <YOUR_TOKEN>'
```

### Get Ranked Results
```bash
curl --location 'http://localhost:3001/api/recruiter/jobs/<JOB_ID>/results' \
--header 'Authorization: Bearer <YOUR_TOKEN>'
```

### Send Feedback to Selected Candidates
```bash
curl --location 'http://localhost:3001/api/recruiter/jobs/<JOB_ID>/send-feedback' \
--header 'Authorization: Bearer <YOUR_TOKEN>' \
--header 'Content-Type: application/json' \
--data '{
    "selectedResultIds": ["<RESULT_ID_1>", "<RESULT_ID_2>"]
}'
```

---

## 5. Notifications

### Get Unread Notifications
```bash
curl --location 'http://localhost:3001/api/notifications' \
--header 'Authorization: Bearer <YOUR_TOKEN>'
```

### Mark All as Read
```bash
curl --location --request POST 'http://localhost:3001/api/notifications/read-all' \
--header 'Authorization: Bearer <YOUR_TOKEN>'
```
