"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import AnalysisModal from "@/components/AnalysisModal";
import { Play, Upload, CheckCircle, Loader2, ArrowLeft, Trophy, FileText, BarChart, Send, Globe, XCircle, AlertTriangle, Lock } from "lucide-react";

interface ResultRow {
  rank: number;
  resultId: string;
  candidateName: string;
  isAnonymous: boolean;
  isFromPortal: boolean;
  resumeFileUrl: string | null;
  finalScore: number;
  scoreBreakdown: {
    resume: number;
    github: number | null;
    leetcode: number | null;
  };
  githubBreakdown?: any;
  leetcodeBreakdown?: any;
  criteriaScores: {
    criterionId: string;
    score: number;
    matchedSection: string;
    matchedSentence: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  explanation: string;
  isCandidateSelected: boolean;
}

export default function RecruiterJobDetail() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [analyseStatus, setAnalyseStatus] = useState("NOT_STARTED");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeResult, setActiveResult] = useState<ResultRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newUnanalyzedCount, setNewUnanalyzedCount] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      const { data } = await api.get(`/recruiter/jobs/${jobId}/results`);
      setJob(data);
      setResults(data.rankings || []);
      setAnalyseStatus(data.analyseStatus);
      setNewUnanalyzedCount(data.newUnanalyzedCount || 0);
      setFeedbackSent(!!data.feedbackSentAt);

      // Pre-select previously selected candidates
      const preSelected = new Set<string>();
      (data.rankings || []).forEach((r: ResultRow) => {
        if (r.isCandidateSelected) preSelected.add(r.resultId);
      });
      setSelectedIds(preSelected);
    } catch {
      // Job might not have results yet
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    accepted.forEach((f) => formData.append("resumes", f));
    try {
      const { data } = await api.post(`/recruiter/jobs/${jobId}/bulk-upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Uploaded ${data.uploaded} resume(s)`);
      loadData(); // Refresh to update unanalyzed count
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [jobId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxSize: 5 * 1024 * 1024,
    disabled: uploading,
  });

  const handleAnalyse = async () => {
    setAnalysing(true);
    setResults([]);
    try {
      await api.post(`/recruiter/jobs/${jobId}/analyse`);
      toast.success("Analysis started! This may take a few minutes.");
      setAnalyseStatus("IN_PROGRESS");
      const poll = setInterval(async () => {
        try {
          const { data } = await api.get(`/recruiter/jobs/${jobId}/results`);
          if (data.analyseStatus === "COMPLETE") {
            clearInterval(poll);
            setResults(data.rankings || []);
            setAnalyseStatus("COMPLETE");
            setNewUnanalyzedCount(data.newUnanalyzedCount || 0);
            toast.success("Analysis complete!");
          }
        } catch { }
      }, 5000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to start analysis");
    } finally {
      setAnalysing(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (feedbackSent) return; // Immutable after feedback
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSendFeedback = async () => {
    if (feedbackSent) return;
    const selectedCount = selectedIds.size;
    const rejectedCount = results.length - selectedCount;

    const confirmed = window.confirm(
      `You are about to:\n• SELECT ${selectedCount} candidate(s)\n• REJECT ${rejectedCount} candidate(s)\n\nThis action CANNOT be undone. All candidates will be notified.\n\nProceed?`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      await api.post(`/recruiter/jobs/${jobId}/send-feedback`, {
        selectedResultIds: Array.from(selectedIds),
      });
      toast.success("Feedback sent to all candidates!");
      setFeedbackSent(true);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send feedback");
    } finally {
      setSending(false);
    }
  };

  const scoreColor = (s: number) => {
    if (s >= 0.7) return "text-emerald-600";
    if (s >= 0.4) return "text-amber-600";
    return "text-rose-500";
  };

  const openAnalysis = (r: ResultRow) => {
    setActiveResult(r);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-50/40 rounded-full blur-[100px]" />

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-20 relative z-10">
        <Link href="/recruiter" className="inline-flex items-center gap-2 text-[13px] font-bold text-gray-400 hover:text-orange-500 mb-8 transition-all cursor-pointer group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : (
          <>
            {/* Header Card - Liquid Glass */}
            <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] mb-8">
              <h1 className="text-2xl font-black text-[#111827] tracking-tight">{job?.jobTitle || "Job Details"}</h1>
              <div className="mt-6 flex items-center gap-4 flex-wrap">
                {/* Analyse button */}
                {analyseStatus === "NOT_STARTED" && (
                  <button
                    onClick={handleAnalyse}
                    disabled={analysing || uploading}
                    className="relative inline-flex items-center gap-2 bg-[#111827] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-gray-800 hover:shadow-2xl hover:shadow-gray-300 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 shadow-xl shadow-gray-200"
                  >
                    {analysing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                    {analysing ? "Starting..." : "Run Analysis"}
                  </button>
                )}
                {analyseStatus === "IN_PROGRESS" && (
                  <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-6 py-3 rounded-full text-sm font-bold border border-orange-100 shadow-sm">
                    <Loader2 size={18} className="animate-spin" /> Analysis in progress...
                  </div>
                )}
                {(analyseStatus === "COMPLETE" || analyseStatus === "FAILED") && (
                  <>
                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold border shadow-sm ${analyseStatus === "COMPLETE" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                      }`}>
                      {analyseStatus === "COMPLETE" ? <CheckCircle size={18} /> : <Play size={18} />}
                      {analyseStatus === "COMPLETE" ? `Analysis Complete — ${results.length} Ranked` : "Analysis Failed"}
                    </div>
                    <button
                      onClick={handleAnalyse}
                      disabled={analysing || uploading}
                      className="relative inline-flex items-center gap-2 bg-white border border-gray-100 text-gray-700 px-6 py-3 rounded-full text-sm font-bold hover:bg-gray-50 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
                    >
                      {analysing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                      Re-run Analysis
                      {newUnanalyzedCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 text-white text-[11px] font-black rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                          {newUnanalyzedCount}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {/* Bulk upload */}
                <div
                  {...getRootProps()}
                  className={`inline-flex items-center gap-2 border-2 border-dashed rounded-full px-6 py-3 text-sm font-bold transition-all ${uploading
                      ? "border-orange-300 bg-orange-50 text-orange-600 cursor-wait"
                      : isDragActive
                        ? "border-orange-400 bg-orange-50 text-orange-600 cursor-pointer"
                        : "border-gray-100 text-gray-400 hover:border-orange-200 hover:text-orange-500 cursor-pointer"
                    }`}
                >
                  <input {...getInputProps()} />
                  {uploading ? (
                    <><Loader2 size={18} className="animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload size={18} /> Bulk Upload Resumes</>
                  )}
                </div>
              </div>
            </div>

            {/* Results table */}
            {results.length > 0 && (
              <>
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 w-10">
                            {feedbackSent ? "Status" : "Select"}
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 w-12">#</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Candidate</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Score</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Actions</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Key Strengths</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => (
                          <tr key={r.resultId} className={`border-b border-gray-50 hover:bg-orange-50/20 transition-all duration-300 ${feedbackSent
                              ? r.isCandidateSelected ? "bg-emerald-50/40" : "bg-rose-50/20"
                              : selectedIds.has(r.resultId) ? "bg-orange-50/40" : ""
                            }`}>
                            <td className="py-5 px-6">
                              {feedbackSent ? (
                                r.isCandidateSelected ? (
                                  <CheckCircle size={20} className="text-emerald-500" />
                                ) : (
                                  <XCircle size={20} className="text-rose-400" />
                                )
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(r.resultId)}
                                  onChange={() => toggleSelect(r.resultId)}
                                  className="w-5 h-5 rounded-lg border-gray-200 text-orange-600 focus:ring-orange-500 cursor-pointer transition-all"
                                />
                              )}
                            </td>
                            <td className="py-5 px-6 text-center">
                              <span className="flex items-center justify-center gap-1.5">
                                {r.rank <= 3 && <Trophy size={16} className={r.rank === 1 ? "text-amber-500" : r.rank === 2 ? "text-slate-400" : "text-amber-700"} />}
                                <span className="text-gray-500 font-extrabold text-[15px]">{r.rank}</span>
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-[#111827] text-[15px]">{r.candidateName}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  {r.isFromPortal ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-orange-100">
                                      <Globe size={10} /> Portal
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-gray-100">
                                      <Upload size={10} /> Bulk
                                    </span>
                                  )}
                                </div>
                                {feedbackSent && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.isCandidateSelected
                                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                      : "bg-rose-50 text-rose-500 border border-rose-100"
                                    }`}>
                                    {r.isCandidateSelected ? "SELECTED" : "REJECTED"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-black text-xl ${scoreColor(r.finalScore)}`}>
                                {(r.finalScore * 100).toFixed(0)}
                              </span>
                            </td>
                            <td className="py-5 px-6 text-center">
                              <div className="flex items-center justify-center gap-3">
                                {r.resumeFileUrl && (
                                  <a
                                    href={r.resumeFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 bg-white border border-gray-100 text-gray-500 rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm cursor-pointer"
                                    title="View Resume"
                                  >
                                    <FileText size={18} />
                                  </a>
                                )}
                                <button
                                  onClick={() => openAnalysis(r)}
                                  className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm border border-orange-100 cursor-pointer"
                                  title="View Detailed Analysis"
                                >
                                  <BarChart size={18} />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {r.strengths?.slice(0, 1).map((s, idx) => {
                                  // Extract just the label part before the dash
                                  const label = s.split(" — ")[0] || s;
                                  return (
                                    <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded border border-emerald-100 truncate max-w-[190px]" title={s}>
                                      {label}
                                    </span>
                                  );
                                }) || <span className="text-gray-400 italic text-xs">No data</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-white/70 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-xl relative z-10 overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Send size={80} className="text-orange-500" />
                  </div>
                  {feedbackSent ? (
                    <>
                      <div className="relative z-10">
                        <p className="text-sm font-bold text-[#111827] flex items-center gap-2">
                          <Lock size={18} className="text-orange-500" />
                          Feedback has been sent. <span className="text-emerald-600">{results.filter(r => r.isCandidateSelected).length} Shortlisted</span>, <span className="text-rose-500">{results.length - results.filter(r => r.isCandidateSelected).length} Not Selected</span>.
                        </p>
                        <p className="text-xs text-gray-400 mt-1 font-medium italic">This selection is final and candidates have been notified.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative z-10 text-center sm:text-left mb-6 sm:mb-0">
                        <p className="text-[15px] font-extrabold text-[#111827]">
                          <span className="text-emerald-600">{selectedIds.size}</span> to Shortlist • <span className="text-rose-500">{results.length - selectedIds.size}</span> to Reject
                        </p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Ready to notify candidates?</p>
                      </div>
                      <button
                        onClick={handleSendFeedback}
                        disabled={sending || selectedIds.size === 0}
                        className="relative z-10 inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3.5 rounded-full text-[14px] font-bold hover:bg-orange-600 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-orange-100"
                      >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {sending ? "Sending..." : "Send Bulk Feedback →"}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <AnalysisModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        result={activeResult}
      />
    </div>
  );
}
