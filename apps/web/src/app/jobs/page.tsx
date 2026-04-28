"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { Play, Upload, CheckCircle, Building2, Loader2, Search, Clock, Users, ChevronRight, ChevronDown, ChevronUp, GitBranch, Code2, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface Job {
  _id: string;
  title: string;
  description: string;
  companyName: string;
  deadline: string;
  daysLeft: number;
  deadlinePassed: boolean;
  applicantCount: number;
  criteria: { id: string; label: string; weight: number }[];
  hasApplied: boolean;
  enableGithubInspection?: boolean;
  enableLeetcodeInspection?: boolean;
}

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [leetcodeUrl, setLeetcodeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/candidate/jobs", { params: search ? { search } : {} });
      setJobs(data.jobs);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    noClick: !applyingTo,
    noDrag: !applyingTo,
  });

  const handleStartApply = (jobId: string) => {
    if (!user) { toast.error("Please login to apply"); return; }
    setApplyingTo(jobId);
    setFile(null);
    setGithubUrl("");
    setLeetcodeUrl("");
  };

  const handleCancelApply = () => {
    setApplyingTo(null);
    setFile(null);
    setGithubUrl("");
    setLeetcodeUrl("");
  };

  const handleApply = async (jobId: string) => {
    if (!user) { toast.error("Please login first"); return; }
    if (!file) { toast.error("Please select a resume"); return; }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("resume", file);
    if (githubUrl.trim()) formData.append("githubUrl", githubUrl.trim());
    if (leetcodeUrl.trim()) formData.append("leetcodeUrl", leetcodeUrl.trim());

    try {
      await api.post(`/candidate/jobs/${jobId}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Application submitted!");
      handleCancelApply();
      loadJobs(); // Refresh to update hasApplied
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-50/40 rounded-full blur-[100px]" />

      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-20 relative z-10">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-2xl font-black text-[#111827] tracking-tight uppercase">Open Positions</h1>
          <p className="text-[13px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Discover your next career move</p>
        </div>

        {/* Search - Liquid Glass */}
        <div className="relative mb-10 group">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors z-20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for your dream role..."
            className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-xl border border-white rounded-[24px] text-[15px] font-medium focus:outline-none focus:ring-8 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.03)] placeholder:text-gray-400"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 size={32} className="animate-spin text-orange-500 mb-4" />
            <span className="text-sm font-medium tracking-wide uppercase">Loading jobs...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-24 bg-white/40 backdrop-blur-md rounded-[32px] border border-white border-dashed">
            <Search size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium italic">No open positions right now. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="group bg-white/70 backdrop-blur-xl border border-white rounded-[28px] p-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[19px] font-extrabold text-[#111827] tracking-tight group-hover:text-orange-600 transition-colors">{job.title}</h3>
                      {job.hasApplied && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <CheckCircle size={10} /> Applied
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-4">
                      <span className="text-[13px] font-semibold text-gray-500 flex items-center gap-1.5">
                        <Building2 size={14} className="text-orange-400" /> {job.companyName}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-gray-200 hidden sm:block" />
                      <span className="text-[13px] font-semibold text-gray-400 flex items-center gap-1.5">
                        <Users size={14} /> {job.applicantCount} applicants
                      </span>
                    </div>

                    <p className="text-[14px] text-gray-500 line-clamp-2 leading-relaxed">{job.description}</p>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 shrink-0">
                    <span className={`text-[12px] font-bold px-4 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 ${job.daysLeft <= 3 ? "bg-red-50 text-red-600 border border-red-100" : "bg-orange-50 text-orange-700 border border-orange-100"
                      }`}>
                      <Clock size={14} />
                      {job.daysLeft}d left
                    </span>
                  </div>
                </div>

                {/* Criteria Tags - Glassy */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {job.criteria.slice(0, 4).map((c) => (
                    <span key={c.id} className="text-[11px] font-bold uppercase tracking-wider bg-white/50 backdrop-blur-sm text-gray-600 border border-gray-100 px-3.5 py-1.5 rounded-xl cursor-pointer hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all">
                      {c.label}
                    </span>
                  ))}
                  {job.criteria.length > 4 && <span className="text-[11px] font-bold text-gray-300 py-1.5">+{job.criteria.length - 4} more</span>}
                </div>

                {/* Expandable JD - Premium Button */}
                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
                  <button
                    onClick={() => setExpandedJob(expandedJob === job._id ? null : job._id)}
                    className="text-[13px] text-orange-500 hover:text-orange-700 font-bold flex items-center gap-1.5 transition-all cursor-pointer group/btn"
                  >
                    {expandedJob === job._id ? (
                      <><ChevronUp size={16} /> Hide details</>
                    ) : (
                      <><ChevronDown size={16} /> View full description</>
                    )}
                  </button>

                  <div className="flex items-center">
                    {job.hasApplied ? (
                      <span className="text-[13px] text-gray-400 font-medium italic pr-2">You have already applied</span>
                    ) : applyingTo !== job._id ? (
                      <button
                        onClick={() => handleStartApply(job._id)}
                        className="h-10 bg-[#111827] text-white px-6 rounded-full text-[13px] font-bold hover:bg-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        Apply Now <ChevronRight size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Expanded Section - Glass Well */}
                {expandedJob === job._id && (
                  <div className="mt-4 bg-orange-50/30 backdrop-blur-sm rounded-2xl p-5 border border-orange-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[14px] text-gray-600 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                    <div className="mt-4 pt-4 border-t border-orange-100/30">
                      <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">Required Skills & Criteria</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {job.criteria.map((c) => (
                          <div key={c.id} className="flex items-center justify-between text-[13px] bg-white/40 px-3 py-2 rounded-lg">
                            <span className="text-gray-700 font-semibold">{c.label}</span>
                            <span className="text-gray-400 text-[11px]">Weight: {(c.weight * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Apply Drawer */}
                {applyingTo === job._id && !job.hasApplied && (
                  <div className="mt-6 bg-white rounded-[24px] p-6 border border-gray-100 shadow-inner animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[15px] font-bold text-gray-900">Complete your application</h4>
                      <button onClick={handleCancelApply} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-5">
                      {/* Resume upload */}
                      <div
                        {...getRootProps()}
                        className={`group border-2 border-dashed rounded-2xl px-6 py-8 text-center cursor-pointer transition-all ${isDragActive ? "border-orange-400 bg-orange-50" : "border-gray-100 hover:border-orange-200 hover:bg-orange-50/10"
                          }`}
                      >
                        <input {...getInputProps()} />
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-orange-100 transition-all">
                          <Upload size={20} className="text-gray-400 group-hover:text-orange-500" />
                        </div>
                        {file ? (
                          <div className="space-y-1">
                            <p className="text-[14px] text-orange-600 font-bold truncate max-w-xs mx-auto">{file.name}</p>
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Ready to upload</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[13px] text-gray-700 font-bold">Upload your Resume</p>
                            <p className="text-[11px] text-gray-400">PDF or DOCX (Max 5MB)</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* GitHub URL */}
                        {job.enableGithubInspection && (
                          <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-600 flex items-center gap-1.5 ml-1">
                              <GitBranch size={14} className="text-orange-500" /> GitHub Profile
                            </label>
                            <input
                              type="url"
                              value={githubUrl}
                              onChange={(e) => setGithubUrl(e.target.value)}
                              placeholder="https://github.com/..."
                              className="w-full h-11 px-4 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-gray-300"
                            />
                          </div>
                        )}

                        {/* LeetCode URL */}
                        {job.enableLeetcodeInspection && (
                          <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-600 flex items-center gap-1.5 ml-1">
                              <Code2 size={14} className="text-orange-500" /> LeetCode Profile
                            </label>
                            <input
                              type="url"
                              value={leetcodeUrl}
                              onChange={(e) => setLeetcodeUrl(e.target.value)}
                              placeholder="https://leetcode.com/u/..."
                              className="w-full h-11 px-4 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-gray-300"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                          onClick={() => handleApply(job._id)}
                          disabled={!file || submitting}
                          className="w-full sm:w-auto h-12 bg-[#111827] text-white px-8 rounded-full text-[14px] font-bold hover:bg-gray-800 hover:shadow-2xl hover:shadow-gray-300 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                          {submitting ? "Submitting..." : "Submit Application →"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

  );
}
