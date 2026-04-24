"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import Link from "next/link";
import { Plus, Briefcase, Clock, Users, ChevronRight, Loader2 } from "lucide-react";

interface Job {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  isActive: boolean;
  analyseStatus: string;
  applicantCount: number;
  criteria: { label: string }[];
  createdAt: string;
}

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/recruiter/jobs")
      .then(({ data }) => setJobs(data.jobs || data))
      .catch(() => toast.error("Failed to load jobs"))
      .finally(() => setLoading(false));
  }, []);

  const analyseStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    NOT_STARTED: { label: "Not analysed", color: "text-gray-500", bg: "bg-gray-50" },
    IN_PROGRESS: { label: "Analysing...", color: "text-amber-600", bg: "bg-amber-50" },
    COMPLETE:    { label: "Analysis done", color: "text-green-600", bg: "bg-green-50" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your job postings and analyse candidates</p>
          </div>
          <Link
            href="/recruiter/create-job"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Post job
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">No jobs yet. Post your first position!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const cfg = analyseStatusConfig[job.analyseStatus] || analyseStatusConfig.NOT_STARTED;
              const daysLeft = Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000));
              const expired = new Date(job.deadline) < new Date();

              return (
                <Link
                  key={job._id}
                  href={`/recruiter/jobs/${job._id}`}
                  className={`block bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow ${expired ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{job.description}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 mt-1 shrink-0" />
                  </div>
                  <div className="mt-3 flex items-center gap-4 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Users size={12} /> {job.applicantCount} applicants
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {expired ? "Expired" : `${daysLeft}d left`}
                    </span>
                    <span className="text-xs text-gray-300">
                      {job.criteria.length} criteria
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
