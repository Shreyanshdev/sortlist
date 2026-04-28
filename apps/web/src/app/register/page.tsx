"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Sparkles, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [role, setRole] = useState<"CANDIDATE" | "RECRUITER">("CANDIDATE");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register({ email, password, role, name, companyName });
      toast.success("Account created!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-50/40 rounded-full blur-[100px]" />

      {/* Left Side: Branding (Desktop) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative z-10">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-[#111827] rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-2xl">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-5xl font-extrabold text-[#111827] leading-tight mb-4 tracking-tight">
            Start your journey. <br />
            <span className="text-gray-500">Let&apos;s build together.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            Join thousands of teams using semantic intelligence to filter through the noise and find true talent.
          </p>
          
          <div className="inline-flex items-center gap-4 bg-white/60 backdrop-blur-sm border border-orange-100 rounded-full px-6 py-2.5 shadow-sm">
             <span className="text-sm font-medium text-gray-600 flex items-center gap-2 italic">
               <span className="opacity-40">✨</span> Smart Matching
             </span>
             <div className="w-[1px] h-4 bg-orange-100" />
             <span className="text-sm font-medium text-gray-600 flex items-center gap-2 italic">
               <span className="opacity-40">📈</span> Growth Ready
             </span>
             <div className="w-[1px] h-4 bg-orange-100" />
             <span className="text-sm font-medium text-gray-600 flex items-center gap-2 italic">
               <span className="opacity-40">🎯</span> Precision Hiring
             </span>
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo Only */}
          <div className="lg:hidden text-center mb-8">
             <Link href="/" className="inline-block relative w-12 h-12">
               <Image src="/short.png" alt="Logo" fill className="object-contain" />
             </Link>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Create your account</h2>
            <p className="text-gray-500 font-medium mt-1">Join the future of recruitment</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[32px] shadow-2xl shadow-gray-200/50 p-8 sm:p-10 transition-all duration-500 hover:shadow-orange-100/50 max-h-[85vh] overflow-y-auto">
            {/* Role Toggle */}
            <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-8">
              <button
                type="button"
                onClick={() => setRole("CANDIDATE")}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all ${role === "CANDIDATE" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole("RECRUITER")}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all ${role === "RECRUITER" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}
              >
                Recruiter
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2 pl-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full h-12 px-5 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2 pl-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full h-12 px-5 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all placeholder:text-gray-300"
                />
              </div>

              {role === "RECRUITER" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[13px] font-bold text-gray-700 mb-2 pl-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="Tech Corp"
                    className="w-full h-12 px-5 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all placeholder:text-gray-300"
                  />
                </div>
              )}

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2 pl-1">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min 6 characters"
                    className="w-full h-12 px-5 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all pr-12 placeholder:text-gray-300"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#111827] text-white rounded-2xl text-[15px] font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-gray-200 flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Creating Account..." : "Create Account →"}
              </button>
            </form>

            <p className="mt-8 text-center text-[14px] text-gray-400 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
