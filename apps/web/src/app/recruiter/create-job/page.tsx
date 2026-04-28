"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Calendar, Code, Sparkles } from "lucide-react";
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
  const [enableGithubInspection, setEnableGithubInspection] = useState(false);
  const [enableLeetcodeInspection, setEnableLeetcodeInspection] = useState(false);

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
      await api.post("/recruiter/jobs", {
        title, description, deadline, criteria,
        enableGithubInspection,
        enableLeetcodeInspection
      });
      toast.success("Job posted!");
      router.push("/recruiter");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-50/40 rounded-full blur-[100px]" />

      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-32 pb-20 relative z-10">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">Post a New Job</h1>
          <p className="text-gray-500 font-medium mt-1">Define the role and scoring criteria for candidates</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Info Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] space-y-6">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Senior Full Stack Product Engineer"
                className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-[15px] font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Role Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Describe the role, tech stack, and ideal candidate profile..."
                className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-[15px] font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all resize-none placeholder:text-gray-300 leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
                <Calendar size={14} className="text-orange-500" /> Application Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-[15px] font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Criteria Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[17px] font-black text-[#111827] tracking-tight">Scoring Criteria</h2>
                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  Weights sum to 1.0 • Current:{" "}
                  <span className={Math.abs(totalWeight - 1.0) > 0.01 ? "text-rose-500" : "text-emerald-500"}>
                    {totalWeight.toFixed(2)}
                  </span>
                </p>
              </div>
              <button 
                type="button" 
                onClick={addCriterion} 
                className="text-[11px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 px-5 py-2.5 rounded-full hover:bg-orange-100 flex items-center gap-2 transition-all cursor-pointer border border-orange-100"
              >
                <Plus size={16} /> Add Criterion
              </button>
            </div>

            <div className="space-y-4">
              {criteria.map((c, i) => (
                <div key={c.id} className="bg-white rounded-[24px] p-6 border border-gray-50 shadow-sm relative group transition-all hover:border-orange-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[11px] font-black text-gray-400 border border-gray-100">
                      {i + 1}
                    </div>
                    <input
                      type="text"
                      value={c.label}
                      onChange={(e) => updateCriterion(c.id, "label", e.target.value)}
                      placeholder="e.g. 3+ years of React experience"
                      className="flex-1 px-4 py-2.5 bg-gray-50/50 border border-transparent rounded-xl text-[14px] font-bold focus:bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-orange-400 transition-all placeholder:text-gray-300"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={c.weight}
                        onChange={(e) => updateCriterion(c.id, "weight", parseFloat(e.target.value) || 0)}
                        step="0.05"
                        min="0.05"
                        max="0.95"
                        className="w-20 px-3 py-2.5 bg-orange-50 border border-orange-100 rounded-xl text-[14px] font-black text-center text-orange-600 focus:outline-none"
                      />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight</span>
                    </div>
                    {criteria.length > 1 && (
                      <button type="button" onClick={() => removeCriterion(c.id)} className="p-2 text-gray-300 hover:text-rose-500 transition-all cursor-pointer">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={c.description}
                    onChange={(e) => updateCriterion(c.id, "description", e.target.value)}
                    placeholder="Describe what a strong candidate profile looks like for this skill..."
                    className="w-full px-4 py-2.5 bg-gray-50/30 border border-transparent rounded-xl text-[12px] font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-orange-400 transition-all placeholder:text-gray-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Assessment Toggles Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
            <h2 className="text-[17px] font-black text-[#111827] tracking-tight mb-1">Advanced Technical Analysis</h2>
            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest mb-8">Enable deep profile enrichment via AI workers</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* GitHub Toggle */}
              <label className="relative flex flex-col items-center justify-center bg-white border border-gray-100 rounded-[28px] p-6 cursor-pointer group transition-all hover:border-orange-200">
                <input
                  type="checkbox"
                  checked={enableGithubInspection}
                  onChange={(e) => setEnableGithubInspection(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${enableGithubInspection ? 'bg-[#111827] text-white shadow-xl rotate-3' : 'bg-gray-50 text-gray-400'}`}>
                  <svg viewBox="0 0 24 24" width={28} height={28} fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
                </div>
                <p className="text-[14px] font-black text-[#111827]">GitHub Audit</p>
                <div className={`mt-3 w-8 h-1.5 rounded-full transition-all ${enableGithubInspection ? 'bg-orange-500 w-12' : 'bg-gray-100'}`} />
              </label>

              {/* LeetCode Toggle */}
              <label className="relative flex flex-col items-center justify-center bg-white border border-gray-100 rounded-[28px] p-6 cursor-pointer group transition-all hover:border-orange-200">
                <input
                  type="checkbox"
                  checked={enableLeetcodeInspection}
                  onChange={(e) => setEnableLeetcodeInspection(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${enableLeetcodeInspection ? 'bg-amber-500 text-white shadow-xl -rotate-3' : 'bg-gray-50 text-gray-400'}`}>
                  <Code size={28} />
                </div>
                <p className="text-[14px] font-black text-[#111827]">LeetCode Audit</p>
                <div className={`mt-3 w-8 h-1.5 rounded-full transition-all ${enableLeetcodeInspection ? 'bg-orange-500 w-12' : 'bg-gray-100'}`} />
              </label>
            </div>

            {(enableGithubInspection || enableLeetcodeInspection) && (
              <div className="mt-8 bg-orange-50/50 rounded-[24px] p-5 border border-orange-100/50">
                <p className="text-[11px] font-black text-orange-700 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} /> AI Scoring Matrix
                </p>
                <p className="text-[13px] text-orange-600 font-bold mt-2">
                  {enableGithubInspection && enableLeetcodeInspection
                    ? "Weighting: Resume (50%) + GitHub (30%) + LeetCode (20%)"
                    : enableGithubInspection
                    ? "Weighting: Resume (70%) + GitHub (30%)"
                    : "Weighting: Resume (70%) + LeetCode (30%)"}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#111827] text-white rounded-full text-[16px] font-black hover:bg-gray-800 hover:shadow-2xl hover:shadow-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer active:scale-95"
          >
            {loading ? "Launching Position..." : "Post Job Position →"}
          </button>
        </form>
      </div>
    </div>
  );
}
