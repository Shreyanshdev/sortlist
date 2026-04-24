# Semantic ATS Engine — Production Implementation Guide

> **Stack:** Node.js + Express (Backend) · Next.js (Frontend) · TailwindCSS (Design) · Python (ML Pipeline)
> **Architecture:** Modular Monorepo with Microservice-ready service boundaries
> **Audience:** Full-stack developers building the platform end-to-end

---

## Table of Contents

1. [System Vision & Architecture Decision](#1-system-vision--architecture-decision)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Data Models & Database Schema](#3-data-models--database-schema)
4. [Admin Panel — Implementation](#4-admin-panel--implementation)
5. [Candidate Panel — Implementation](#5-candidate-panel--implementation)
6. [Recruiter Panel — Implementation](#6-recruiter-panel--implementation)
7. [ML Pipeline (Python)](#7-ml-pipeline-python)
8. [External Data Integration](#8-external-data-integration)
9. [API Design (Node.js / Express)](#9-api-design-nodejs--express)
10. [Frontend — Next.js Architecture](#10-frontend--nextjs-architecture)
11. [Performance & Scalability](#11-performance--scalability)
12. [Security](#12-security)
13. [Environment Configuration](#13-environment-configuration)
14. [Deployment Strategy](#14-deployment-strategy)
15. [Developer Workflow](#15-developer-workflow)

---

## 1. System Vision & Architecture Decision

### What This System Replaces

Traditional ATS platforms do keyword matching:
```
"Python" in resume? → match: yes/no
```

This system does **semantic matching**:
```
embedding("3 years building REST APIs") ≈ embedding("backend development experience") → similarity: 0.87
```

### Architecture Decision: Modular Monolith → Microservice-Ready

**Choice: Modular Monolith with clear service boundaries.**

**Why not pure microservices at start:**
- Premature microservices add DevOps overhead without benefit at MVP stage
- Python ML pipeline is already a natural service boundary
- Node.js backend is a single deployable with internal module isolation
- Can extract services later without rewriting logic

**Deployment topology:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│              Next.js (Vercel) — SSR + API Routes                │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                      GATEWAY LAYER                              │
│         Node.js + Express — Auth, Routing, Rate Limiting        │
│                   (Railway / Render)                            │
└──────┬──────────────┬──────────────┬───────────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────────────────────────┐
│  Auth Svc   │ │  File Svc  │ │       ML Pipeline Svc          │
│  (JWT/OAuth)│ │ (S3/R2)    │ │  Python FastAPI (internal)     │
└─────────────┘ └────────────┘ │  /embed /score /rank /explain  │
                               └────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼─────────────────────┐
│                       DATA LAYER                                │
│   PostgreSQL (users, jobs, templates)  Redis (cache, queues)   │
│   S3/R2 (resume files)                                         │
└────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle (Full Flow)

```
1. Recruiter uploads 50 resumes for Job Template #42
2. POST /api/resumes/bulk → Express validates JWT + role
3. Files uploaded to S3, job queued in Redis (Bull queue)
4. Worker picks up job → calls Python ML service
5. Python: parse PDF → extract text → embed → score vs template
6. Python calls GitHub API if links present → enriches score
7. Results written to PostgreSQL → cache invalidated
8. Recruiter frontend polls /api/jobs/42/results → ranked list returned
9. Recruiter selects candidates → system triggers notification jobs
```

---

## 2. Monorepo Structure

```
semantic-ats/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/                      # App Router (Next.js 14+)
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx        # Admin shell + nav
│   │   │   │   ├── page.tsx          # Admin dashboard
│   │   │   │   ├── users/page.tsx
│   │   │   │   └── recruiters/page.tsx
│   │   │   ├── candidate/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Candidate dashboard
│   │   │   │   ├── upload/page.tsx
│   │   │   │   └── results/page.tsx
│   │   │   └── recruiter/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx          # Recruiter dashboard
│   │   │       ├── templates/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── create/page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       └── jobs/
│   │   │           ├── page.tsx
│   │   │           └── [id]/
│   │   │               ├── page.tsx
│   │   │               └── candidates/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui base components
│   │   │   ├── resume/
│   │   │   │   ├── ResumeUploader.tsx
│   │   │   │   ├── ScoreCard.tsx
│   │   │   │   └── FeedbackPanel.tsx
│   │   │   ├── recruiter/
│   │   │   │   ├── TemplateBuilder.tsx
│   │   │   │   ├── CriteriaSlider.tsx
│   │   │   │   ├── CandidateRankTable.tsx
│   │   │   │   └── BulkUploader.tsx
│   │   │   └── admin/
│   │   │       ├── RecruiterVerifyCard.tsx
│   │   │       └── UserTable.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                # Typed API client
│   │   │   ├── auth.ts               # NextAuth config
│   │   │   └── types.ts              # Shared TypeScript types
│   │   └── middleware.ts             # Route protection
│   │
│   └── api/                          # Node.js + Express backend
│       ├── src/
│       │   ├── index.ts              # Entry point
│       │   ├── app.ts                # Express app setup
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── admin.routes.ts
│       │   │   ├── candidate.routes.ts
│       │   │   ├── recruiter.routes.ts
│       │   │   ├── resume.routes.ts
│       │   │   ├── template.routes.ts
│       │   │   └── ml.routes.ts      # Proxy to Python ML service
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── user.service.ts
│       │   │   ├── resume.service.ts
│       │   │   ├── template.service.ts
│       │   │   ├── ml.service.ts     # HTTP client to Python
│       │   │   ├── github.service.ts
│       │   │   ├── leetcode.service.ts
│       │   │   ├── notification.service.ts
│       │   │   └── queue.service.ts  # Bull queue management
│       │   ├── models/
│       │   │   ├── user.model.ts
│       │   │   ├── resume.model.ts
│       │   │   ├── template.model.ts
│       │   │   ├── job.model.ts
│       │   │   └── result.model.ts
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   ├── role.middleware.ts
│       │   │   ├── rateLimit.middleware.ts
│       │   │   ├── upload.middleware.ts
│       │   │   └── validate.middleware.ts
│       │   ├── workers/
│       │   │   ├── resume.worker.ts  # Processes resume scoring queue
│       │   │   └── notify.worker.ts  # Handles notifications
│       │   ├── core/
│       │   │   ├── db.ts             # Prisma client
│       │   │   ├── redis.ts          # Redis client
│       │   │   ├── s3.ts             # S3/R2 client
│       │   │   └── logger.ts         # Winston logger
│       │   └── utils/
│       │       ├── jwt.utils.ts
│       │       ├── hash.utils.ts
│       │       └── validation.utils.ts
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
└── ml/                               # Python ML pipeline (separate service)
    ├── main.py                       # FastAPI app
    ├── routers/
    │   ├── embed.py
    │   ├── score.py
    │   ├── rank.py
    │   └── explain.py
    ├── services/
    │   ├── parser.py                 # Resume PDF/DOCX parser
    │   ├── embedder.py               # Sentence-transformers wrapper
    │   ├── scorer.py                 # Scoring logic
    │   ├── ranker.py                 # Ranking + weighting
    │   ├── explainer.py              # Explainability layer
    │   ├── github_analyzer.py
    │   └── leetcode_analyzer.py
    ├── models/
    │   ├── schemas.py                # Pydantic models
    │   └── cache.py                  # Embedding cache
    ├── utils/
    │   ├── text_cleaner.py
    │   └── section_detector.py
    └── requirements.txt
```

---

## 3. Data Models & Database Schema

### Prisma Schema (`apps/api/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────

enum Role {
  ADMIN
  RECRUITER
  CANDIDATE
}

enum RecruiterStatus {
  PENDING
  VERIFIED
  REJECTED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          Role      @default(CANDIDATE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  candidate     Candidate?
  recruiter     Recruiter?
  sessions      Session[]

  @@index([email])
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────
// CANDIDATE
// ─────────────────────────────────────────

model Candidate {
  id            String    @id @default(cuid())
  userId        String    @unique
  name          String
  linkedinUrl   String?
  githubUrl     String?
  leetcodeUrl   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  resumes       Resume[]
  results       CandidateResult[]

  @@index([userId])
}

// ─────────────────────────────────────────
// RECRUITER (with verification state machine)
// ─────────────────────────────────────────

model Recruiter {
  id              String          @id @default(cuid())
  userId          String          @unique
  name            String
  companyName     String
  companyEmail    String
  companyWebsite  String?
  linkedinUrl     String?
  status          RecruiterStatus @default(PENDING)
  rejectionReason String?
  verifiedAt      DateTime?
  verifiedBy      String?         // Admin userId
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  templates       JobTemplate[]

  @@index([status])
  @@index([userId])
}

// ─────────────────────────────────────────
// RESUME
// ─────────────────────────────────────────

enum ResumeStatus {
  UPLOADED
  PARSING
  PARSED
  EMBEDDING
  SCORED
  FAILED
}

model Resume {
  id            String        @id @default(cuid())
  candidateId   String
  filename      String
  s3Key         String        @unique
  mimeType      String
  fileSize      Int
  status        ResumeStatus  @default(UPLOADED)
  rawText       String?       @db.Text
  parsedSections Json?        // { skills: [], experience: [], education: [], summary: "" }
  embeddingCached Boolean     @default(false)
  errorMessage  String?
  uploadedAt    DateTime      @default(now())
  processedAt   DateTime?

  candidate     Candidate     @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  results       CandidateResult[]

  @@index([candidateId])
  @@index([status])
}

// ─────────────────────────────────────────
// JOB TEMPLATE
// ─────────────────────────────────────────

model JobTemplate {
  id            String    @id @default(cuid())
  recruiterId   String
  title         String
  description   String    @db.Text
  criteria      Json      // CriteriaItem[]
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  recruiter     Recruiter @relation(fields: [recruiterId], references: [id], onDelete: Cascade)
  results       CandidateResult[]

  @@index([recruiterId])
}

// Criteria JSON structure (stored in JobTemplate.criteria):
// [
//   { id: "c1", label: "Backend Development", weight: 0.3, embeddingCached: true },
//   { id: "c2", label: "React & Frontend", weight: 0.2, embeddingCached: false },
//   { id: "c3", label: "DevOps & CI/CD", weight: 0.15, embeddingCached: true },
//   { id: "c4", label: "System Design", weight: 0.2, embeddingCached: false },
//   { id: "c5", label: "Communication", weight: 0.15, embeddingCached: false }
// ]

// ─────────────────────────────────────────
// SCORING RESULTS
// ─────────────────────────────────────────

enum ResultStatus {
  PENDING
  PROCESSING
  COMPLETE
  FAILED
}

model CandidateResult {
  id              String        @id @default(cuid())
  templateId      String
  resumeId        String
  candidateId     String
  status          ResultStatus  @default(PENDING)
  
  // Scores (0.0 – 1.0)
  resumeScore     Float?
  githubScore     Float?
  leetcodeScore   Float?
  finalScore      Float?        // Weighted composite

  // Breakdown per criterion
  criteriaScores  Json?         // { criterionId: { score, matchedSentence, confidence } }

  // Explainability
  strengths       Json?         // string[]
  weaknesses      Json?         // string[]
  suggestions     Json?         // string[]
  explanation     String?       @db.Text

  // Recruiter actions
  isSelected      Boolean       @default(false)
  recruiterNote   String?
  notifiedAt      DateTime?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  template        JobTemplate   @relation(fields: [templateId], references: [id])
  resume          Resume        @relation(fields: [resumeId], references: [id])
  candidate       Candidate     @relation(fields: [candidateId], references: [id])

  @@unique([templateId, resumeId])
  @@index([templateId])
  @@index([finalScore])
  @@index([isSelected])
}

// ─────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────

enum NotificationType {
  RECRUITER_VERIFIED
  RECRUITER_REJECTED
  CANDIDATE_SELECTED
  CANDIDATE_REJECTED
  PROCESSING_COMPLETE
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  payload   Json
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  @@index([userId, read])
}
```

---

## 4. Admin Panel — Implementation

### 4.1 Recruiter Verification State Machine

```
                  ┌─────────┐
                  │ PENDING │  ← Default state on recruiter registration
                  └────┬────┘
                       │
           ┌───────────┴───────────┐
           │                       │
    Admin approves           Admin rejects
           │                       │
    ┌──────▼──────┐        ┌───────▼──────┐
    │  VERIFIED   │        │   REJECTED   │
    └─────────────┘        └──────────────┘
    (can access system)    (blocked + reason stored)
```

**Transitions allowed:**
- `PENDING → VERIFIED` (admin action)
- `PENDING → REJECTED` (admin action)
- `REJECTED → PENDING` (recruiter can re-apply after fixing info)
- `VERIFIED → REJECTED` (admin can revoke — edge case: fraud detected)

### 4.2 Admin Routes (`apps/api/src/routes/admin.routes.ts`)

```typescript
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

// All admin routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

router.get('/users',                    AdminController.listUsers);
router.get('/users/:id',                AdminController.getUser);
router.get('/recruiters',               AdminController.listRecruiters);
router.get('/recruiters/pending',       AdminController.listPendingRecruiters);
router.post('/recruiters/:id/verify',   AdminController.verifyRecruiter);
router.post('/recruiters/:id/reject',   AdminController.rejectRecruiter);
router.get('/resumes',                  AdminController.listAllResumes);
router.get('/stats',                    AdminController.getSystemStats);

export default router;
```

### 4.3 Admin Service (`apps/api/src/services/admin.service.ts`)

```typescript
import { prisma } from '../core/db';
import { NotificationService } from './notification.service';
import { AppError } from '../utils/errors';

export class AdminService {

  static async verifyRecruiter(recruiterId: string, adminId: string) {
    const recruiter = await prisma.recruiter.findUnique({
      where: { id: recruiterId },
      include: { user: true }
    });

    if (!recruiter) throw new AppError('Recruiter not found', 404);
    if (recruiter.status === 'VERIFIED') throw new AppError('Already verified', 400);

    const updated = await prisma.recruiter.update({
      where: { id: recruiterId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: adminId,
        rejectionReason: null
      }
    });

    // Notify recruiter
    await NotificationService.create({
      userId: recruiter.userId,
      type: 'RECRUITER_VERIFIED',
      payload: {
        message: 'Your recruiter account has been verified. You can now access all features.',
        verifiedAt: updated.verifiedAt
      }
    });

    return updated;
  }

  static async rejectRecruiter(recruiterId: string, adminId: string, reason: string) {
    const recruiter = await prisma.recruiter.findUnique({
      where: { id: recruiterId },
      include: { user: true }
    });

    if (!recruiter) throw new AppError('Recruiter not found', 404);

    const updated = await prisma.recruiter.update({
      where: { id: recruiterId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        verifiedBy: adminId
      }
    });

    await NotificationService.create({
      userId: recruiter.userId,
      type: 'RECRUITER_REJECTED',
      payload: { message: `Your application was rejected: ${reason}` }
    });

    return updated;
  }

  static async getSystemStats() {
    const [totalUsers, totalResumes, pendingRecruiters, verifiedRecruiters, totalResults] =
      await Promise.all([
        prisma.user.count(),
        prisma.resume.count(),
        prisma.recruiter.count({ where: { status: 'PENDING' } }),
        prisma.recruiter.count({ where: { status: 'VERIFIED' } }),
        prisma.candidateResult.count({ where: { status: 'COMPLETE' } })
      ]);

    return { totalUsers, totalResumes, pendingRecruiters, verifiedRecruiters, totalResults };
  }
}
```

### 4.4 Recruiter Verification — Security Considerations

**Fake recruiter prevention checklist:**

```typescript
// apps/api/src/services/recruiter-verification.service.ts

export class RecruiterVerificationService {

  // Check 1: Company email domain must match claimed company
  static async validateEmailDomain(companyEmail: string, companyName: string): Promise<boolean> {
    const domain = companyEmail.split('@')[1];
    // Reject free email providers
    const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (freeProviders.includes(domain)) {
      return false; // Must use corporate email
    }
    return true;
  }

  // Check 2: Rate limit registrations per IP
  static readonly MAX_RECRUITER_REGISTRATIONS_PER_IP = 3;

  // Check 3: Flag duplicate company registrations
  static async checkDuplicateCompany(companyName: string, companyEmail: string) {
    const existingDomain = companyEmail.split('@')[1];
    const existing = await prisma.recruiter.findFirst({
      where: {
        companyEmail: { endsWith: `@${existingDomain}` },
        status: 'VERIFIED'
      }
    });
    // If same domain already has verified recruiter, flag for admin review
    return { isDuplicate: !!existing, existingRecruiter: existing };
  }

  // Admin verification checklist (surfaced in UI)
  static getVerificationChecklist(recruiter: Recruiter) {
    return [
      {
        item: 'Corporate email domain',
        passed: !['gmail.com','yahoo.com'].includes(recruiter.companyEmail.split('@')[1]),
        value: recruiter.companyEmail.split('@')[1]
      },
      {
        item: 'LinkedIn profile provided',
        passed: !!recruiter.linkedinUrl,
        value: recruiter.linkedinUrl
      },
      {
        item: 'Company website provided',
        passed: !!recruiter.companyWebsite,
        value: recruiter.companyWebsite
      },
      {
        item: 'No duplicate domain registrations',
        passed: true, // computed separately
        value: 'Check manually'
      }
    ];
  }
}
```

---

## 5. Candidate Panel — Implementation

### 5.1 Registration & Profile Flow

```
1. POST /api/auth/register → creates User (CANDIDATE role) + Candidate profile
2. PATCH /api/candidate/profile → adds LinkedIn/GitHub/LeetCode links
3. POST /api/resumes/upload → uploads PDF/DOCX → triggers ML pipeline
4. GET /api/candidate/results/:resumeId → returns score + feedback
```

### 5.2 Resume Upload Service (`apps/api/src/services/resume.service.ts`)

```typescript
import { prisma } from '../core/db';
import { s3Client } from '../core/s3';
import { queueService } from './queue.service';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export class ResumeService {

  static async uploadResume(
    candidateId: string,
    file: Express.Multer.File
  ) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Only PDF and DOCX files are allowed', 400);
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError('File size must be under 5MB', 400);
    }

    const s3Key = `resumes/${candidateId}/${uuidv4()}-${file.originalname}`;

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: 'AES256'
    }));

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        candidateId,
        filename: file.originalname,
        s3Key,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: 'UPLOADED'
      }
    });

    // Queue processing job
    await queueService.addResumeJob({
      resumeId: resume.id,
      candidateId,
      s3Key,
      jobType: 'FULL_ANALYSIS' // parse + embed + score
    });

    return resume;
  }

  static async getCandidateFeedback(resumeId: string, candidateId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, candidateId },
      include: {
        results: {
          include: { template: { select: { title: true } } },
          orderBy: { finalScore: 'desc' }
        }
      }
    });

    if (!resume) throw new AppError('Resume not found', 404);

    return {
      resume: {
        id: resume.id,
        filename: resume.filename,
        status: resume.status,
        parsedSections: resume.parsedSections
      },
      results: resume.results.map(r => ({
        templateTitle: r.template.title,
        finalScore: r.finalScore,
        resumeScore: r.resumeScore,
        githubScore: r.githubScore,
        leetcodeScore: r.leetcodeScore,
        criteriaScores: r.criteriaScores,
        strengths: r.strengths,
        weaknesses: r.weaknesses,
        suggestions: r.suggestions,
        explanation: r.explanation
      }))
    };
  }
}
```

### 5.3 Queue Worker (`apps/api/src/workers/resume.worker.ts`)

```typescript
import Bull from 'bull';
import { redis } from '../core/redis';
import { MLService } from '../services/ml.service';
import { GitHubService } from '../services/github.service';
import { LeetCodeService } from '../services/leetcode.service';
import { prisma } from '../core/db';

const resumeQueue = new Bull('resume-processing', { redis: process.env.REDIS_URL });

resumeQueue.process('FULL_ANALYSIS', 5, async (job) => {
  const { resumeId, candidateId, s3Key } = job.data;

  try {
    await prisma.resume.update({ where: { id: resumeId }, data: { status: 'PARSING' } });

    // Step 1: Parse resume via ML service
    const parseResult = await MLService.parseResume(s3Key);
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        status: 'PARSED',
        rawText: parseResult.rawText,
        parsedSections: parseResult.sections
      }
    });

    // Step 2: Fetch candidate profile for external links
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });

    // Step 3: Enrich with external signals (graceful fallback)
    const [githubData, leetcodeData] = await Promise.allSettled([
      candidate?.githubUrl ? GitHubService.analyze(candidate.githubUrl) : null,
      candidate?.leetcodeUrl ? LeetCodeService.analyze(candidate.leetcodeUrl) : null
    ]);

    const externalData = {
      github: githubData.status === 'fulfilled' ? githubData.value : null,
      leetcode: leetcodeData.status === 'fulfilled' ? leetcodeData.value : null
    };

    // Step 4: Score vs all active job templates
    await prisma.resume.update({ where: { id: resumeId }, data: { status: 'EMBEDDING' } });

    const templates = await prisma.jobTemplate.findMany({ where: { isActive: true } });

    for (const template of templates) {
      const scoreResult = await MLService.scoreResume({
        resumeId,
        parsedSections: parseResult.sections,
        criteria: template.criteria,
        externalData
      });

      await prisma.candidateResult.upsert({
        where: { templateId_resumeId: { templateId: template.id, resumeId } },
        create: {
          templateId: template.id,
          resumeId,
          candidateId,
          status: 'COMPLETE',
          ...scoreResult
        },
        update: {
          status: 'COMPLETE',
          ...scoreResult
        }
      });
    }

    await prisma.resume.update({
      where: { id: resumeId },
      data: { status: 'SCORED', processedAt: new Date() }
    });

  } catch (error) {
    await prisma.resume.update({
      where: { id: resumeId },
      data: { status: 'FAILED', errorMessage: String(error) }
    });
    throw error; // Bull will retry
  }
});

// Retry config
resumeQueue.on('failed', (job, err) => {
  console.error(`Resume job ${job.id} failed:`, err.message);
});

export { resumeQueue };
```

---

## 6. Recruiter Panel — Implementation

### 6.1 Access Guard

```typescript
// apps/api/src/middleware/role.middleware.ts

import { RequestHandler } from 'express';
import { prisma } from '../core/db';

export const requireVerifiedRecruiter: RequestHandler = async (req, res, next) => {
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user?.role !== 'RECRUITER') return res.status(403).json({ error: 'Forbidden' });

  const recruiter = await prisma.recruiter.findUnique({ where: { userId } });

  if (!recruiter) {
    return res.status(403).json({ error: 'Recruiter profile not found' });
  }

  if (recruiter.status === 'PENDING') {
    return res.status(403).json({
      error: 'Account pending verification',
      code: 'RECRUITER_PENDING',
      message: 'Your account is under review. You will be notified once approved.'
    });
  }

  if (recruiter.status === 'REJECTED') {
    return res.status(403).json({
      error: 'Account verification rejected',
      code: 'RECRUITER_REJECTED',
      reason: recruiter.rejectionReason
    });
  }

  req.recruiter = recruiter;
  next();
};
```

### 6.2 Job Template Schema & Builder

**Template criteria JSON schema:**
```typescript
// apps/api/src/models/template.model.ts

export interface CriteriaItem {
  id: string;          // UUID
  label: string;       // Human-readable: "Backend Development Experience"
  weight: number;      // 0.0 – 1.0 (all weights must sum to 1.0)
  description?: string; // Optional detail for embedding precision
  embeddingCached: boolean;
}

export interface JobTemplatePayload {
  title: string;
  description: string;
  criteria: CriteriaItem[];
}

// Validation logic
export function validateCriteria(criteria: CriteriaItem[]): { valid: boolean; error?: string } {
  if (criteria.length < 1) return { valid: false, error: 'At least 1 criterion required' };
  if (criteria.length > 10) return { valid: false, error: 'Maximum 10 criteria allowed' };

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    return { valid: false, error: `Weights must sum to 1.0, got ${totalWeight.toFixed(2)}` };
  }

  for (const c of criteria) {
    if (c.weight < 0.05) return { valid: false, error: `Weight for "${c.label}" must be at least 5%` };
  }

  return { valid: true };
}
```

### 6.3 Template Service (`apps/api/src/services/template.service.ts`)

```typescript
import { prisma } from '../core/db';
import { MLService } from './ml.service';
import { validateCriteria } from '../models/template.model';

export class TemplateService {

  static async createTemplate(recruiterId: string, payload: JobTemplatePayload) {
    const validation = validateCriteria(payload.criteria);
    if (!validation.valid) throw new AppError(validation.error!, 400);

    const template = await prisma.jobTemplate.create({
      data: {
        recruiterId,
        title: payload.title,
        description: payload.description,
        criteria: payload.criteria
      }
    });

    // Pre-compute embeddings for criteria in background
    setImmediate(async () => {
      await MLService.precomputeCriteriaEmbeddings(template.id, payload.criteria);
    });

    return template;
  }

  static async uploadBulkResumesForTemplate(
    templateId: string,
    recruiterId: string,
    files: Express.Multer.File[]
  ) {
    const template = await prisma.jobTemplate.findFirst({
      where: { id: templateId, recruiterId }
    });
    if (!template) throw new AppError('Template not found', 404);

    const results = [];
    for (const file of files) {
      // Create an anonymous candidate slot for recruiter-uploaded resumes
      // (not linked to a registered candidate account)
      const anonCandidate = await prisma.candidate.create({
        data: {
          userId: `recruiter-upload-${Date.now()}`,
          name: file.originalname.replace(/\.[^/.]+$/, '')
        }
      });
      const resume = await ResumeService.uploadResume(anonCandidate.id, file);
      results.push(resume);
    }
    return results;
  }

  static async getRankedCandidates(templateId: string, recruiterId: string) {
    const template = await prisma.jobTemplate.findFirst({
      where: { id: templateId, recruiterId }
    });
    if (!template) throw new AppError('Template not found', 404);

    const results = await prisma.candidateResult.findMany({
      where: { templateId, status: 'COMPLETE' },
      include: {
        candidate: { select: { name: true, githubUrl: true, linkedinUrl: true } },
        resume: { select: { filename: true, parsedSections: true } }
      },
      orderBy: { finalScore: 'desc' }
    });

    return results.map((r, index) => ({
      rank: index + 1,
      candidateId: r.candidateId,
      candidateName: r.candidate.name,
      resumeFilename: r.resume.filename,
      finalScore: r.finalScore,
      scoreBreakdown: {
        resume: r.resumeScore,
        github: r.githubScore,
        leetcode: r.leetcodeScore
      },
      criteriaScores: r.criteriaScores,
      strengths: r.strengths,
      weaknesses: r.weaknesses,
      explanation: r.explanation,
      isSelected: r.isSelected,
      links: {
        github: r.candidate.githubUrl,
        linkedin: r.candidate.linkedinUrl
      }
    }));
  }

  static async selectCandidates(templateId: string, candidateIds: string[]) {
    const tx = await prisma.$transaction(async (tx) => {
      // Deselect all first
      await tx.candidateResult.updateMany({
        where: { templateId },
        data: { isSelected: false }
      });

      // Select chosen ones
      await tx.candidateResult.updateMany({
        where: { templateId, candidateId: { in: candidateIds } },
        data: { isSelected: true }
      });

      // Queue notifications
      for (const candidateId of candidateIds) {
        await NotificationService.create({
          userId: candidateId,
          type: 'CANDIDATE_SELECTED',
          payload: { templateId, message: 'You have been shortlisted!' }
        });
      }

      // Notify rejected candidates with feedback
      const rejectedResults = await tx.candidateResult.findMany({
        where: { templateId, isSelected: false, status: 'COMPLETE' }
      });

      for (const result of rejectedResults) {
        await NotificationService.create({
          userId: result.candidateId,
          type: 'CANDIDATE_REJECTED',
          payload: {
            suggestions: result.suggestions,
            message: 'Keep improving! Here are personalized suggestions.'
          }
        });
      }
    });
    return tx;
  }
}
```

---

## 7. ML Pipeline (Python)

### 7.1 Setup (`ml/requirements.txt`)

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sentence-transformers==3.0.1
pdfplumber==0.11.0
python-docx==1.1.2
torch==2.3.0
numpy==1.26.4
scikit-learn==1.5.0
httpx==0.27.0
redis==5.0.4
pydantic==2.7.1
python-multipart==0.0.9
boto3==1.34.100
```

### 7.2 FastAPI Entry Point (`ml/main.py`)

```python
from fastapi import FastAPI
from routers import embed, score, rank, explain

app = FastAPI(title="Semantic ATS ML Service", version="1.0.0")

app.include_router(embed.router, prefix="/embed", tags=["embedding"])
app.include_router(score.router, prefix="/score", tags=["scoring"])
app.include_router(rank.router, prefix="/rank", tags=["ranking"])
app.include_router(explain.router, prefix="/explain", tags=["explainability"])

@app.get("/health")
def health():
    return {"status": "ok"}
```

### 7.3 Embedding Engine (`ml/services/embedder.py`)

**Model choice:** `sentence-transformers/all-MiniLM-L6-v2`

| Property | Value |
|---|---|
| Dimensions | 384 |
| Speed | ~14,000 sentences/sec on CPU |
| Size | 80MB |
| Accuracy (STSB) | 0.836 |
| Why chosen | Best speed/accuracy ratio for production; fits in 512MB RAM; outperforms TF-IDF by ~40% on semantic tasks |

```python
# ml/services/embedder.py

import numpy as np
import redis
import hashlib
import json
from sentence_transformers import SentenceTransformer
from typing import List, Optional

class EmbedderService:
    """
    Singleton embedding service with Redis caching.
    Embeddings are expensive to compute — always cache.
    """
    
    _instance: Optional['EmbedderService'] = None
    _model: Optional[SentenceTransformer] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
            cls._redis = redis.Redis.from_url(
                url=os.getenv('REDIS_URL', 'redis://localhost:6379'),
                decode_responses=False  # Binary for numpy arrays
            )
        return cls._instance

    def _cache_key(self, text: str) -> str:
        """Deterministic cache key from text hash."""
        return f"emb:{hashlib.sha256(text.encode()).hexdigest()[:16]}"

    def _serialize(self, embedding: np.ndarray) -> bytes:
        return embedding.astype(np.float32).tobytes()

    def _deserialize(self, data: bytes) -> np.ndarray:
        return np.frombuffer(data, dtype=np.float32)

    def embed(self, text: str, use_cache: bool = True) -> np.ndarray:
        """Embed a single text string. Returns 384-dim vector."""
        if not text or not text.strip():
            return np.zeros(384, dtype=np.float32)

        key = self._cache_key(text)
        
        if use_cache:
            cached = self._redis.get(key)
            if cached:
                return self._deserialize(cached)

        # Truncate to model's max token limit (256 tokens ≈ ~1200 chars)
        text = text[:1200]
        embedding = self._model.encode(text, normalize_embeddings=True)
        
        if use_cache:
            # Cache for 30 days (criteria text rarely changes)
            self._redis.setex(key, 60 * 60 * 24 * 30, self._serialize(embedding))

        return embedding

    def embed_batch(self, texts: List[str], use_cache: bool = True) -> List[np.ndarray]:
        """
        Batch embedding with cache-first strategy.
        Only sends uncached texts to the model.
        """
        results = [None] * len(texts)
        uncached_indices = []
        uncached_texts = []

        # Check cache first
        for i, text in enumerate(texts):
            if not text or not text.strip():
                results[i] = np.zeros(384, dtype=np.float32)
                continue
            key = self._cache_key(text)
            cached = self._redis.get(key)
            if cached and use_cache:
                results[i] = self._deserialize(cached)
            else:
                uncached_indices.append(i)
                uncached_texts.append(text[:1200])

        # Batch encode only what's not cached
        if uncached_texts:
            embeddings = self._model.encode(
                uncached_texts,
                normalize_embeddings=True,
                batch_size=32,
                show_progress_bar=False
            )
            for idx, embedding in zip(uncached_indices, embeddings):
                results[idx] = embedding
                key = self._cache_key(texts[idx])
                self._redis.setex(key, 60 * 60 * 24 * 30, self._serialize(embedding))

        return results

embedder = EmbedderService()
```

### 7.4 Resume Parser (`ml/services/parser.py`)

```python
# ml/services/parser.py

import re
import pdfplumber
from docx import Document
from typing import Dict, List
import boto3
import io

SECTION_PATTERNS = {
    'summary':    r'(summary|objective|about|profile)',
    'skills':     r'(skills|technologies|tech stack|tools)',
    'experience': r'(experience|work history|employment|positions)',
    'education':  r'(education|degree|university|college|academic)',
    'projects':   r'(projects|portfolio|work samples)',
    'certifications': r'(certifications|certificates|licenses)',
    'achievements':   r'(achievements|awards|recognition)',
}

class ResumeParser:

    @staticmethod
    def from_s3(s3_key: str) -> Dict:
        s3 = boto3.client('s3')
        obj = s3.get_object(Bucket=os.getenv('S3_BUCKET'), Key=s3_key)
        file_bytes = obj['Body'].read()
        mime = s3_key.split('.')[-1].lower()
        return ResumeParser.parse(file_bytes, mime)

    @staticmethod
    def parse(file_bytes: bytes, file_type: str) -> Dict:
        if file_type == 'pdf':
            raw_text = ResumeParser._extract_pdf(file_bytes)
        elif file_type in ('docx', 'doc'):
            raw_text = ResumeParser._extract_docx(file_bytes)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        sections = ResumeParser._detect_sections(raw_text)
        sentences = ResumeParser._extract_sentences(raw_text)

        return {
            'rawText': raw_text,
            'sections': sections,
            'sentences': sentences  # All sentences for embedding
        }

    @staticmethod
    def _extract_pdf(file_bytes: bytes) -> str:
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text(layout=True)
                if text:
                    text_parts.append(text)
        return '\n'.join(text_parts)

    @staticmethod
    def _extract_docx(file_bytes: bytes) -> str:
        doc = Document(io.BytesIO(file_bytes))
        return '\n'.join(p.text for p in doc.paragraphs if p.text.strip())

    @staticmethod
    def _detect_sections(raw_text: str) -> Dict[str, str]:
        """
        Detect sections by scanning for header lines matching known patterns.
        Returns dict of { section_name: section_content }.
        """
        lines = raw_text.split('\n')
        sections: Dict[str, List[str]] = {k: [] for k in SECTION_PATTERNS}
        sections['other'] = []
        current_section = 'other'

        for line in lines:
            line_lower = line.lower().strip()
            if not line_lower:
                continue

            # Detect section header (short line matching pattern)
            if len(line_lower) < 40:
                matched = False
                for section_name, pattern in SECTION_PATTERNS.items():
                    if re.search(pattern, line_lower):
                        current_section = section_name
                        matched = True
                        break
                if matched:
                    continue

            sections[current_section].append(line.strip())

        return {k: '\n'.join(v) for k, v in sections.items() if v}

    @staticmethod
    def _extract_sentences(text: str) -> List[str]:
        """Split text into meaningful sentences for per-sentence scoring."""
        # Split on period, newline combos
        sentences = re.split(r'(?<=[.!?])\s+|\n+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 20]
```

### 7.5 Scoring Engine (`ml/services/scorer.py`)

This is the core ML logic. Read carefully.

```python
# ml/services/scorer.py

import numpy as np
from typing import List, Dict, Optional, Tuple
from services.embedder import embedder

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Cosine similarity between two L2-normalized vectors.
    Since we normalize on encode, this is just a dot product.
    Returns value in [0, 1] (not [-1, 1]) because embeddings are normalized.
    """
    return float(np.dot(a, b))


class ScoringEngine:
    """
    Section-aware, sentence-level semantic scoring engine.
    
    Core idea:
    - Each job criterion is embedded as a vector
    - Each resume sentence is embedded as a vector
    - For each criterion, find the best-matching resume sentence
    - Score = weighted average of per-criterion max similarities
    """

    # Section weights for section-aware scoring
    SECTION_IMPORTANCE = {
        'experience': 1.0,
        'skills':     0.9,
        'projects':   0.8,
        'summary':    0.6,
        'education':  0.5,
        'certifications': 0.4,
        'achievements': 0.4,
        'other':      0.3
    }

    def score_resume_vs_criteria(
        self,
        sections: Dict[str, str],
        sentences: List[str],
        criteria: List[Dict]
    ) -> Dict:
        """
        Main scoring method.
        
        Args:
            sections: { 'experience': '...', 'skills': '...', ... }
            sentences: All resume sentences (for max-sim matching)
            criteria: [{ id, label, weight, description? }, ...]
        
        Returns:
            {
              overall_score: float,
              criteria_scores: { criterion_id: { score, matched_sentence, confidence, section } },
              section_scores: { section_name: float }
            }
        """
        if not sentences:
            return self._empty_result(criteria)

        # 1. Embed all sentences in one batch (cached)
        sentence_embeddings = embedder.embed_batch(sentences)
        sentence_data = list(zip(sentences, sentence_embeddings))

        # 2. Build section → sentences index for section-aware scoring
        section_sentences = self._build_section_index(sections, sentences)

        criteria_scores = {}
        weighted_score = 0.0

        for criterion in criteria:
            crit_text = criterion.get('description') or criterion['label']
            crit_embedding = embedder.embed(crit_text)
            weight = criterion['weight']

            # 3. Max similarity: find the single best-matching sentence
            best_score, best_sentence, best_section = self._find_best_match(
                crit_embedding, sentence_data, section_sentences
            )

            # 4. Section-aware boost: multiply by section importance
            section_boost = self.SECTION_IMPORTANCE.get(best_section, 0.3)
            adjusted_score = best_score * section_boost

            # 5. Confidence: how far above random noise (threshold 0.3)
            confidence = max(0.0, (best_score - 0.3) / 0.7)

            criteria_scores[criterion['id']] = {
                'score': round(adjusted_score, 4),
                'rawSimilarity': round(best_score, 4),
                'matchedSentence': best_sentence,
                'matchedSection': best_section,
                'confidence': round(confidence, 4),
                'weight': weight
            }

            weighted_score += adjusted_score * weight

        # 6. Section-level aggregate scores
        section_scores = self._compute_section_scores(sections, sentence_embeddings, sentences)

        return {
            'overall_score': round(min(weighted_score, 1.0), 4),
            'criteria_scores': criteria_scores,
            'section_scores': section_scores
        }

    def _find_best_match(
        self,
        criterion_embedding: np.ndarray,
        sentence_data: List[Tuple[str, np.ndarray]],
        section_sentences: Dict[str, List[int]]
    ) -> Tuple[float, str, str]:
        """
        For a given criterion, find the most similar sentence across all resume text.
        Returns (best_similarity, best_sentence_text, section_name).
        """
        best_score = 0.0
        best_sentence = ''
        best_section = 'other'

        for i, (sentence, embedding) in enumerate(sentence_data):
            similarity = cosine_similarity(criterion_embedding, embedding)
            if similarity > best_score:
                best_score = similarity
                best_sentence = sentence
                best_section = self._find_sentence_section(i, section_sentences)

        return best_score, best_sentence, best_section

    def _build_section_index(
        self, sections: Dict[str, str], all_sentences: List[str]
    ) -> Dict[str, List[int]]:
        """Map section names to their sentence indices in the global sentence list."""
        index: Dict[str, List[int]] = {}
        for section_name, section_text in sections.items():
            section_sentences = [s.strip() for s in section_text.split('\n') if len(s.strip()) > 20]
            indices = []
            for s_sentence in section_sentences:
                for i, global_sentence in enumerate(all_sentences):
                    if s_sentence in global_sentence:
                        indices.append(i)
            index[section_name] = list(set(indices))
        return index

    def _find_sentence_section(
        self, sentence_idx: int, section_sentences: Dict[str, List[int]]
    ) -> str:
        for section, indices in section_sentences.items():
            if sentence_idx in indices:
                return section
        return 'other'

    def _compute_section_scores(
        self, sections: Dict[str, str], all_embeddings: List[np.ndarray], all_sentences: List[str]
    ) -> Dict[str, float]:
        """Average embedding magnitude per section as a proxy for content richness."""
        scores = {}
        for section_name, section_text in sections.items():
            if not section_text.strip():
                scores[section_name] = 0.0
                continue
            # Sentence density score: longer, richer sections score higher
            word_count = len(section_text.split())
            density = min(word_count / 100, 1.0)  # Normalize to [0,1] at 100 words
            scores[section_name] = round(density * self.SECTION_IMPORTANCE.get(section_name, 0.3), 4)
        return scores

    def _empty_result(self, criteria: List[Dict]) -> Dict:
        return {
            'overall_score': 0.0,
            'criteria_scores': { c['id']: { 'score': 0.0, 'confidence': 0.0 } for c in criteria },
            'section_scores': {}
        }

scorer = ScoringEngine()
```

### 7.6 Composite Score Formula (`ml/services/ranker.py`)

```python
# ml/services/ranker.py

from typing import Optional
from dataclasses import dataclass

@dataclass
class CompositeScore:
    resume_score: float       # 0.0 – 1.0
    github_score: float       # 0.0 – 1.0
    leetcode_score: float     # 0.0 – 1.0
    final_score: float        # Weighted composite
    breakdown: dict

class RankerService:
    
    # Weights — adjust based on job type (future: per-template weights)
    RESUME_WEIGHT   = 0.70
    GITHUB_WEIGHT   = 0.20
    LEETCODE_WEIGHT = 0.10

    def compute_final_score(
        self,
        resume_score: float,
        github_score: Optional[float],
        leetcode_score: Optional[float]
    ) -> CompositeScore:
        """
        Final score formula:
        
            final_score = 0.7 * resume_score
                        + 0.2 * github_score   (if available, else redistributed)
                        + 0.1 * leetcode_score (if available, else redistributed)
        
        If github_score is None (link not provided):
            Redistribute its weight to resume_score proportionally.
        
        If leetcode_score is None:
            Redistribute its weight to resume_score proportionally.
        """
        
        has_github = github_score is not None
        has_leetcode = leetcode_score is not None

        # Redistribution logic
        if not has_github and not has_leetcode:
            # Resume only
            final = resume_score
            weights_used = {'resume': 1.0, 'github': 0.0, 'leetcode': 0.0}

        elif not has_github:
            # Resume + LeetCode only
            total = self.RESUME_WEIGHT + self.GITHUB_WEIGHT
            resume_adj  = self.RESUME_WEIGHT / total
            leetcode_adj = self.LEETCODE_WEIGHT / total  # stays same but recalc
            final = resume_adj * resume_score + (1 - resume_adj) * leetcode_score
            weights_used = {'resume': resume_adj, 'github': 0.0, 'leetcode': 1 - resume_adj}

        elif not has_leetcode:
            # Resume + GitHub only
            resume_adj  = self.RESUME_WEIGHT + self.LEETCODE_WEIGHT * 0.5
            github_adj  = self.GITHUB_WEIGHT  + self.LEETCODE_WEIGHT * 0.5
            final = resume_adj * resume_score + github_adj * github_score
            weights_used = {'resume': resume_adj, 'github': github_adj, 'leetcode': 0.0}

        else:
            # All three signals
            final = (
                self.RESUME_WEIGHT   * resume_score   +
                self.GITHUB_WEIGHT   * github_score   +
                self.LEETCODE_WEIGHT * leetcode_score
            )
            weights_used = {
                'resume': self.RESUME_WEIGHT,
                'github': self.GITHUB_WEIGHT,
                'leetcode': self.LEETCODE_WEIGHT
            }

        return CompositeScore(
            resume_score=round(resume_score, 4),
            github_score=round(github_score, 4) if has_github else None,
            leetcode_score=round(leetcode_score, 4) if has_leetcode else None,
            final_score=round(min(final, 1.0), 4),
            breakdown={
                'weights_applied': weights_used,
                'signals_used': {
                    'resume': True,
                    'github': has_github,
                    'leetcode': has_leetcode
                }
            }
        )

ranker = RankerService()
```

### 7.7 Explainability Engine (`ml/services/explainer.py`)

```python
# ml/services/explainer.py

from typing import Dict, List

STRENGTH_THRESHOLD  = 0.65  # Score above this = strength
WEAKNESS_THRESHOLD  = 0.40  # Score below this = weakness

class ExplainerService:

    def generate_feedback(
        self,
        criteria_scores: Dict,      # From scorer.py output
        composite: 'CompositeScore',
        criteria_definitions: List[Dict]
    ) -> Dict:
        """
        Generate human-readable feedback from scoring data.
        
        Output:
        - strengths: ["Strong backend experience (0.82 match)"]
        - weaknesses: ["Limited DevOps exposure (0.31 match)"]
        - suggestions: ["Add CI/CD pipeline experience to your resume"]
        - explanation: Paragraph summary
        """
        
        criteria_map = {c['id']: c['label'] for c in criteria_definitions}
        
        strengths   = []
        weaknesses  = []
        suggestions = []

        for crit_id, score_data in criteria_scores.items():
            label = criteria_map.get(crit_id, crit_id)
            score = score_data['score']
            matched = score_data.get('matchedSentence', '')
            section = score_data.get('matchedSection', 'unknown')

            if score >= STRENGTH_THRESHOLD:
                strengths.append({
                    'criterion': label,
                    'score': score,
                    'evidence': matched[:100] if matched else None,
                    'section': section,
                    'message': f"Strong match for '{label}' (score: {score:.0%})"
                })

            elif score < WEAKNESS_THRESHOLD:
                suggestion = self._generate_suggestion(label, score, matched)
                weaknesses.append({
                    'criterion': label,
                    'score': score,
                    'message': f"Limited evidence of '{label}' (score: {score:.0%})"
                })
                suggestions.append(suggestion)

        # GitHub/LeetCode specific feedback
        if composite.github_score is None:
            suggestions.append("Add your GitHub profile to showcase real-world projects.")
        elif composite.github_score < 0.4:
            suggestions.append("Increase GitHub activity: contribute to more public repositories.")

        if composite.leetcode_score is None:
            suggestions.append("Add your LeetCode profile to demonstrate algorithmic problem-solving.")
        elif composite.leetcode_score < 0.3:
            suggestions.append("Solve more medium/hard LeetCode problems to improve your technical signal.")

        explanation = self._build_explanation(
            composite.final_score, strengths, weaknesses, composite
        )

        return {
            'strengths':   strengths,
            'weaknesses':  weaknesses,
            'suggestions': suggestions,
            'explanation': explanation
        }

    def _generate_suggestion(self, criterion_label: str, score: float, matched: str) -> str:
        """Rule-based suggestion generation."""
        label_lower = criterion_label.lower()

        if 'backend' in label_lower or 'api' in label_lower:
            return f"Elaborate on REST/GraphQL API development in your experience section."
        if 'devops' in label_lower or 'ci/cd' in label_lower:
            return f"Add CI/CD tools (GitHub Actions, Docker, Kubernetes) to your skills/projects."
        if 'frontend' in label_lower or 'react' in label_lower:
            return f"Include more frontend projects with React, Next.js, or similar frameworks."
        if 'design' in label_lower or 'system' in label_lower:
            return f"Describe system design decisions in your project descriptions."
        if 'communication' in label_lower or 'team' in label_lower:
            return f"Highlight collaborative projects, open-source contributions, or mentoring."

        # Generic fallback
        return f"Strengthen your profile in '{criterion_label}' by adding specific examples and metrics."

    def _build_explanation(
        self,
        final_score: float,
        strengths: List,
        weaknesses: List,
        composite: 'CompositeScore'
    ) -> str:
        tier = (
            "excellent" if final_score >= 0.75 else
            "strong"    if final_score >= 0.60 else
            "moderate"  if final_score >= 0.45 else
            "limited"
        )

        strong_areas = [s['criterion'] for s in strengths[:2]]
        weak_areas   = [w['criterion'] for w in weaknesses[:2]]

        parts = [f"This candidate shows {tier} overall alignment (score: {final_score:.0%})."]

        if strong_areas:
            parts.append(f"Key strengths include {' and '.join(strong_areas)}.")
        if weak_areas:
            parts.append(f"Areas needing development: {' and '.join(weak_areas)}.")
        if composite.github_score:
            parts.append(f"GitHub profile contributes a {composite.github_score:.0%} signal.")
        if composite.leetcode_score:
            parts.append(f"LeetCode activity adds a {composite.leetcode_score:.0%} signal.")

        return ' '.join(parts)

explainer = ExplainerService()
```

---

## 8. External Data Integration

### 8.1 GitHub Analyzer (`ml/services/github_analyzer.py`)

```python
# ml/services/github_analyzer.py

import httpx
import asyncio
from typing import Optional, Dict, List
from services.embedder import embedder
import numpy as np

GITHUB_API = "https://api.github.com"
HEADERS = {"Accept": "application/vnd.github.v3+json"}

class GitHubAnalyzer:

    def extract_username(self, github_url: str) -> Optional[str]:
        """Extract username from GitHub URL."""
        import re
        match = re.search(r'github\.com/([^/?]+)', github_url)
        return match.group(1) if match else None

    async def analyze(self, github_url: str, job_criteria: List[Dict]) -> Dict:
        """
        Analyze a GitHub profile and return a normalized score.
        
        Scoring dimensions:
        1. Relevance   (0.5 weight): How relevant are repos to job criteria?
        2. Activity    (0.3 weight): Commit frequency, recency
        3. Quality     (0.2 weight): Stars, forks, repo count
        """
        username = self.extract_username(github_url)
        if not username:
            return self._empty_result("Invalid GitHub URL")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                user_resp = await client.get(f"{GITHUB_API}/users/{username}", headers=HEADERS)
                repos_resp = await client.get(
                    f"{GITHUB_API}/users/{username}/repos",
                    params={"sort": "updated", "per_page": 30, "type": "owner"},
                    headers=HEADERS
                )

                if user_resp.status_code != 200:
                    return self._empty_result(f"GitHub user not found: {username}")

                user_data = user_resp.json()
                repos = repos_resp.json() if repos_resp.status_code == 200 else []

        except httpx.TimeoutException:
            return self._empty_result("GitHub API timeout")

        relevance_score = self._compute_relevance(repos, job_criteria)
        activity_score  = self._compute_activity(repos, user_data)
        quality_score   = self._compute_quality(repos)

        final_score = (
            0.5 * relevance_score +
            0.3 * activity_score  +
            0.2 * quality_score
        )

        return {
            'score': round(final_score, 4),
            'breakdown': {
                'relevance': round(relevance_score, 4),
                'activity':  round(activity_score, 4),
                'quality':   round(quality_score, 4)
            },
            'meta': {
                'username': username,
                'public_repos': user_data.get('public_repos', 0),
                'followers': user_data.get('followers', 0),
                'top_languages': self._extract_languages(repos)[:5]
            }
        }

    def _compute_relevance(self, repos: List[Dict], criteria: List[Dict]) -> float:
        """
        Semantic similarity between repo descriptions and job criteria.
        For each criterion, find best-matching repo.
        """
        if not repos or not criteria:
            return 0.0

        descriptions = [
            f"{r.get('name', '')} {r.get('description', '')} {' '.join(r.get('topics', []))}"
            for r in repos if r.get('description') or r.get('name')
        ]

        if not descriptions:
            return 0.0

        repo_embeddings = embedder.embed_batch(descriptions)

        scores = []
        for criterion in criteria:
            crit_embedding = embedder.embed(criterion['label'])
            similarities = [
                float(np.dot(crit_embedding, repo_emb))
                for repo_emb in repo_embeddings
            ]
            scores.append(max(similarities) if similarities else 0.0)

        return sum(scores) / len(scores) if scores else 0.0

    def _compute_activity(self, repos: List[Dict], user_data: Dict) -> float:
        """Score based on recent activity."""
        from datetime import datetime, timezone

        if not repos:
            return 0.0

        now = datetime.now(timezone.utc)
        scores = []

        for repo in repos[:10]:  # Top 10 most recently updated
            updated = repo.get('updated_at')
            if not updated:
                continue
            updated_dt = datetime.fromisoformat(updated.replace('Z', '+00:00'))
            days_ago = (now - updated_dt).days

            if days_ago < 30:   score = 1.0
            elif days_ago < 90: score = 0.7
            elif days_ago < 180: score = 0.4
            elif days_ago < 365: score = 0.2
            else:               score = 0.0

            scores.append(score)

        return sum(scores) / len(scores) if scores else 0.0

    def _compute_quality(self, repos: List[Dict]) -> float:
        """Score based on stars, forks, repo count."""
        if not repos:
            return 0.0

        total_stars = sum(r.get('stargazers_count', 0) for r in repos)
        total_forks = sum(r.get('forks_count', 0) for r in repos)
        repo_count  = len(repos)

        # Logarithmic normalization to prevent outlier domination
        import math
        star_score  = min(math.log1p(total_stars) / math.log1p(100), 1.0)
        fork_score  = min(math.log1p(total_forks) / math.log1p(50), 1.0)
        count_score = min(repo_count / 20, 1.0)

        return (0.5 * star_score + 0.3 * fork_score + 0.2 * count_score)

    def _extract_languages(self, repos: List[Dict]) -> List[str]:
        from collections import Counter
        langs = [r.get('language') for r in repos if r.get('language')]
        return [lang for lang, _ in Counter(langs).most_common()]

    def _empty_result(self, reason: str) -> Dict:
        return {'score': None, 'error': reason, 'breakdown': {}}

github_analyzer = GitHubAnalyzer()
```

### 8.2 LeetCode Analyzer (`ml/services/leetcode_analyzer.py`)

```python
# ml/services/leetcode_analyzer.py

import httpx
import re
from typing import Optional, Dict

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

PROFILE_QUERY = """
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    profile {
      ranking
      reputation
    }
  }
}
"""

class LeetCodeAnalyzer:

    def extract_username(self, lc_url: str) -> Optional[str]:
        match = re.search(r'leetcode\.com/(?:u/)?([^/?]+)', lc_url)
        return match.group(1) if match else None

    async def analyze(self, leetcode_url: str) -> Dict:
        username = self.extract_username(leetcode_url)
        if not username:
            return {'score': None, 'error': 'Invalid LeetCode URL'}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    LEETCODE_GRAPHQL_URL,
                    json={"query": PROFILE_QUERY, "variables": {"username": username}},
                    headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"}
                )

                if resp.status_code != 200:
                    return {'score': None, 'error': 'LeetCode API unavailable'}

                data = resp.json()
                user = data.get('data', {}).get('matchedUser')
                if not user:
                    return {'score': None, 'error': f'User {username} not found'}

        except httpx.TimeoutException:
            return {'score': None, 'error': 'LeetCode API timeout'}

        return self._compute_score(user, username)

    def _compute_score(self, user_data: Dict, username: str) -> Dict:
        """
        Score formula:
        - Easy solved:   1 point each (max contribution: 30%)
        - Medium solved: 3 points each (max contribution: 50%)
        - Hard solved:   5 points each (max contribution: 20%)
        
        Normalized to [0, 1] with soft cap at 500 points.
        """
        stats = user_data.get('submitStats', {}).get('acSubmissionNum', [])
        
        counts = {}
        for entry in stats:
            counts[entry['difficulty']] = entry['count']

        easy   = counts.get('Easy', 0)
        medium = counts.get('Medium', 0)
        hard   = counts.get('Hard', 0)

        raw_points = easy * 1 + medium * 3 + hard * 5

        import math
        normalized = min(math.log1p(raw_points) / math.log1p(500), 1.0)

        ranking   = user_data.get('profile', {}).get('ranking', 999999)
        rank_score = max(0.0, 1.0 - (ranking / 500000))

        final = 0.7 * normalized + 0.3 * rank_score

        return {
            'score': round(final, 4),
            'breakdown': {
                'easy_solved':   easy,
                'medium_solved': medium,
                'hard_solved':   hard,
                'raw_points':    raw_points,
                'normalized':    round(normalized, 4),
                'ranking':       ranking,
                'rank_score':    round(rank_score, 4)
            },
            'meta': { 'username': username }
        }

leetcode_analyzer = LeetCodeAnalyzer()
```

---

## 9. API Design (Node.js / Express)

### 9.1 Express App Setup (`apps/api/src/app.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';

import authRoutes       from './routes/auth.routes';
import adminRoutes      from './routes/admin.routes';
import candidateRoutes  from './routes/candidate.routes';
import recruiterRoutes  from './routes/recruiter.routes';
import resumeRoutes     from './routes/resume.routes';
import templateRoutes   from './routes/template.routes';

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  }));

  // Parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(compression());
  app.use(requestLogger);

  // Global rate limit
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  }));

  // Strict rate limit for auth
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
  app.use('/api/auth', authLimiter);

  // Routes
  app.use('/api/auth',       authRoutes);
  app.use('/api/admin',      adminRoutes);
  app.use('/api/candidate',  candidateRoutes);
  app.use('/api/recruiter',  recruiterRoutes);
  app.use('/api/resumes',    resumeRoutes);
  app.use('/api/templates',  templateRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
```

### 9.2 Full API Reference

#### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, get JWT |
| POST | `/api/auth/logout` | JWT | Invalidate session |
| GET  | `/api/auth/me` | JWT | Get current user |

#### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/admin/users` | ADMIN | List all users |
| GET  | `/api/admin/recruiters/pending` | ADMIN | Pending verifications |
| POST | `/api/admin/recruiters/:id/verify` | ADMIN | Approve recruiter |
| POST | `/api/admin/recruiters/:id/reject` | ADMIN | Reject recruiter |
| GET  | `/api/admin/stats` | ADMIN | System statistics |

#### Candidate Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/candidate/profile` | CANDIDATE | Get profile |
| PATCH | `/api/candidate/profile` | CANDIDATE | Update links |
| GET  | `/api/candidate/results` | CANDIDATE | Get all results |
| GET  | `/api/candidate/results/:resumeId` | CANDIDATE | Get feedback for resume |

#### Recruiter Endpoints (Verified only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/recruiter/profile` | RECRUITER | Get profile + status |
| GET  | `/api/templates` | VERIFIED RECRUITER | List templates |
| POST | `/api/templates` | VERIFIED RECRUITER | Create template |
| PUT  | `/api/templates/:id` | VERIFIED RECRUITER | Update template |
| GET  | `/api/templates/:id/results` | VERIFIED RECRUITER | Get ranked candidates |
| POST | `/api/templates/:id/select` | VERIFIED RECRUITER | Select candidates |
| POST | `/api/resumes/bulk` | VERIFIED RECRUITER | Bulk resume upload |

#### Resume Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/resumes/upload` | CANDIDATE | Upload single resume |
| GET  | `/api/resumes/:id/status` | Any | Polling status |

### 9.3 Request/Response Schemas

**POST `/api/templates`**
```typescript
// Request
{
  title: string;          // "Senior Backend Engineer"
  description: string;   // Job description text
  criteria: [
    {
      id: string;         // "c1"
      label: string;      // "Node.js/Express experience"
      weight: number;     // 0.30 (must sum to 1.0 across all)
      description?: string; // Optional: more detail for embedding
    }
  ]
}

// Response 201
{
  id: string;
  title: string;
  criteria: CriteriaItem[];
  createdAt: string;
  _links: {
    results: "/api/templates/{id}/results",
    upload: "/api/resumes/bulk?templateId={id}"
  }
}
```

**GET `/api/templates/:id/results`**
```typescript
// Response 200
{
  templateId: string;
  templateTitle: string;
  totalCandidates: number;
  rankings: [
    {
      rank: number;
      candidateId: string;
      candidateName: string;
      resumeFilename: string;
      finalScore: number;       // 0.0 – 1.0
      scoreBreakdown: {
        resume: number;
        github: number | null;
        leetcode: number | null;
      };
      criteriaScores: {
        [criterionId: string]: {
          score: number;
          matchedSentence: string;
          matchedSection: string;
          confidence: number;
        }
      };
      strengths: string[];
      weaknesses: string[];
      explanation: string;
      isSelected: boolean;
      links: { github: string | null; linkedin: string | null; }
    }
  ]
}
```

---

## 10. Frontend — Next.js Architecture

### 10.1 Route Protection (`apps/web/middleware.ts`)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ROLE_ROUTES = {
  '/admin':     ['ADMIN'],
  '/recruiter': ['RECRUITER'],
  '/candidate': ['CANDIDATE', 'ADMIN'] // Admin can view candidate views
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  const path = req.nextUrl.pathname;

  // Check if this is a protected route
  const protectedPrefix = Object.keys(ROLE_ROUTES).find(p => path.startsWith(p));
  if (!protectedPrefix) return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const allowedRoles = ROLE_ROUTES[protectedPrefix as keyof typeof ROLE_ROUTES];

    if (!allowedRoles.includes(payload.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // For recruiters: check verification status
    if (payload.role === 'RECRUITER' && payload.recruiterStatus !== 'VERIFIED') {
      if (!path.startsWith('/recruiter/pending')) {
        return NextResponse.redirect(new URL('/recruiter/pending', req.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/recruiter/:path*', '/candidate/:path*']
};
```

### 10.2 Template Builder Component (`apps/web/components/recruiter/TemplateBuilder.tsx`)

```tsx
'use client';

import { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, AlertCircle } from 'lucide-react';

interface Criterion {
  id: string;
  label: string;
  weight: number;
  description?: string;
}

interface TemplateBuilderProps {
  onSubmit: (template: { title: string; description: string; criteria: Criterion[] }) => void;
  loading?: boolean;
}

export function TemplateBuilder({ onSubmit, loading }: TemplateBuilderProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: crypto.randomUUID(), label: '', weight: 0.5 }
  ]);

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.01;

  const addCriterion = () => {
    if (criteria.length >= 10) return;
    const remaining = Math.max(0, 1.0 - totalWeight);
    setCriteria(prev => [
      ...prev,
      { id: crypto.randomUUID(), label: '', weight: Math.round(remaining * 100) / 100 }
    ]);
  };

  const removeCriterion = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, field: keyof Criterion, value: string | number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSubmit = () => {
    if (!isWeightValid || !title || criteria.some(c => !c.label)) return;
    onSubmit({ title, description, criteria });
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Create Job Template</h2>
        <p className="text-sm text-gray-500 mt-1">
          Define criteria and their importance weights. All weights must sum to 100%.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Job Title (e.g., Senior Backend Engineer)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="font-medium"
        />
        <textarea
          placeholder="Job description — this helps calibrate semantic matching..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800">Criteria & Weights</h3>
          <Badge variant={isWeightValid ? "default" : "destructive"}>
            Total: {(totalWeight * 100).toFixed(0)}% / 100%
          </Badge>
        </div>

        {criteria.map((criterion, index) => (
          <div key={criterion.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-400 w-4">{index + 1}</span>
              <Input
                placeholder="Criterion (e.g., React & Frontend experience)"
                value={criterion.label}
                onChange={e => updateCriterion(criterion.id, 'label', e.target.value)}
                className="flex-1"
              />
              <button
                onClick={() => removeCriterion(criterion.id)}
                disabled={criteria.length === 1}
                className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 pl-7">
              <span className="text-xs text-gray-500 w-20">
                Weight: <span className="font-semibold text-indigo-600">
                  {(criterion.weight * 100).toFixed(0)}%
                </span>
              </span>
              <Slider
                min={5}
                max={70}
                step={5}
                value={[criterion.weight * 100]}
                onValueChange={([val]) => updateCriterion(criterion.id, 'weight', val / 100)}
                className="flex-1"
              />
            </div>
          </div>
        ))}

        {!isWeightValid && (
          <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-md">
            <AlertCircle size={16} />
            Adjust weights so they sum to exactly 100%
          </div>
        )}

        <Button
          variant="outline"
          onClick={addCriterion}
          disabled={criteria.length >= 10}
          className="w-full border-dashed"
        >
          <PlusCircle size={16} className="mr-2" />
          Add Criterion ({criteria.length}/10)
        </Button>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isWeightValid || !title || loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {loading ? 'Creating...' : 'Create Template'}
      </Button>
    </div>
  );
}
```

### 10.3 Candidate Score Card (`apps/web/components/resume/ScoreCard.tsx`)

```tsx
'use client';

interface ScoreCardProps {
  finalScore: number;
  breakdown: { resume: number; github: number | null; leetcode: number | null };
  strengths: { criterion: string; score: number; message: string }[];
  weaknesses: { criterion: string; score: number; message: string }[];
  suggestions: string[];
  explanation: string;
}

function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const r = (size / 2) - 8;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>
          {pct}%
        </text>
      </svg>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

export function ScoreCard({ finalScore, breakdown, strengths, weaknesses, suggestions, explanation }: ScoreCardProps) {
  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Score Overview</h3>
        <div className="flex items-center justify-around">
          <ScoreRing score={finalScore} label="Final Score" size={100} />
          <ScoreRing score={breakdown.resume} label="Resume" />
          {breakdown.github !== null && <ScoreRing score={breakdown.github} label="GitHub" />}
          {breakdown.leetcode !== null && <ScoreRing score={breakdown.leetcode} label="LeetCode" />}
        </div>
        <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{explanation}</p>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <h4 className="font-medium text-green-800 mb-3">✓ Strengths</h4>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                <span className="mt-0.5 shrink-0 w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold">
                  {Math.round(s.score * 100)}
                </span>
                {s.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <h4 className="font-medium text-red-800 mb-3">⚠ Areas to Improve</h4>
          <ul className="space-y-2">
            {weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-red-700">{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h4 className="font-medium text-blue-800 mb-3">💡 Improvement Suggestions</h4>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-blue-700 flex gap-2">
                <span className="shrink-0">→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## 11. Performance & Scalability

### 11.1 Async Processing Architecture

```
                   ┌──────────────────┐
  POST /resumes/bulk│                  │
  ─────────────────►│  Express API     │
                   │  Validates file   │
                   │  Writes to S3     │
                   │  Adds to Queue   │
                   │  Returns 202     │──► { jobId, status: "queued" }
                   └──────────────────┘
                            │
                    ┌───────▼──────────┐
                    │   Redis Queue    │
                    │   (Bull)         │
                    └───────┬──────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
       ┌──────▼───┐  ┌──────▼───┐  ┌──────▼───┐
       │ Worker 1 │  │ Worker 2 │  │ Worker 3 │
       │ resume A │  │ resume B │  │ resume C │
       └──────────┘  └──────────┘  └──────────┘
              │             │              │
              └─────────────┴──────────────┘
                            │
                    ┌───────▼──────────┐
                    │  Python ML Svc   │
                    │  (FastAPI)       │
                    └───────┬──────────┘
                            │
                    ┌───────▼──────────┐
                    │   PostgreSQL     │
                    │   (results)      │
                    └──────────────────┘
```

Frontend polls `/api/resumes/:id/status` every 3 seconds with exponential backoff.

### 11.2 Caching Strategy

```typescript
// Redis caching layers:

// Layer 1: Embedding cache (Python) — 30 days TTL
// Key: emb:{sha256(text)[:16]}
// Value: float32 bytes (384 * 4 = 1536 bytes per embedding)

// Layer 2: Template results cache (Node.js) — 5 min TTL
// Invalidated on new resume scored for that template
async function getCachedResults(templateId: string) {
  const cacheKey = `results:${templateId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const results = await TemplateService.getRankedCandidates(templateId, '');
  await redis.setex(cacheKey, 300, JSON.stringify(results));
  return results;
}

// Layer 3: GitHub/LeetCode cache — 6 hours TTL
// Prevents hammering external APIs for same profile
const GITHUB_CACHE_TTL = 60 * 60 * 6;
async function getCachedGitHubData(username: string) {
  const key = `github:${username}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const data = await GitHubService.analyze(username);
  await redis.setex(key, GITHUB_CACHE_TTL, JSON.stringify(data));
  return data;
}
```

### 11.3 Bull Queue Configuration

```typescript
// apps/api/src/core/queue.ts

import Bull from 'bull';

export const resumeQueue = new Bull('resume-processing', {
  redis: process.env.REDIS_URL!,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000  // 2s, 4s, 8s
    },
    removeOnComplete: 100,  // Keep last 100 completed jobs for debugging
    removeOnFail: 50,
    timeout: 120000  // 2 min timeout per resume
  }
});

// Concurrency: 5 resumes processed simultaneously per worker instance
resumeQueue.process('FULL_ANALYSIS', 5, resumeWorkerHandler);

// Monitoring
resumeQueue.on('completed', (job) => {
  logger.info(`Resume job ${job.id} completed in ${job.finishedOn - job.processedOn}ms`);
});

resumeQueue.on('failed', (job, err) => {
  logger.error(`Resume job ${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`);
});
```

---

## 12. Security

### 12.1 Authentication Flow

```typescript
// JWT payload structure
interface JWTPayload {
  sub: string;              // userId
  role: 'ADMIN' | 'RECRUITER' | 'CANDIDATE';
  recruiterStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  iat: number;
  exp: number;              // 7 days
}

// Token is:
// 1. Signed with RS256 (asymmetric) for production
// 2. Stored as HttpOnly cookie (not localStorage — prevents XSS theft)
// 3. Short-lived access token (15min) + refresh token (7 days) pattern recommended

// Refresh token rotation:
// - Each refresh issues new refresh token
// - Old token invalidated in Redis
// - Family detection: if old token reused, invalidate entire family
```

### 12.2 Input Validation (`apps/api/src/middleware/validate.middleware.ts`)

```typescript
import { z } from 'zod';
import { RequestHandler } from 'express';

export const CreateTemplateSchema = z.object({
  title: z.string().min(3).max(100).trim(),
  description: z.string().max(5000).trim(),
  criteria: z.array(z.object({
    id: z.string().uuid(),
    label: z.string().min(3).max(200).trim(),
    weight: z.number().min(0.05).max(0.95),
    description: z.string().max(500).optional()
  })).min(1).max(10)
});

export const validate = (schema: z.ZodSchema): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten()
      });
    }
    req.body = result.data; // Use parsed/sanitized data
    next();
  };
};
```

### 12.3 File Upload Security

```typescript
// apps/api/src/middleware/upload.middleware.ts

import multer from 'multer';
import { AppError } from '../utils/errors';

// Use memory storage — never write to disk on server
export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB
    files: 20                    // Max 20 files in bulk upload
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF and DOCX files are allowed', 400));
    }
  }
});

// IMPORTANT: Also validate magic bytes, not just MIME type
// (MIME type can be spoofed)
export function validateMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  const pdfMagic  = buffer.slice(0, 4).toString('hex') === '25504446'; // %PDF
  const docxMagic = buffer.slice(0, 4).toString('hex') === '504b0304'; // PK zip

  if (declaredMime === 'application/pdf') return pdfMagic;
  if (declaredMime.includes('wordprocessingml')) return docxMagic;
  return false;
}
```

---

## 13. Environment Configuration

### `apps/api/.env`
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/semantic_ats?sslmode=require"

# Auth
JWT_SECRET="your-256-bit-secret-min-32-chars"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_URL="redis://:password@host:6379"

# S3 / Cloudflare R2
S3_BUCKET="semantic-ats-resumes"
S3_REGION="auto"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
S3_ENDPOINT="https://account.r2.cloudflarestorage.com" # R2 only

# ML Service (internal)
ML_SERVICE_URL="http://ml-service:8000"
ML_SERVICE_SECRET="internal-secret-key"

# Frontend
FRONTEND_URL="https://your-app.vercel.app"

# Email (for notifications)
SMTP_HOST="smtp.resend.com"
SMTP_PORT=587
SMTP_USER="resend"
SMTP_PASS="your-resend-api-key"
FROM_EMAIL="noreply@your-domain.com"

# App
NODE_ENV="production"
PORT=3001
LOG_LEVEL="info"
```

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL="https://your-api.railway.app"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-app.vercel.app"
JWT_SECRET="same-as-backend"
```

### `ml/.env`
```env
REDIS_URL="redis://:password@host:6379"
S3_BUCKET="semantic-ats-resumes"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
S3_REGION="auto"
S3_ENDPOINT="https://account.r2.cloudflarestorage.com"
INTERNAL_SECRET="internal-secret-key"  # Validate requests from Node.js
MODEL_CACHE_DIR="/app/models"           # Pre-downloaded model path
PORT=8000
```

---

## 14. Deployment Strategy

### Architecture

```
Vercel (Next.js)
  └── SSR pages + API routes (auth, lightweight)
  └── Connects to Express API via NEXT_PUBLIC_API_URL

Railway (Express + Bull workers)
  └── Single service: Express API + Bull worker processes
  └── Connected to PostgreSQL (Railway managed) + Redis (Railway managed)

Fly.io or Railway (Python ML)
  └── FastAPI + uvicorn
  └── Pre-downloaded sentence-transformers model (baked into Docker image)
  └── Connected to Redis for caching

Cloudflare R2 (file storage)
  └── Resume PDFs/DOCX
  └── S3-compatible API
```

### Python ML Dockerfile (`ml/Dockerfile`)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the model into the image (critical for cold start)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### Node.js Dockerfile (`apps/api/Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Run migrations on start, then start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

### Railway Deployment Config (`railway.toml`)
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[[services]]
name = "api"

[[services]]
name = "worker"
startCommand = "node dist/workers/resume.worker.js"
```

---

## 15. Developer Workflow

### Initial Setup

```bash
# Clone and install
git clone https://github.com/your-org/semantic-ats
cd semantic-ats

# Backend setup
cd apps/api
cp .env.example .env         # Fill in values
npm install
npx prisma migrate dev       # Create DB schema
npx prisma db seed           # Seed admin user
npm run dev                  # Starts on :3001

# Frontend setup
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev                  # Starts on :3000

# ML pipeline setup
cd ml
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Start Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Start Bull dashboard (optional, for queue monitoring)
cd apps/api && npm run bull-board  # http://localhost:3001/bull-board
```

### Database Seed (`apps/api/prisma/seed.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@semanticats.com' },
    update: {},
    create: {
      email: 'admin@semanticats.com',
      passwordHash: adminHash,
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin user created:', admin.email);
}

main().finally(() => prisma.$disconnect());
```

```bash
npx ts-node prisma/seed.ts
```

### Key Development Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name "add_field_to_recruiter"

# View database in browser
npx prisma studio

# Run type checks
npm run typecheck

# Lint
npm run lint

# Test
npm run test

# Build for production
npm run build
```

---

## Quick Reference: Data Flow Summary

```
CANDIDATE FLOW:
Register → Upload Resume → System Parses → Embeds → Scores vs Templates → Feedback

RECRUITER FLOW:
Register → Wait Verification → Admin Approves → Create Template →
Upload Resumes → System Ranks → Select Candidates → Candidates Notified

ADMIN FLOW:
Review Pending Recruiters → Check Checklist → Approve/Reject →
Monitor System Stats → View All Users + Resumes

ML PIPELINE:
PDF/DOCX → Parser → Sections + Sentences →
Embedder (all-MiniLM-L6-v2) → Cosine Similarity vs Criteria →
Section-Aware Weighted Score → GitHub/LeetCode Enrichment →
Composite Score → Explainability → DB Storage
```

---

*This guide covers the complete system. Build in this order:*
*1. Auth + DB schema → 2. Admin panel → 3. ML pipeline (core scorer) → 4. Candidate upload → 5. Recruiter template builder → 6. Ranking + notifications → 7. Explainability → 8. Deployment*
