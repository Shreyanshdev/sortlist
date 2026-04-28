# Semantic ATS Project Progress

Overall Progress: **~95% Complete** (61 out of 65 steps)

---

## Completed Phases — ✅

### 1. Database Configuration (MongoDB) — ✅ 9/9
- [x] 1.1–1.9: All Mongoose schemas, indexes, and DB connection

### 2. Express Backend Infrastructure & API — ✅ 13/13
- [x] 2.1–2.13: All controllers, services, routes, middleware

### 3. Asynchronous Workers (Bull) — ✅ 6/6
- [x] 3.1–3.6: Queue, state machine, ML orchestration, notifications

### 4. Python ML Pipeline (FastAPI) — ✅ 7/7
- [x] 4.1–4.7: Parser, embedder, scorer, GitHub, LeetCode, FastAPI routes

### 5. Frontend Foundation (Next.js) — ✅ 7/7
- [x] 5.1–5.7: Project scaffold, Tailwind, API client, reusable components

### 6. Frontend Pages — ✅ 8/8
- [x] 6.1 Authentication Pages (Login + Register with role toggle)
- [x] 6.2 Candidate Job Board (search, criteria tags, inline apply)
- [x] 6.3 Candidate Application Dashboard (status tracking, expandable results)
- [x] 6.4 Candidate Result View (score, strengths, suggestions)
- [x] 6.5 Recruiter Job Creation (dynamic criteria/weight inputs)
- [x] 6.6 Recruiter Job Management Dashboard (list, status badges)
- [x] 6.7 Recruiter Ranked Results (table, checkboxes, send feedback)
- [x] 6.8 Admin Dashboard (stats cards, recruiter verification queue)

---

## Phase 1 — Resume Link Extraction (ML Parser) ✅

> **Goal:** Extract GitHub, LeetCode, LinkedIn, and repo URLs from resumes
> during parsing — both from clickable hyperlinks AND plain text.

- [x] **1.1** Enhance `ml/services/parser.py` — Add `_extract_links()` method
- [x] **1.2** Update `ml/routers/score.py` `/parse` response
- [x] **1.3** Update `apps/api/src/models/resume.model.ts` — Add `extractedLinks` field
- [x] **1.4** Update `apps/api/src/services/ml.service.ts` `parseResume()` return type
- [x] **1.5** Update `apps/api/src/workers/analyse.worker.ts` — Store extracted links

---

## Phase 2 — Recruiter Toggle + Scoring Engine ✅

> **Goal:** Recruiter can toggle GitHub/LeetCode inspection per job.
> If LeetCode is unreachable → return null → no weightage.
> GitHub gets strong weightage for technical roles.

- [x] **2.1** Update `apps/api/src/models/job.model.ts` — Add toggle fields
- [x] **2.2** Update `apps/api/src/services/recruiter.service.ts` `createJob()`
- [x] **2.3** Update `apps/api/src/controllers/recruiter.controller.ts` `createJob()`
- [x] **2.4** Update `apps/api/src/workers/analyse.worker.ts` — Respect toggles
- [x] **2.5** Harden LeetCode analyzer — Graceful null on failure
- [x] **2.6** Verify scorer weightage logic (`ml/services/scorer.py`)
- [x] **2.7** Update `apps/web/src/app/recruiter/create-job/page.tsx` — Add toggle UI

---

## Phase 3 — Recruiter Results UI Enhancement ✅

> **Goal:** Two action buttons per candidate row (View Resume + View Analysis Modal).
> Modal shows full scoring breakdown with explanations.
> Flag portal-applied candidates to enable feedback sending.

- [x] **3.1** Update `apps/api/src/services/recruiter.service.ts` `getRankedResults()`
  - Include `resumeFileUrl` (Cloudinary URL) in each result row
  - Include `isFromPortal` flag: `true` if candidate has an Application record, `false` for anonymous bulk uploads
  - Include full `githubAnalysis` breakdown (relevance, activity, quality scores)
  - Include full `leetcodeAnalysis` breakdown (easy/medium/hard, rank, streak)
  - Include `suggestions` array in response

- [x] **3.2** Update `apps/api/src/models/result.model.ts` — Add GitHub/LeetCode breakdown storage
- [x] **3.3** Update `apps/api/src/workers/analyse.worker.ts` — Store full breakdowns
  - Save GitHub `breakdown` + `meta` from analyzer response into `AnalysisResult.githubBreakdown`
  - Save LeetCode `breakdown` from analyzer response into `AnalysisResult.leetcodeBreakdown`

- [x] **3.4** Update `apps/web/src/app/recruiter/jobs/[id]/page.tsx` — Add two action buttons per row
  - **Button 1: "View Resume"** — Opens candidate's resume file URL in new tab
  - **Button 2: "View Analysis"** — Opens a modal with full scoring explanation

- [x] **3.5** Build Analysis Modal component — `apps/web/src/components/AnalysisModal.tsx`
  - Header: Candidate name + rank + overall score
  - Section 1: Resume Score breakdown
  - Section 2: GitHub Analysis breakdown
  - Section 3: LeetCode Analysis breakdown
  - Section 4: Final Score Explanation
  - Section 5: Strengths & Weaknesses
  - Section 6: Suggestions for Candidate

- [x] **3.6** Add `isFromPortal` badge in results table
  - Show "Portal" badge (blue) for candidates who applied from the platform
  - Show "Bulk Upload" badge (gray) for anonymously uploaded resumes

- [x] **3.7** Update Send Feedback logic
  - Only send feedback notifications to portal-applied candidates (have `candidateId`)
  - For selected/rejected: send feedback with score + explanation

---

## Phase 4 — Candidate Feedback & Polish ✅

> **Goal:** Candidates see detailed feedback. Polish the whole flow end-to-end.

  - If feedback has been sent, show the score breakdown
  - Show resume score, GitHub score (if inspected), LeetCode score (if inspected)
  - Show strengths, weaknesses, suggestions
  - Show explanation text

- [ ] **4.3** End-to-end testing — Full flow verification
  - Register recruiter → verify → create job (with GitHub toggle ON)
  - Register candidate → apply with resume containing GitHub link
  - Recruiter bulk-uploads resumes with embedded GitHub links
  - Trigger analysis → verify link extraction → verify GitHub analysis
  - Verify scoring weights applied correctly
  - Verify results table shows both buttons (Resume + Analysis)
  - Verify modal shows full breakdown
  - Select candidates → send feedback → verify notifications

- [ ] **4.4** GitHub API rate-limit safety
  - Add in-memory caching by GitHub username (TTL 1 hour) in `github_analyzer.py`
  - Prevent re-analyzing the same profile within the same job batch
  - Log rate-limit remaining headers from GitHub API responses

- [ ] **4.5** LeetCode resilience
  - Add caching by LeetCode username (TTL 24 hours) in `leetcode_analyzer.py`
  - Add request delay (1 second between LeetCode calls) to avoid rate-limit
  - Ensure all error paths return `{ score: null }` (no crash, no weightage)

- [ ] **4.6** Production readiness
  - Backend `.env` values (MongoDB URI, GitHub Token, JWT secret)
  - Docker compose for all 3 services (api, web, ml)
  - Python ML service `requirements.txt` + local start verification

---

## Summary Table

| Phase | Tasks | Focus |
|-------|-------|-------|
| **Phase 1** | 1.1 – 1.5 | Resume link extraction (PDF + DOCX + regex) |
| **Phase 2** | 2.1 – 2.7 | Recruiter toggle + scoring engine wiring |
| **Phase 3** | 3.1 – 3.7 | Results UI: Resume button, Analysis modal, portal flag, feedback |
| **Phase 4** | 4.1 – 4.6 | Candidate feedback view, caching, testing, production |
