<div align="center">
  <img src="./apps/web/public/short.svg" width="200" alt="Shortlist Logo" />
  <br />
  <h1>Shortlist</h1>
  <p><b>Semantic Intelligence Engine for High-Fidelity Recruitment</b></p>
  <p><i>The ATS that understands skill, not just keywords.</i></p>
</div>

<br />

---

## 🌟 Overview

**Shortlist** is a state-of-the-art Semantic ATS (Applicant Tracking System) designed to bridge the gap between candidate potential and recruiter efficiency. Unlike traditional systems that rely on rigid keyword matching, Shortlist utilizes **Sentence-Transformer Embeddings** to perform deep semantic analysis of resumes against job descriptions.

By integrating real-world signals from **GitHub** and **LeetCode**, Shortlist provides a 360-degree view of a developer's capabilities, automatically ranking them with precision.

---

## 📸 Visual Walkthrough

### 1. Minimalist Landing Page
The gateway to the platform, featuring an ultra-soft minimalist design with warm gradients and high-impact statistics.
> *High-fidelity design featuring 10x faster screening and 98% match accuracy signals.*

### 2. Recruiter Dashboard
A premium control center for managing job postings. Recruiters can see applicant counts, deadline tracking, and analysis status at a glance.
> *Glassy interface with pill-shaped components and smooth hover interactions.*

### 3. Candidate Experience
A seamless job discovery and application flow. Candidates can search for roles in real-time and apply with a single resume upload.
> *Minimalist job cards with live-search debouncing and CheckCircle status indicators.*

### 4. Deep Analysis Modal
The crown jewel of Shortlist. A comprehensive breakdown of a candidate's fit, showing semantic scores, strengths, and roadmap for improvement.
> *Liquid glass modal featuring LeetCode streaks and skill alignment visualizations.*

---

## 🚀 High-Level Features

### 🧠 Semantic Intelligence (ML Core)
- **Contextual Understanding**: Uses LLM-based embeddings to understand that "React expert" and "Senior Frontend Engineer" are semantically identical.
- **Criteria-Based Scoring**: Recruiters define specific criteria, and the system scores each resume against each criterion individually.
- **Enriched Ranking**: Scores are augmented with real-time scrapers for developer platforms.

### 💼 Recruiter Suite
- **One-Click Analysis**: Process hundreds of resumes simultaneously with a single click.
- **Bulk Feedback System**: Notify selected and rejected candidates in one go with high-fidelity emails.
- **Custom Job Design**: Create positions with weighted criteria to fine-tune the ranking engine.

### 👤 Candidate Portal
- **Live Search**: Debounced, real-time filtering of open positions.
- **Track Applications**: See real-time status updates (Applied, Analysing, Shortlisted).
- **Gamified Profile**: Integration with LeetCode to showcase problem-solving streaks.

### 💎 Liquid Glass UI
- **Glassmorphism**: Backdrop blurs and translucent borders for a modern, premium feel.
- **Micro-interactions**: Spring-based scaling on buttons and smooth entry animations.
- **Premium Alerts**: Custom-built logout and confirmation modals replacing native browser popups.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context + Hooks
- **Animation**: CSS Keyframes + Framer-inspired transitions

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Processing**: BullMQ / Worker threads for heavy ML calls
- **Storage**: Cloudinary for resume assets

### Machine Learning
- **Language**: [Python 3.10+](https://www.python.org/)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **NLP**: [Sentence-Transformers](https://www.sbert.net/) (BERT/SBERT)
- **Tools**: BeautifulSoup4 (Scraping), PDFPlumber (Parsing)

---

## 📐 Architecture

Shortlist follows a decoupled, service-oriented architecture:

1.  **Web Layer (Next.js)**: Handles the premium UI and client-side logic.
2.  **API Layer (Express)**: Orchestrates business logic, authentication, and database operations.
3.  **ML Layer (Python/FastAPI)**: A dedicated microservice for heavy computations, embedding generation, and web scraping.
4.  **Worker Layer**: Asynchronous processing for job analysis to ensure the UI remains responsive.

---

## 📂 Detailed File Structure

```text
Shortlist/
├── apps/
│   ├── web/                     # Frontend Application (Next.js)
│   │   ├── src/
│   │   │   ├── app/             # App Router Pages
│   │   │   │   ├── recruiter/   # Recruiter Dashboard & Job Creation
│   │   │   │   ├── admin/       # Administrative Controls
│   │   │   │   ├── register/    # Onboarding Flow
│   │   │   │   ├── applications/# Candidate Application Tracking
│   │   │   │   ├── jobs/        # Public Job Board with Live Search
│   │   │   │   ├── notifications# Real-time System Notifications
│   │   │   │   └── login/       # Authentication Entry
│   │   │   ├── components/      # UI Component Library
│   │   │   │   ├── Navbar.tsx   # Floating Glassy Navigation
│   │   │   │   └── AnalysisModal.tsx # The Deep Analysis Engine
│   │   │   └── lib/             # Utilities and Contexts
│   │   └── public/              # Static Assets (Logos, SVGs)
│   │
│   └── api/                     # Backend Service (Express)
│       ├── src/
│       │   ├── controllers/     # Route Handlers
│       │   ├── services/        # Business Logic & Third-party Integrations
│       │   ├── models/          # MongoDB Schemas (Job, User, Result, etc.)
│       │   ├── routes/          # API Endpoint Definitions
│       │   ├── middleware/      # Auth, Upload, and Validation
│       │   ├── core/            # DB and Cloudinary Configs
│       │   ├── workers/         # Background Processing (Analyse Worker)
│       │   └── index.ts         # Entry Point
│
├── ml/                          # ML Microservice (Python)
│   ├── main.py                  # FastAPI Entry Point
│   ├── routers/                 # API Routes (Embed, Score, Scrape)
│   ├── services/                # The AI Logic
│   │   ├── embedder.py          # Sentence-Transformer Logic
│   │   ├── scorer.py            # Criteria-to-Resume Semantic Scorer
│   │   ├── parser.py            # Resume Extraction Engine
│   │   ├── github_analyzer.py   # GitHub Metadata Scraper
│   │   └── leetcode_analyzer.py # LeetCode Profile Scraper
│   └── requirements.txt         # ML Dependencies
│
├── storage/                     # Local Temporary Storage
└── README.md                    # You are here
```

---

## 🗺 Platform Pages & Navigation

Shortlist is divided into role-specific environments, each optimized for a distinct part of the recruitment lifecycle.

### 👤 Candidate Journey
- **Landing Page (`/`)**: The minimalist gateway to the platform, highlighting semantic intelligence.
- **Job Board (`/jobs`)**: A real-time, live-searchable database of all open positions.
- **My Applications (`/applications`)**: A personal tracker for submission status and AI-powered feedback.
- **Notifications (`/notifications`)**: Real-time alerts for application milestones.
- **Auth Flow (`/login`, `/register`)**: High-fidelity onboarding and authentication.

### 💼 Recruiter Dashboard
- **Main Dashboard (`/recruiter`)**: A command center for managing job postings and tracking analysis status.
- **Create Job (`/recruiter/create-job`)**: A structured flow for defining roles with weighted semantic criteria.
- **Applicant Ranking (`/recruiter/jobs/[id]`)**: The core analysis interface where candidates are ranked, scored, and bulk-notified.

### 🛡 Administrative Suite
- **Admin Panel (`/admin`)**: A high-level overview of platform health, total users, and active job postings.

---

## 🧪 Machine Learning Pipeline

Shortlist doesn't just scan; it interprets.

1.  **Extraction**: The `parser.py` service uses a combination of regex and layout analysis to pull structured data from PDFs.
2.  **Vectorization**: The `embedder.py` converts both the Job Description and the Resume into 768-dimensional vectors.
3.  **Semantic Alignment**: The `scorer.py` calculates the cosine similarity between the candidate's experience and the recruiter's specific requirements.
4.  **Signal Integration**: The system fetches LeetCode "solved" counts and GitHub "active days" to add a "Practicality Score" to the "Theoretical Match."

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v18+
- Python 3.10+
- MongoDB Instance
- Cloudinary Account

### 1. Backend Setup
```bash
cd apps/api
npm install
# Configure .env with MONGODB_URI and CLOUDINARY_URL
npm run dev
```

### 2. ML Service Setup
```bash
cd ml
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 3. Frontend Setup
```bash
cd apps/web
npm install
npm run dev
```

---

## 🎨 Design Philosophy

Shortlist is built on the **"Less is More"** principle. 
- **Minimalist**: Clear typography and intentional whitespace.
- **High-Fidelity**: Subtle gradients that change based on context.
- **Liquid**: Interfaces that feel fluid, with transitions that guide the user's eye.

---

## 🗺 Roadmap

- [ ] **AI Interviewer**: Automated initial voice screening.
- [ ] **GitHub Deep-Repo Analysis**: Parsing code quality of specific repositories.
- [ ] **Dark Mode**: High-contrast obsidian theme.
- [ ] **Integration**: LinkedIn and Workday connectors.

---

## 🔌 API Documentation

The Shortlist API is designed to be RESTful and highly performant. Below are the key endpoints used to drive the application.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|:--- |:--- |:--- |
| POST | `/register` | Register a new user (Candidate or Recruiter) |
| POST | `/login` | Authenticate and receive a JWT |
| GET | `/me` | Retrieve the currently authenticated user's profile |

### 💼 Jobs Engine (`/api/jobs`)
| Method | Endpoint | Description |
|:--- |:--- |:--- |
| GET | `/` | List all active job postings (with pagination) |
| GET | `/:id` | Get detailed information for a specific job |
| POST | `/` | Create a new job posting (Recruiter only) |
| PUT | `/:id` | Update job details or criteria |
| DELETE | `/:id` | Archive a job posting |

### 📥 Application Flow (`/api/apply`)
| Method | Endpoint | Description |
|:--- |:--- |:--- |
| POST | `/:jobId` | Submit a resume and application |
| GET | `/my-applications` | Track all applications submitted by the current candidate |

### 📊 Analysis & ML (`/api/recruiter`)
| Method | Endpoint | Description |
|:--- |:--- |:--- |
| GET | `/jobs/:id/results` | Fetch ranked candidates for a specific job |
| POST | `/jobs/:id/analyse` | Trigger the semantic analysis engine |
| POST | `/jobs/:id/send-feedback` | Bulk notify candidates of their status |

---

## 🗄 Database Schema (MongoDB)

Shortlist utilizes a flexible Document-based schema to handle complex recruitment data.

### User Model (`user.model.ts`)
```typescript
{
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['CANDIDATE', 'RECRUITER', 'ADMIN'] },
  name: { type: String },
  profile: {
    github: String,
    leetcode: String,
    avatarUrl: String
  }
}
```

### Job Model (`job.model.ts`)
```typescript
{
  title: String,
  companyName: String,
  description: String,
  criteria: [{
    label: String,
    weight: Number // Defaulting to equal weights
  }],
  deadline: Date,
  recruiterId: ObjectId,
  isActive: Boolean,
  analyseStatus: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE'] }
}
```

### Result Model (`result.model.ts`)
```typescript
{
  jobId: ObjectId,
  candidateId: ObjectId,
  finalScore: Number, // 0.0 to 1.0
  breakdown: {
    semanticMatch: Number,
    githubSignal: Number,
    leetcodeSignal: Number
  },
  strengths: [String],
  suggestions: [String],
  analysisDate: Date
}
```

---

## 🧪 Machine Learning Deep Dive

The "Semantic Engine" is the heart of Shortlist. It moves beyond "Exact Match" to "Intent Match."

### 1. Vector Space Modeling
When a recruiter inputs a job description, the system doesn't just store the text. It passes the text through a **Sentence-Transformer (SBERT)** model, which projects the description into a high-dimensional vector space.

### 2. The Scorer Algorithm
For every applicant, the system:
1.  **Extracts Text**: Uses OCR and layout-aware parsers to convert PDFs into clean text.
2.  **Generates Embeddings**: Converts the resume text into its own vector.
3.  **Cosine Similarity**: Calculates the angular distance between the Job Vector and the Resume Vector.
4.  **Signal Normalization**: Fetches external data (GitHub/LeetCode) and normalizes it into a 0-1 scale, then applies a weighted sum to produce the `finalScore`.

### 3. Asynchronous Worker Pattern
Since generating embeddings and scraping external profiles can be time-consuming (2-5 seconds per candidate), we use a **Worker-Queue pattern**.
- The API receives the "Analyse" request and pushes a job to the `analyse-queue`.
- The `analyse.worker.ts` picks up the job and communicates with the Python FastAPI service.
- Once complete, the worker updates the `analyseStatus` in MongoDB and notifies the recruiter via the Dashboard.

---

## 🎨 UI/UX Design tokens

The "Liquid Glass" design system is defined by the following tokens in `globals.css` and Tailwind config:

- **Surface**: `bg-white/40`
- **Blur**: `backdrop-blur-2xl`
- **Border**: `border-white/40`
- **Primary Accent**: `orange-500` (#F97316)
- **Shadow**: `shadow-[0_20px_40px_rgba(0,0,0,0.05)]`
- **Transitions**: `transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)`

---

## 🛠 Advanced Configuration

### Environment Variables

**Backend (`apps/api/.env`):**
```env
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_ultra_secure_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ML_SERVICE_URL=http://localhost:8000
```

**Frontend (`apps/web/.env`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

**ML Service (`ml/.env`):**
```env
MODEL_NAME=all-MiniLM-L6-v2
PORT=8000
```

---

## 🤝 Contribution Guidelines

We welcome contributions to Shortlist! Whether it's a bug fix, a new feature, or a UI enhancement, feel free to submit a Pull Request.

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**

---

---

## 🔍 Module Deep-Dive

### 📂 `apps/web/src/components/Navbar.tsx`
The primary navigation component, implementing a "Floating Pill" design. 
- **Features**: Dynamic role-based links, active path highlighting, and a custom **Liquid Glass Logout Modal**.
- **Tech**: Utilizes `next/navigation` for client-side routing and `lucide-react` for responsive iconography.
- **Interactions**: Implements `backdrop-blur-2xl` with a specific `top-6` offset to ensure a premium floating appearance.

### 📂 `apps/api/src/workers/analyse.worker.ts`
The backbone of the asynchronous analysis pipeline.
- **Logic**: Listens to the `analyse-queue` via BullMQ, fetches unanalyzed applications for a job, and performs sequential calls to the ML service.
- **Error Handling**: Implements a robust retry mechanism to handle ML service timeouts or scraping failures.
- **State Sync**: Updates the `Job` model status from `IN_PROGRESS` to `COMPLETE` upon successful batch processing.

### 📂 `ml/services/scorer.py`
The mathematical engine of Shortlist.
- **Algorithm**: Implements `cosine_similarity` between JD and Resume vectors.
- **Weights**: Dynamically applies importance factors to LeetCode and GitHub signals.
- **Output**: Generates a normalized `finalScore` alongside qualitative "Strengths" and "Suggestions" using semantic distance analysis.

---

## 🛠 Troubleshooting & FAQ

### 1. ML Service Connectivity Issues
**Issue**: Recruiter Dashboard shows "Analysis Failed" or "ML Service Unavailable".
**Solution**: 
- Ensure the Python service is running on the correct port (default: 8000).
- Check the `ML_SERVICE_URL` in `apps/api/.env`.
- Verify the virtual environment is active and all `requirements.txt` are installed.

### 2. Resume Parsing Errors
**Issue**: Specific PDF resumes aren't being parsed correctly.
**Solution**: 
- Shortlist uses `pdfplumber` which handles most text-based PDFs. If a resume is image-based (scanned), the current version will skip it. OCR integration is on the roadmap.

### 3. "Cannot find name 'X'" during Build
**Issue**: TypeScript errors in `apps/web`.
**Solution**: This usually occurs if `lucide-react` icons aren't imported correctly. Ensure all icons (e.g., `Sparkles`, `CheckCircle`, `Bell`) are explicitly imported in the component.

### 4. Database Connection Timeout
**Issue**: API crashes on startup.
**Solution**: Check your MongoDB Atlas whitelist. Ensure the current IP address is permitted to access the cluster.

---

## 🧪 Testing Strategy

Shortlist is tested across three distinct layers:

1.  **Unit Tests (ML)**: Verifying the accuracy of the embedding generation and the consistency of the scorer output.
2.  **Integration Tests (API)**: Testing the full flow from Job Creation -> Application -> Analysis.
3.  **End-to-End (Web)**: Manual and automated UI testing to ensure the "Liquid Glass" interactions are consistent across Chrome, Safari, and Firefox.

---

## 🔒 Security & Performance

- **JWT Authentication**: All sensitive routes are protected by JSON Web Tokens with a 24-hour expiry.
- **Rate Limiting**: API endpoints are limited to prevent scraping abuse.
- **Optimized Assets**: Next.js `Image` component is used for the logo and profile avatars to ensure minimal LCP.
- **Debounced Search**: Job search queries are debounced by 300ms to reduce database load and improve UI responsiveness.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <p><b>Shortlist — Semantic Intelligence for the Modern Recruiter</b></p>
  <img src="./apps/web/public/short.svg" width="60" alt="Shortlist Logo Bottom" />
  <br />
  <p><i>The ATS that actually understands code.</i></p>
</div>
