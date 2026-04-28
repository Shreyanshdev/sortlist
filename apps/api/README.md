<div align="center">
  <img src="../../apps/web/public/short.svg" width="120" alt="Shortlist Logo" />
  <h1>Shortlist — API Service</h1>
  <p><b>The Orchestration Core of Semantic Recruitment</b></p>
</div>

<br />

## 🌟 Overview

The `api` service is the central nervous system of Shortlist. Built with **Express.js** and **TypeScript**, it handles multi-role authentication, business logic orchestration, database management via **MongoDB**, and high-latency task offloading to the **Machine Learning** microservice.

---

## 🏗 Architecture

The API follows a modular service-oriented architecture:

1.  **Controllers**: Interface with the HTTP layer, handling request validation and response formatting.
2.  **Services**: Contain the core business logic, from job creation to feedback orchestration.
3.  **Models**: Type-safe Mongoose schemas ensuring data integrity across the platform.
4.  **Workers**: Asynchronous processors (using BullMQ / Workers) that manage the lifecycle of a resume analysis job.

---

## 🚀 Core Functionalities

### 🔐 Multi-Role RBAC
A robust Role-Based Access Control system distinguishing between:
- **Candidates**: Can apply to jobs, track status, and view their own analysis.
- **Recruiters**: Can manage positions, trigger analysis, and send bulk feedback.
- **Admins**: Platform-wide monitoring and user management.

### 🧠 ML Orchestration
The API acts as a gateway to the Python ML service. It:
- Offloads resume parsing and embedding generation.
- Collects and normalizes GitHub/LeetCode signals.
- Aggregates semantic scores into a final, actionable rank.

### 📦 Asset Management
Integrated with **Cloudinary** for secure, high-performance storage and retrieval of candidate resumes.

---

## 🧪 Database Models

### Job System
- `Job`: Metadata, criteria definitions, and analysis status.
- `Application`: Relationship between candidates and positions.
- `Result`: The output of the ML engine, including scores and qualitative strengths.

### Notification System
- Real-time status updates delivered to users when an analysis completes or feedback is sent.

---

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **ODM**: [Mongoose](https://mongoosejs.com/)
- **Storage**: [Cloudinary](https://cloudinary.com/)
- **ML Gateway**: [Axios](https://axios-http.com/)

---

## ⚙️ Development

### Prerequisites
- Node.js v18+
- MongoDB Instance
- Cloudinary Credentials

### Setup Environment
Create a `.env` file:
```env
PORT=5001
MONGODB_URI=mongodb+srv://your_uri
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ML_SERVICE_URL=http://localhost:8000
```

### Run Locally
```bash
npm install
npm run dev
```

---

<div align="center">
  <p>Part of the <a href="../../README.md">Shortlist Ecosystem</a></p>
</div>
