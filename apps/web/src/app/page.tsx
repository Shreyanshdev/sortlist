import Link from "next/link";
import { ArrowRight, Sparkles, BarChart3, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Shortlist</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/register" className="text-sm bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-28 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Sparkles size={14} />
          AI-Powered Resume Screening
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
          Hire smarter with
          <span className="block text-indigo-600">semantic intelligence</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Shortlist uses sentence embeddings to deeply understand resumes — not just keyword matches.
          Rank candidates by true skill alignment, enriched with GitHub and LeetCode signals.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all font-medium text-sm shadow-lg shadow-indigo-200">
            Start hiring <ArrowRight size={16} />
          </Link>
          <Link href="/jobs" className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm">
            Browse jobs
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-6 pb-28">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-7">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
              <Sparkles size={20} className="text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Semantic Scoring</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Each resume is scored against your custom criteria using sentence-transformer embeddings — not simple keyword regex.
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-7">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
              <BarChart3 size={20} className="text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">GitHub + LeetCode</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Enrich scores with real developer activity. Repository analysis, commit frequency, and competitive coding stats feed into the final rank.
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-7">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
              <Shield size={20} className="text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">One-Click Analyse</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Post a job, wait for applications, then click one button. The entire pipeline — parse, embed, score, rank — runs automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Shortlist. Semantic ATS Engine.
      </footer>
    </div>
  );
}
