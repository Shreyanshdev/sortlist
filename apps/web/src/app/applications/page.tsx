"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Star, Sparkles, Loader2 } from "lucide-react";

interface Application {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  jobDeadline: string;
  deadlinePassed: boolean;
  analyseStatus: string;
  applicationStatus: string;
  result: {
    finalScore: number;
    explanation: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    isCandidateSelected: boolean;
  } | null;
  appliedAt: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.get("/candidate/applications")
      .then(({ data }) => setApps(data))
      .catch(() => toast.error("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
    APPLIED: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50", label: "Applied" },
    UNDER_REVIEW: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Under Review" },
    SELECTED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", label: "Selected" },
    REJECTED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Not Selected" },
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-50/40 rounded-full blur-[100px]" />

      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-20 relative z-10">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">My Applications</h1>
          <p className="text-gray-500 font-medium mt-1">Track your progress and view AI-powered analysis</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Clock size={32} className="animate-spin text-orange-500 mb-4" />
            <span className="text-sm font-medium tracking-wide uppercase font-bold">Fetching Applications...</span>
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-24 bg-white/40 backdrop-blur-md rounded-[32px] border border-white border-dashed">
            <Clock size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium italic">You haven&apos;t applied to any jobs yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => {
              const cfg = statusConfig[app.applicationStatus] || statusConfig.APPLIED;
              const Icon = cfg.icon;
              const isExpanded = expanded === app.applicationId;

              return (
                <div key={app.applicationId} className="group bg-white/70 backdrop-blur-xl border border-white rounded-[28px] overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : app.applicationId)}
                    className="w-full p-6 flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl ${cfg.bg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                        <Icon size={24} className={cfg.color} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#111827] text-[18px] tracking-tight group-hover:text-orange-600 transition-colors">{app.jobTitle}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[14px] text-orange-500 font-bold">{app.companyName}</span>
                          <span className="text-gray-200 text-xs">•</span>
                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            Applied {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`hidden sm:inline-flex text-[11px] font-bold px-4 py-1.5 rounded-full ${cfg.bg} ${cfg.color} border border-white/50 uppercase tracking-widest shadow-sm`}>
                        {cfg.label}
                      </span>
                      {isExpanded ? <ChevronUp size={20} className="text-gray-300" /> : <ChevronDown size={20} className="text-gray-300" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-8 border-t border-gray-100/50 pt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="mb-8">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Context</h4>
                        <div className="bg-orange-50/30 backdrop-blur-sm rounded-2xl p-5 border border-orange-100/30 text-[14px] text-gray-600 leading-relaxed whitespace-pre-wrap italic">
                          {app.jobDescription}
                        </div>
                      </div>

                      {app.result ? (
                        <div className="space-y-8">
                          <div className="flex items-center gap-6 bg-white/60 backdrop-blur-md rounded-[24px] p-6 border border-white shadow-sm">
                            <div className="flex flex-col items-center">
                              <span className="text-[44px] font-black text-orange-600 leading-none">
                                {(app.result.finalScore * 100).toFixed(0)}
                              </span>
                              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mt-1">Score</span>
                            </div>
                            <div className="h-12 w-px bg-gray-100" />
                            <div>
                              <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-1">Semantic Match Result</p>
                              <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                Our AI analyzed your resume, GitHub commits, and LeetCode performance against the job requirements.
                              </p>
                            </div>
                          </div>

                          {app.result.explanation && (
                            <div>
                              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">AI Feedback</h4>
                              <div className="text-[14px] text-gray-700 leading-relaxed bg-[#111827] text-white rounded-[24px] p-6 shadow-xl relative overflow-hidden">
                                <Sparkles size={40} className="absolute top-[-10px] right-[-10px] text-white/5" />
                                <span className="relative z-10 leading-relaxed font-medium block">
                                  "{app.result.explanation}"
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {app.result.strengths?.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                                  <CheckCircle size={14} /> Key Strengths
                                </h4>
                                <div className="space-y-2">
                                  {app.result.strengths.map((s, i) => (
                                    <div key={i} className="px-4 py-3 bg-emerald-50/50 text-emerald-800 text-[13px] font-bold rounded-xl border border-emerald-100/50 leading-snug">
                                      {s}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {app.result.suggestions?.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                                  <Star size={14} /> Growth Tips
                                </h4>
                                <div className="space-y-2">
                                  {app.result.suggestions.map((s, i) => (
                                    <div key={i} className="px-4 py-3 bg-orange-50/50 text-orange-800 text-[13px] font-bold rounded-xl border border-orange-100/50 leading-snug">
                                      {s}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center bg-white/50 backdrop-blur-sm rounded-[32px] border border-dashed border-gray-200">
                          <Loader2 size={40} className="mx-auto text-orange-200 mb-4 animate-pulse" />
                          <p className="text-[15px] font-bold text-gray-500">Analysis in Progress</p>
                          <p className="text-[13px] text-gray-400 mt-2 max-w-[280px] mx-auto font-medium">
                            The semantic engine is currently processing your data. Check back in a few minutes!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
