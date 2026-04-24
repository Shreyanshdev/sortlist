"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { Search, Clock, Users, ChevronRight, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface Job {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  daysLeft: number;
  deadlinePassed: boolean;
  applicantCount: number;
  criteria: { id: string; label: string; weight: number }[];
}

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data } = await api.get("/candidate/jobs", { params: search ? { q: search } : {} });
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

  const handleApply = async (jobId: string) => {
    if (!user) { toast.error("Please login first"); return; }
    if (!file) { toast.error("Please select a resume"); return; }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      await api.post(`/candidate/jobs/${jobId}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Application submitted!");
      setApplyingTo(null);
      setFile(null);
      loadJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to apply");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Open Positions</h1>
          <p className="text-sm text-gray-500 mt-1">Find your next opportunity</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadJobs()}
            placeholder="Search positions..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No open positions right now. Check back soon!</div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                    job.daysLeft <= 3 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-green-50 text-green-700 border border-green-100"
                  }`}>
                    <Clock size={12} className="inline mr-1" />
                    {job.daysLeft}d left
                  </span>
                </div>

                {/* Criteria tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.criteria.slice(0, 4).map((c) => (
                    <span key={c.id} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-medium">
                      {c.label}
                    </span>
                  ))}
                  {job.criteria.length > 4 && <span className="text-xs text-gray-400">+{job.criteria.length - 4}</span>}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Users size={13} /> {job.applicantCount} applicants
                  </span>

                  {applyingTo === job._id ? (
                    <div className="flex items-center gap-2">
                      <div
                        {...getRootProps()}
                        className={`border border-dashed rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors ${
                          isDragActive ? "border-indigo-400 bg-indigo-50" : "border-gray-300"
                        }`}
                      >
                        <input {...getInputProps()} />
                        {file ? (
                          <span className="text-indigo-600 font-medium">{file.name}</span>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-1"><Upload size={12} /> Drop resume</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleApply(job._id)}
                        disabled={!file}
                        className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
                      >
                        Submit
                      </button>
                      <button onClick={() => { setApplyingTo(null); setFile(null); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setApplyingTo(job._id)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                    >
                      Apply <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
