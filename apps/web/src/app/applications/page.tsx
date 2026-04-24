"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Star } from "lucide-react";

interface Application {
  applicationId: string;
  jobTitle: string;
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

  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
    APPLIED:      { icon: Clock,        color: "text-blue-600",   bg: "bg-blue-50",   label: "Applied" },
    UNDER_REVIEW: { icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50",  label: "Under Review" },
    SELECTED:     { icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50",  label: "Selected" },
    REJECTED:     { icon: XCircle,      color: "text-red-600",    bg: "bg-red-50",    label: "Not Selected" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Applications</h1>
        <p className="text-sm text-gray-500 mb-8">Track the status of your job applications</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">You haven&apos;t applied to any jobs yet.</div>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => {
              const cfg = statusConfig[app.applicationStatus] || statusConfig.APPLIED;
              const Icon = cfg.icon;
              const isExpanded = expanded === app.applicationId;

              return (
                <div key={app.applicationId} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : app.applicationId)}
                    className="w-full p-5 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                        <Icon size={18} className={cfg.color} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{app.jobTitle}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Applied {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                      {app.result ? (
                        <div className="space-y-4">
                          {/* Score */}
                          <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold text-indigo-600">
                              {(app.result.finalScore * 100).toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-500">out of 100<br />composite score</div>
                          </div>

                          {/* Explanation */}
                          {app.result.explanation && (
                            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">{app.result.explanation}</p>
                          )}

                          {/* Strengths */}
                          {app.result.strengths?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1"><Star size={12} /> Strengths</h4>
                              <ul className="space-y-1">
                                {app.result.strengths.map((s, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">•</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Suggestions */}
                          {app.result.suggestions?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-amber-700 mb-2">Suggestions to improve</h4>
                              <ul className="space-y-1">
                                {app.result.suggestions.map((s, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5">•</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Results will appear here once the recruiter completes the analysis.</p>
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
