import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowRight, Sparkles, BarChart3, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] relative overflow-hidden font-sans">
      {/* Ultra-soft Background Glows - High-fidelity Minimalist */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FFF1E7] rounded-full blur-[140px] opacity-60" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FFF7F2] rounded-full blur-[120px] opacity-50" />
      
      <div className="pt-6">
        <Navbar />
      </div>

      <main className="relative pt-36 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Minimalist Badge */}
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md border border-orange-100/30 rounded-full px-4 py-1.5 mb-10 shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all hover:scale-105">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Semantic Matching v1.0</span>
          </div>

          {/* Bold Minimalist Headline - Smaller font as requested */}
          <h1 className="text-[44px] sm:text-[64px] font-black text-[#111827] leading-[1.05] tracking-[-0.03em] mb-8 max-w-3xl mx-auto transition-all">
            Stop guessing the <br />
            <span className="text-orange-500">Perfect Candidate</span>
          </h1>

          {/* Subtitle - Exact original text */}
          <p className="text-[17px] sm:text-[19px] text-gray-500 max-w-2xl mx-auto leading-relaxed mb-12">
            Shortlist uses sentence embeddings to deeply understand resumes — not just keyword matches.
            Rank candidates by true skill alignment, enriched with GitHub and LeetCode signals.
          </p>

          {/* CTA Buttons - Same text, new pill shape */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-32">
            <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-full hover:bg-orange-600 hover:shadow-2xl hover:shadow-orange-200 transition-all duration-300 font-bold text-[15px] shadow-lg shadow-orange-100 active:scale-95 cursor-pointer">
              Start hiring <ArrowRight size={18} />
            </Link>
            <Link href="/jobs" className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-[#111827] border border-gray-100 px-8 py-4 rounded-full hover:bg-gray-50 hover:shadow-xl hover:shadow-gray-200 transition-all duration-300 font-bold text-[15px] shadow-sm active:scale-95 cursor-pointer">
              Browse jobs
            </Link>
          </div>

          {/* Feature Grid - Original text & functionality, redesigned layout */}
          <div className="grid md:grid-cols-3 gap-8 text-left border-t border-orange-100/30 pt-20">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Sparkles size={20} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Semantic Scoring</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Each resume is scored against your custom criteria using sentence-transformer embeddings — not simple keyword regex.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <BarChart3 size={20} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">GitHub + LeetCode</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Enrich scores with real developer activity. Repository analysis, commit frequency, and competitive coding stats feed into the final rank.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Shield size={20} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">One-Click Analyse</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Post a job, wait for applications, then click one button. The entire pipeline — parse, embed, score, rank — runs automatically.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-50 py-10 text-center text-[11px] font-medium text-gray-300 tracking-widest uppercase">
        © {new Date().getFullYear()} Shortlist. Semantic ATS Engine.
      </footer>
    </div>
  );
}
