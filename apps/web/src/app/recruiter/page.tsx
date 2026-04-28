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
    COMPLETE: { label: "Analysis done", color: "text-green-600", bg: "bg-green-50" },
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-50/40 rounded-full blur-[100px]" />

      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-20 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-black text-[#111827] tracking-tight uppercase">Recruiter Dashboard</h1>
            <p className="text-[13px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Manage your job postings</p>
          </div>
          <Link
            href="/recruiter/create-job"
            className="inline-flex items-center gap-2 bg-[#111827] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-gray-800 hover:shadow-2xl hover:shadow-gray-300 transition-all duration-300 cursor-pointer active:scale-95"
          >
            <Plus size={18} /> Post Job
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 size={32} className="animate-spin text-orange-500 mb-4" />
            <span className="text-sm font-medium tracking-wide uppercase font-bold">Loading Dashboard...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-24 bg-white/40 backdrop-blur-md rounded-[32px] border border-white border-dashed">
            <Briefcase size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium italic">No jobs yet. Post your first position!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const cfg = analyseStatusConfig[job.analyseStatus] || analyseStatusConfig.NOT_STARTED;
              const daysLeft = Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000));
              const expired = new Date(job.deadline) < new Date();

              return (
                <Link
                  key={job._id}
                  href={`/recruiter/jobs/${job._id}`}
                  className={`group block bg-white/70 backdrop-blur-xl border border-white rounded-[28px] p-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 cursor-pointer ${expired ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-[19px] font-extrabold text-[#111827] tracking-tight group-hover:text-orange-600 transition-colors">{job.title}</h3>
                      <p className="text-[14px] text-gray-500 mt-1 line-clamp-1 font-medium">{job.description}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-orange-500" />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-3 flex-wrap">
                    <span className={`text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest ${cfg.bg} ${cfg.color} border border-white/50 shadow-sm`}>
                      {cfg.label}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                    <span className="text-[12px] font-bold text-gray-400 flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-xl border border-white/50">
                      <Users size={14} className="text-orange-400" /> {job.applicantCount} applicants
                    </span>
                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                    <span className="text-[12px] font-bold text-gray-400 flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-xl border border-white/50">
                      <Clock size={14} className="text-orange-400" /> {expired ? "Expired" : `${daysLeft}d left`}
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
