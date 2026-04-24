"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, Users, FileText, BarChart3, Shield, Loader2 } from "lucide-react";

interface Recruiter {
  _id: string;
  email: string;
  recruiterProfile: {
    name: string;
    companyName: string;
    companyEmail: string;
    status: string;
  };
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalResumes: number;
  pendingRecruiters: number;
  verifiedRecruiters: number;
  totalResults: number;
}

export default function AdminDashboard() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, recruitersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/recruiters/pending"),
      ]);
      setStats(statsRes.data);
      setRecruiters(recruitersRes.data);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const verifyRecruiter = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/recruiters/${id}/verify`);
      toast.success("Recruiter verified!");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to verify");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRecruiter = async (id: string) => {
    if (!rejectReason.trim()) { toast.error("Please provide a reason"); return; }
    setActionLoading(id);
    try {
      await api.post(`/admin/recruiters/${id}/reject`, { reason: rejectReason });
      toast.success("Recruiter rejected");
      setRejectingId(null);
      setRejectReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mb-8">System overview and recruiter verification</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : (
          <>
            {/* Stats cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Users size={18} className="text-indigo-600" />
                    </div>
                    <span className="text-xs text-gray-500">Users</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <FileText size={18} className="text-emerald-600" />
                    </div>
                    <span className="text-xs text-gray-500">Resumes</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalResumes}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Shield size={18} className="text-amber-600" />
                    </div>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingRecruiters}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                      <BarChart3 size={18} className="text-green-600" />
                    </div>
                    <span className="text-xs text-gray-500">Analyses</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalResults}</p>
                </div>
              </div>
            )}

            {/* Pending recruiters */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Pending Recruiter Verifications</h2>
              {recruiters.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No pending verifications</p>
              ) : (
                <div className="space-y-3">
                  {recruiters.map((r) => (
                    <div key={r._id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{r.recruiterProfile.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{r.recruiterProfile.companyName} · {r.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Applied {new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => verifyRecruiter(r._id)}
                            disabled={actionLoading === r._id}
                            className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle2 size={13} /> Verify
                          </button>
                          <button
                            onClick={() => setRejectingId(rejectingId === r._id ? null : r._id)}
                            className="inline-flex items-center gap-1 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </div>

                      {rejectingId === r._id && (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                          />
                          <button
                            onClick={() => rejectRecruiter(r._id)}
                            disabled={actionLoading === r._id}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            Confirm
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
