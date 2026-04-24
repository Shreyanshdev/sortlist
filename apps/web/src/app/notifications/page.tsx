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
                className={`bg-white border rounded-xl p-4 transition-all ${n.read ? "border-gray-100 opacity-60" : "border-indigo-100 shadow-sm"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${typeColor[n.type] || "bg-gray-50 text-gray-600"}`}>
                      {typeLabel[n.type] || n.type}
                    </span>
                    <p className="text-sm text-gray-700 mt-2">{n.payload.message || JSON.stringify(n.payload)}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
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
