"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

interface Notification {
  _id: string;
  type: string;
  payload: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/notifications")
      .then(({ data }) => setNotifications(data))
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const typeLabel: Record<string, string> = {
    RECRUITER_VERIFIED: "Account Verified",
    RECRUITER_REJECTED: "Account Rejected",
    APPLICATION_RECEIVED: "New Application",
    ANALYSE_COMPLETE: "Analysis Complete",
    CANDIDATE_SELECTED: "You're Shortlisted!",
    CANDIDATE_REJECTED: "Application Update",
  };

  const typeColor: Record<string, string> = {
    RECRUITER_VERIFIED: "bg-green-50 text-green-700",
    RECRUITER_REJECTED: "bg-red-50 text-red-700",
    APPLICATION_RECEIVED: "bg-blue-50 text-blue-700",
    ANALYSE_COMPLETE: "bg-indigo-50 text-indigo-700",
    CANDIDATE_SELECTED: "bg-green-50 text-green-700",
    CANDIDATE_REJECTED: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">Stay updated on your activity</p>
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`bg-white border rounded-2xl p-5 transition-all ${n.read ? "border-gray-100 opacity-60" : "border-indigo-100 shadow-sm"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${typeColor[n.type] || "bg-gray-50 text-gray-600"}`}>
                      {typeLabel[n.type] || n.type}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-3">{n.payload.message}</p>
                    
                    {/* Detailed Payload */}
                    {(n.type === "CANDIDATE_SELECTED" || n.type === "CANDIDATE_REJECTED") && (
                      <div className="mt-4 pt-4 border-t border-gray-50 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`text-2xl font-black ${n.type === "CANDIDATE_SELECTED" ? "text-emerald-500" : "text-amber-500"}`}>
                            {(n.payload.finalScore * 100).toFixed(0)}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter leading-tight">Composite<br />Score</div>
                        </div>

                        {n.payload.explanation && (
                          <p className="text-xs text-gray-500 italic leading-relaxed">"{n.payload.explanation}"</p>
                        )}

                        {n.payload.strengths?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {n.payload.strengths.map((s: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {n.payload.suggestions?.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Suggestions to improve:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {n.payload.suggestions.map((s: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-100">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 shrink-0 mt-1 uppercase tracking-tighter">
                    {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
