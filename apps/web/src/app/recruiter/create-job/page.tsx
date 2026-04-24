"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Calendar } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface Criterion {
  id: string;
  label: string;
  weight: number;
  description: string;
}

export default function CreateJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: uuidv4(), label: "", weight: 0.25, description: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const addCriterion = () => {
    setCriteria([...criteria, { id: uuidv4(), label: "", weight: 0.1, description: "" }]);
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  const updateCriterion = (id: string, field: keyof Criterion, value: string | number) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      toast.error("Weights must sum to 1.0");
      return;
    }
    if (criteria.some((c) => !c.label.trim())) {
      toast.error("All criteria must have a label");
      return;
    }

    setLoading(true);
    try {
      await api.post("/recruiter/jobs", { title, description, deadline, criteria });
      toast.success("Job posted!");
      router.push("/recruiter");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Post a new job</h1>
        <p className="text-sm text-gray-500 mb-8">Define the role and scoring criteria</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Job title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Senior Frontend Engineer"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Describe the role, responsibilities, and ideal candidate..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <Calendar size={12} className="inline mr-1" />Application deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Criteria */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Scoring Criteria</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Weights must add up to 1.0 — currently{" "}
                  <span className={Math.abs(totalWeight - 1.0) > 0.01 ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}>
                    {totalWeight.toFixed(2)}
                  </span>
                </p>
              </div>
              <button type="button" onClick={addCriterion} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium flex items-center gap-1 transition-colors">
                <Plus size={14} /> Add
              </button>
            </div>

            <div className="space-y-3">
              {criteria.map((c, i) => (
                <div key={c.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-gray-400 w-5">#{i + 1}</span>
                    <input
                      type="text"
                      value={c.label}
                      onChange={(e) => updateCriterion(c.id, "label", e.target.value)}
                      placeholder="e.g. React experience"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={c.weight}
                        onChange={(e) => updateCriterion(c.id, "weight", parseFloat(e.target.value) || 0)}
                        step="0.05"
                        min="0.05"
                        max="0.95"
                        className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      />
                      <span className="text-xs text-gray-400">wt</span>
                    </div>
                    {criteria.length > 1 && (
                      <button type="button" onClick={() => removeCriterion(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={c.description}
                    onChange={(e) => updateCriterion(c.id, "description", e.target.value)}
                    placeholder="Describe what a strong match looks like (optional but recommended)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ml-8"
                    style={{ width: "calc(100% - 2rem)" }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Posting..." : "Post job"}
          </button>
        </form>
      </div>
    </div>
  );
}
