"use client";

import { X, FileText, BarChart, Code, CheckCircle, AlertCircle, ExternalLink, Trophy, Sparkles, Send } from "lucide-react";
import { useEffect, useState } from "react";

interface CriterionScore {
  criterionId: string;
  score: number;
  matchedSentence: string;
  matchedSection: string;
}

interface GithubBreakdown {
  relevance: number;
  activity: number;
  quality: number;
  topLanguages: string[];
  publicRepos: number;
  followers: number;
}

interface LeetcodeBreakdown {
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  streak: number;
}

interface AnalysisResult {
  candidateName: string;
  rank: number;
  finalScore: number;
  isAnonymous: boolean;
  isFromPortal: boolean;
  resumeFileUrl: string | null;
  scoreBreakdown: {
    resume: number;
    github: number | null;
    leetcode: number | null;
  };
  githubBreakdown?: GithubBreakdown;
  leetcodeBreakdown?: LeetcodeBreakdown;
  criteriaScores: CriterionScore[];
  strengths: string[];
  weaknesses: string[];
  explanation: string;
  suggestions: string[];
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
}

export default function AnalysisModal({ isOpen, onClose, result }: AnalysisModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!mounted || !isOpen || !result) return null;

  const scoreColor = (s: number) => {
    if (s >= 0.7) return "text-emerald-500";
    if (s >= 0.4) return "text-amber-500";
    return "text-rose-500";
  };

  const scoreBg = (s: number) => {
    if (s >= 0.7) return "bg-emerald-50";
    if (s >= 0.4) return "bg-amber-50";
    return "bg-rose-50";
  };

  const progressColor = (s: number) => {
    if (s >= 0.7) return "bg-emerald-500";
    if (s >= 0.4) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      {/* Backdrop - Liquid Glass */}
      <div 
        className="absolute inset-0 bg-white/20 backdrop-blur-2xl transition-opacity animate-in fade-in duration-500 cursor-pointer" 
        onClick={onClose}
      />
      
      {/* Modal Content - Liquid Glass Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white/80 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-white overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Header - Sticky Glass */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100/50 bg-white/40 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <div className={`w-20 h-20 rounded-[28px] flex flex-col items-center justify-center shadow-inner ${scoreBg(result.finalScore)} ${scoreColor(result.finalScore)}`}>
              <span className="text-3xl font-black">{(result.finalScore * 100).toFixed(0)}</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Score</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#111827] tracking-tight flex items-center gap-3">
                {result.candidateName}
                {result.rank <= 3 && <Trophy size={24} className={result.rank === 1 ? "text-amber-500" : result.rank === 2 ? "text-slate-400" : "text-amber-700"} />}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">Rank #{result.rank}</span>
                <span className="text-gray-200">•</span>
                <span className="text-[13px] font-bold text-orange-500 uppercase tracking-widest">{result.isFromPortal ? "Portal Applicant" : "Bulk Upload"}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition-all cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar relative">
          
          {/* AI Explanation - Dark Premium Well */}
          <section className="bg-[#111827] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
            <Sparkles size={120} className="absolute top-[-20px] right-[-20px] text-white/5 group-hover:scale-110 transition-transform duration-700" />
            <h3 className="text-[11px] font-black text-orange-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <BarChart size={16} /> Semantic Engine Feedback
            </h3>
            <p className="text-white/90 text-[15px] font-medium leading-relaxed italic relative z-10">
              "{result.explanation}"
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Left Column: Criteria Scores */}
            <div className="space-y-8">
              <div>
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <FileText size={18} className="text-orange-500" /> Resume Criteria
                </h3>
                <div className="space-y-6">
                  {result.criteriaScores.map((c, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[14px] font-extrabold text-[#111827]">{c.criterionId}</span>
                        <span className={`text-[14px] font-black ${scoreColor(c.score)}`}>{(c.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${progressColor(c.score)}`}
                          style={{ width: `${c.score * 100}%` }}
                        />
                      </div>
                      {c.matchedSentence && (
                        <div className="mt-3 bg-orange-50/30 border border-orange-100/30 rounded-2xl p-4 text-[13px] text-gray-500 italic font-medium leading-relaxed">
                          "{c.matchedSentence}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 gap-6 pt-4">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <CheckCircle size={14} /> Key Strengths
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.strengths.map((s, i) => (
                      <span key={i} className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-[12px] font-bold rounded-xl border border-emerald-100/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <AlertCircle size={14} /> Critical Gaps
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.weaknesses.map((w, i) => (
                      <span key={i} className="px-3.5 py-1.5 bg-rose-50 text-rose-700 text-[12px] font-bold rounded-xl border border-rose-100/50">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: GitHub & LeetCode */}
            <div className="space-y-10">
              
              {/* GitHub Section - Premium Glass Card */}
              {result.githubBreakdown ? (
                <div className="bg-[#0D1117] rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                     <svg viewBox="0 0 24 24" width={100} height={100} fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
                  </div>
                  
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                        <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
                      </div>
                      <h3 className="font-extrabold text-[16px] tracking-tight">GitHub Activity</h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-orange-400">{(result.scoreBreakdown.github! * 100).toFixed(0)}</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Match</span>
                    </div>
                  </div>

                  <div className="space-y-5 relative z-10">
                    {[
                      { label: "Code Relevance", value: result.githubBreakdown.relevance },
                      { label: "Commit Activity", value: result.githubBreakdown.activity },
                      { label: "Repo Quality", value: result.githubBreakdown.quality },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-2 text-slate-500">
                          <span>{item.label}</span>
                          <span className="text-white">{(item.value * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-400 rounded-full transition-all duration-1000"
                            style={{ width: `${item.value * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-center relative z-10">
                    <div className="bg-white/5 rounded-2xl py-3 border border-white/5">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Repos</p>
                      <p className="text-xl font-black">{result.githubBreakdown.publicRepos}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl py-3 border border-white/5">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Followers</p>
                      <p className="text-xl font-black">{result.githubBreakdown.followers}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[32px] p-10 text-center">
                  <svg viewBox="0 0 24 24" width={40} height={40} fill="currentColor" className="mx-auto text-gray-200 mb-4 opacity-40"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
                  <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">No GitHub Data Linked</p>
                </div>
              )}

              {/* LeetCode Section - Glass Orange Card */}
              {result.leetcodeBreakdown ? (
                <div className="bg-orange-500 rounded-[32px] p-8 text-white shadow-[0_20px_40px_rgba(249,115,22,0.2)] relative overflow-hidden group">
                  <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                  
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                        <Code size={22} />
                      </div>
                      <h3 className="font-extrabold text-[16px] tracking-tight">LeetCode Skills</h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-white">{(result.scoreBreakdown.leetcode! * 100).toFixed(0)}</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Impact</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
                    {[
                      { label: "Easy", val: result.leetcodeBreakdown.easySolved, color: "bg-emerald-400" },
                      { label: "Med", val: result.leetcodeBreakdown.mediumSolved, color: "bg-amber-300" },
                      { label: "Hard", val: result.leetcodeBreakdown.hardSolved, color: "bg-rose-400" },
                    ].map((lvl, i) => (
                      <div key={i} className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{lvl.label}</p>
                        <p className="text-2xl font-black leading-none">{lvl.val}</p>
                        <div className={`w-6 h-1 mx-auto ${lvl.color} mt-3 rounded-full shadow-sm`} />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between bg-black/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 relative z-10">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Global Ranking</p>
                      <p className="text-lg font-black tracking-tight">#{result.leetcodeBreakdown.ranking.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Active Streak</p>
                      <p className="text-lg font-black tracking-tight flex items-center justify-end gap-1.5">
                        {result.leetcodeBreakdown.streak} <span className="text-xs opacity-60 font-bold uppercase tracking-widest">Days</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[32px] p-10 text-center">
                  <Code size={40} className="mx-auto text-gray-200 mb-4 opacity-40" />
                  <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">No LeetCode Data Linked</p>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions for Candidate */}
          {result.isFromPortal && result.suggestions.length > 0 && (
            <div className="border-t border-gray-100/50 pt-10">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Send size={18} className="text-orange-500" /> Improvement Roadmap
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-orange-50/20 rounded-[24px] border border-orange-100/30 text-[14px] text-gray-700 font-medium leading-relaxed group hover:bg-orange-50/50 transition-colors">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-[11px] shadow-sm group-hover:scale-110 transition-transform">
                      {i + 1}
                    </span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Glass */}
        <div className="p-8 border-t border-gray-100/50 bg-white/40 backdrop-blur-xl flex flex-col sm:flex-row gap-4 relative z-20">
          {result.resumeFileUrl && (
            <a 
              href={result.resumeFileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-200 text-[#111827] rounded-full text-[15px] font-black hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
            >
              <FileText size={20} /> View Original Resume
            </a>
          )}
          <button 
            onClick={onClose}
            className="flex-1 px-8 py-4 bg-[#111827] text-white rounded-full text-[15px] font-black hover:bg-gray-800 hover:shadow-2xl hover:shadow-gray-300 transition-all duration-300 cursor-pointer active:scale-95"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
