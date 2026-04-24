"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Play, Upload, CheckCircle2, Loader2, ArrowLeft, Trophy, GitBranch, Code2, Send } from "lucide-react";
import Link from "next/link";

interface ResultRow {
  rank: number;
  resultId: string;
  candidateName: string;
  isAnonymous: boolean;
  finalScore: number;
  scoreBreakdown: { resume: number; github: number | null; leetcode: number | null };
  criteriaScores: { criterionId: string; score: number; matchedSection: string }[];
  strengths: string[];
  weaknesses: string[];
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

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      const { data } = await api.get(`/recruiter/jobs/${jobId}/results`);
      setJob(data);
      setResults(data.rankings || []);
      setAnalyseStatus(data.analyseStatus);

      // Pre-select previously selected candidates
      const preSelected = new Set<string>();
      (data.rankings || []).forEach((r: ResultRow) => {
        if (r.isCandidateSelected) preSelected.add(r.resultId);
      });
      setSelectedIds(preSelected);
    } catch {
      // Job might not have results yet; try getting just job info
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
  });

  const handleAnalyse = async () => {
    setAnalysing(true);
    setResults([]); // Clear old results during re-run
    try {
      await api.post(`/recruiter/jobs/${jobId}/analyse`);
      toast.success("Analysis started! This may take a few minutes.");
      setAnalyseStatus("IN_PROGRESS");
      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const { data } = await api.get(`/recruiter/jobs/${jobId}/results`);
          if (data.analyseStatus === "COMPLETE") {
            clearInterval(poll);
            setResults(data.rankings || []);
            setAnalyseStatus("COMPLETE");
            toast.success("Analysis complete!");
          }
        } catch {}
      }, 5000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to start analysis");
    } finally {
      setAnalysing(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSendFeedback = async () => {
    if (selectedIds.size === 0) { toast.error("Select at least one candidate"); return; }
    setSending(true);
    try {
      await api.post(`/recruiter/jobs/${jobId}/send-feedback`, {
        selectedResultIds: Array.from(selectedIds),
      });
      toast.success("Feedback sent to all candidates!");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send feedback");
    } finally {
      setSending(false);
    }
  };

  const scoreColor = (s: number) => {
    if (s >= 0.7) return "text-green-600";
    if (s >= 0.4) return "text-amber-600";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/recruiter" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
              <h1 className="text-xl font-bold text-gray-900">{job?.jobTitle || "Job Details"}</h1>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                {/* Analyse button logic */}
                {analyseStatus === "NOT_STARTED" && (
                  <button
                    onClick={handleAnalyse}
                    disabled={analysing}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {analysing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    {analysing ? "Starting..." : "Do Analyse"}
                  </button>
                )}
                {analyseStatus === "IN_PROGRESS" && (
                  <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-medium border border-amber-100">
                    <Loader2 size={16} className="animate-spin" /> Analysis in progress...
                  </div>
                )}
                {(analyseStatus === "COMPLETE" || analyseStatus === "FAILED") && (
                  <>
                    <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${
                      analyseStatus === "COMPLETE" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                    }`}>
                      {analyseStatus === "COMPLETE" ? <CheckCircle2 size={16} /> : <Play size={16} />}
                      {analyseStatus === "COMPLETE" ? `Analysis complete — ${results.length} ranked` : "Analysis failed"}
                    </div>
                    <button
                      onClick={handleAnalyse}
                      disabled={analysing}
                      className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {analysing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                      Re-run Analysis
                    </button>
                  </>
                )}

                {/* Bulk upload */}
                <div
                  {...getRootProps()}
                  className={`inline-flex items-center gap-2 border border-dashed rounded-xl px-4 py-2.5 text-sm cursor-pointer transition-all ${
                    isDragActive ? "border-indigo-400 bg-indigo-50 text-indigo-600" : "border-gray-300 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload size={14} />
                  {uploading ? "Uploading..." : "Bulk upload resumes"}
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
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 w-10">Select</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 w-12">#</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Candidate</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Score</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Resume</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">
                            <GitBranch size={13} className="inline" />
                          </th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">
                            <Code2 size={13} className="inline" />
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Strengths</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => (
                          <tr key={r.resultId} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${selectedIds.has(r.resultId) ? "bg-indigo-50/30" : ""}`}>
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(r.resultId)}
                                onChange={() => toggleSelect(r.resultId)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <span className="flex items-center gap-1">
                                {r.rank <= 3 && <Trophy size={13} className={r.rank === 1 ? "text-amber-500" : r.rank === 2 ? "text-gray-400" : "text-amber-700"} />}
                                <span className="text-gray-500 font-medium">{r.rank}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-gray-900">{r.candidateName}</span>
                              {r.isAnonymous && <span className="ml-1 text-xs text-gray-400">(anonymous)</span>}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-bold text-lg ${scoreColor(r.finalScore)}`}>
                                {(r.finalScore * 100).toFixed(0)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-gray-500">
                              {r.scoreBreakdown.resume != null ? (r.scoreBreakdown.resume * 100).toFixed(0) : "—"}
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-gray-500">
                              {r.scoreBreakdown.github != null ? (r.scoreBreakdown.github * 100).toFixed(0) : "—"}
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-gray-500">
                              {r.scoreBreakdown.leetcode != null ? (r.scoreBreakdown.leetcode * 100).toFixed(0) : "—"}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">
                              {r.strengths?.slice(0, 2).join(", ") || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Send feedback */}
                <div className="mt-4 flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-indigo-600">{selectedIds.size}</span> candidate(s) selected for shortlisting
                  </p>
                  <button
                    onClick={handleSendFeedback}
                    disabled={sending || selectedIds.size === 0}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {sending ? "Sending..." : "Send Feedback"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
