<div align="center">
  <img src="../../apps/web/public/short.svg" width="120" alt="Shortlist Logo" />
  <h1>Shortlist — Frontend</h1>
  <p><b>High-Fidelity Liquid Glass UI for the Modern ATS</b></p>
</div>

<br />

## 🌟 Overview

The `web` application is the frontend engine for Shortlist, built with **Next.js 15+** and the **App Router**. It implements a bespoke "Liquid Glass" design system, prioritizing minimalist aesthetics, smooth micro-interactions, and a premium user experience for both recruiters and candidates.

---

## 💎 Design Philosophy: Liquid Glass

Shortlist's frontend is not just a tool; it's an experience.
- **Translucency**: Extensive use of `backdrop-blur-2xl` and `bg-white/40` to create a sense of depth and lightness.
- **Minimalism**: Reduced visual noise with a focus on clear typography (`font-black`) and intentional whitespace.
- **Micro-interactions**: Subtle `hover:scale-105` and `active:scale-95` transformations on every interactive element.
- **Glassy Modals**: Custom-built confirmation and analysis modals that provide a premium feel compared to native browser alerts.

---

## 🚀 Key Modules

### 1. Job Board (`/jobs`)
A real-time job discovery portal featuring:
- **Live Search**: Debounced filtering that updates as the user types.
- **Detailed Job Cards**: Translucent cards showing company metadata and semantic match status.
- **Smooth Application Flow**: Seamless PDF upload and profile linking.

### 2. Recruiter Dashboard (`/recruiter`)
The administrative hub for hiring managers:
- **Batch Analysis**: Trigger the ML engine to rank all applicants at once.
- **High-Fidelity Tables**: Visual ranking with trophy icons for top candidates.
- **Interactive Feedback**: One-click bulk notifications for shortlisted or rejected candidates.

### 3. Analysis Modal
A deep-dive component that visualizes:
- **Semantic Score**: A 0-100% alignment rating.
- **Skill Roadmap**: Suggestions for candidates on how to improve.
- **External Signals**: Integrated LeetCode streaks and GitHub activity.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context (AuthContext)
- **API Client**: [Axios](https://axios-http.com/) with interceptors for JWT management.
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

---

## 📂 Structure

- `src/app/`: File-based routing and page components.
- `src/components/`: Reusable high-fidelity UI components (Navbar, Modals, etc.).
- `src/lib/`: API configuration and global state contexts.
- `public/`: Static assets including the SVG logo and default avatars.

---

## ⚙️ Development

### Setup Environment
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
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
