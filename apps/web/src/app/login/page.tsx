"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Mail, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-50/40 rounded-full blur-[100px]" />

      {/* Left Side: Branding (Visible on Desktop) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative z-10">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-[#111827] rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-2xl">
            <Mail className="text-white" size={32} />
          </div>
          <h1 className="text-5xl font-extrabold text-[#111827] leading-tight mb-4 tracking-tight">
            Welcome back. <br />
            <span className="text-gray-500">Let&apos;s continue.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            Analyze resumes, track candidates, and land your next perfect hire faster with semantic intelligence.
          </p>
          
          <div className="inline-flex items-center gap-4 bg-white/60 backdrop-blur-sm border border-orange-100 rounded-full px-6 py-2.5 shadow-sm">
             <span className="text-sm font-medium text-gray-600 flex items-center gap-2 italic">
               <span className="opacity-40">📩</span> Resumes analyzed
             </span>
             <div className="w-[1px] h-4 bg-orange-100" />
             <span className="text-sm font-medium text-gray-600 flex items-center gap-2 italic">
               <span className="opacity-40">📊</span> Insights ready
             </span>
             <div className="w-[1px] h-4 bg-orange-100" />
             <span className="text-sm font-medium text-gray-600 flex items-center gap-2 italic">
               <span className="opacity-40">🚀</span> Shortlist ahead
             </span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo Only */}
          <div className="lg:hidden text-center mb-10">
             <Link href="/" className="inline-block relative w-12 h-12">
               <Image src="/short.png" alt="Logo" fill className="object-contain" />
             </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Log in to your account</h2>
            <p className="text-gray-500 font-medium mt-1">Continue your AI-powered hiring journey</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[32px] shadow-2xl shadow-gray-200/50 p-8 sm:p-10 transition-all duration-500 hover:shadow-orange-100/50">
            {/* Social Login Simulation */}
            <button className="w-full h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all duration-300 shadow-sm mb-6">
               <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285f4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34a853"/><path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.551 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#fbbc05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.384 2.043.957 4.962l3.007 2.332c.708-2.127 2.692-3.714 5.036-3.714z" fill="#ea4335"/></svg>
               <span className="text-[15px] font-bold text-gray-700">Continue with Google</span>
            </button>

            <div className="relative flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-1 bg-gray-100" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">OR</span>
              <div className="h-[1px] flex-1 bg-gray-100" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2 pl-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full h-13 px-5 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2 pl-1">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full h-13 px-5 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all pr-12 placeholder:text-gray-300"
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
                {loading ? "Logging In..." : "Log In →"}
              </button>
            </form>

            <p className="mt-8 text-center text-[14px] text-gray-400 font-medium">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">Sign up for free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
