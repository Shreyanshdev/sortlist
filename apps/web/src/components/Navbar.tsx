"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Bell, Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const pathname = usePathname();

  return (
    <>
    <div className="fixed top-6 left-0 right-0 z-50 px-6">
        <nav className="max-w-6xl mx-auto bg-white/40 backdrop-blur-2xl border border-white/40 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.05)] px-4 h-[64px] flex items-center justify-between transition-all duration-300">
          {/* Logo Section */}
          <div className="flex-1 flex justify-start">
            <Link href={user ? (user.role === "RECRUITER" ? "/recruiter" : user.role === "ADMIN" ? "/admin" : "/jobs") : "/"} className="flex items-center group cursor-pointer h-full ml-4">
              <div className="relative w-25 h-10 flex translate-y-[4px] items-center justify-center transition-all duration-500 group-hover:scale-105 group-active:scale-95">
                <Image
                  src="/short.svg"
                  alt="Logo"
                  width={120}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Liquid Glass Center Pill (Dynamic Links) */}
          {user && (
            <div className="hidden md:flex items-center bg-white/30 backdrop-blur-md border border-white/20 rounded-full p-1 shadow-sm overflow-hidden">
              {user.role === "CANDIDATE" && (
                <>
                  <Link
                    href="/jobs"
                    className={`px-6 py-2 text-[13px] font-black uppercase tracking-widest transition-all rounded-full cursor-pointer ${pathname === '/jobs' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Jobs
                  </Link>
                  <Link
                    href="/applications"
                    className={`px-6 py-2 text-[13px] font-black uppercase tracking-widest transition-all rounded-full cursor-pointer ${pathname === '/applications' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Applications
                  </Link>
                </>
              )}
              {user.role === "RECRUITER" && (
                <>
                  <Link
                    href="/recruiter"
                    className={`px-6 py-2 text-[13px] font-black uppercase tracking-widest transition-all rounded-full cursor-pointer ${pathname === '/recruiter' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/recruiter/create-job"
                    className={`px-6 py-2 text-[13px] font-black uppercase tracking-widest transition-all rounded-full cursor-pointer ${pathname === '/recruiter/create-job' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Post Job
                  </Link>
                </>
              )}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`px-6 py-2 text-[13px] font-black uppercase tracking-widest transition-all rounded-full cursor-pointer ${pathname === '/admin' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Admin Panel
                </Link>
              )}
            </div>
          )}

          {/* Actions Section */}
          <div className="flex-1 flex justify-end items-center gap-4 mr-2">
            {!user ? (
              <div className="flex items-center gap-3">
                <Link href="/login" className="px-5 py-2 text-[13px] font-black uppercase tracking-widest text-gray-500 hover:text-orange-600 transition-colors cursor-pointer">Sign in</Link>
                <Link href="/register" className="px-7 py-2.5 bg-[#111827] text-white text-[13px] font-black uppercase tracking-widest rounded-full shadow-xl shadow-gray-200 hover:bg-gray-800 hover:shadow-2xl hover:shadow-gray-300 transition-all duration-300 cursor-pointer active:scale-95">Join Now</Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/notifications" className="text-gray-400 hover:text-orange-500 transition-all relative cursor-pointer active:scale-90">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
                </Link>
                <div className="flex items-center bg-white/50 backdrop-blur-md rounded-full p-1 pl-5 gap-4 border border-white/50 shadow-sm">
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="text-[12px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors cursor-pointer outline-none"
                  >
                    Logout
                  </button>
                  <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-[13px] font-black ring-4 ring-white/50 shadow-sm transition-transform hover:scale-105">
                    {user.email[0].toUpperCase()}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile hamburger */}
            <button className="md:hidden text-gray-500 ml-2 cursor-pointer active:scale-90" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu - Glass card */}
        {menuOpen && (
          <div className="absolute top-[80px] left-6 right-6 bg-white/80 backdrop-blur-3xl rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-white/40 p-6 flex flex-col gap-4 md:hidden animate-in fade-in zoom-in-95 duration-300">
            {!user ? (
              <>
                <Link href="/login" className="text-[14px] font-black uppercase tracking-widest text-gray-500 px-5 py-4 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-all cursor-pointer" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link href="/register" className="text-[14px] font-black uppercase tracking-widest text-white bg-orange-500 rounded-2xl px-5 py-5 text-center shadow-xl shadow-orange-100 cursor-pointer active:scale-[0.98] transition-all" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            ) : (
              <>
                <Link href="/jobs" className="text-[14px] font-black uppercase tracking-widest text-gray-600 px-5 py-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer" onClick={() => setMenuOpen(false)}>Browse Jobs</Link>
                <Link href="/applications" className="text-[14px] font-black uppercase tracking-widest text-gray-600 px-5 py-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer" onClick={() => setMenuOpen(false)}>My Applications</Link>
                <div className="h-px bg-gray-100 my-2" />
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="text-[14px] font-black uppercase tracking-widest text-rose-500 px-5 py-4 text-left cursor-pointer transition-all outline-none"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-[#FDFCFB]/40 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white/80 backdrop-blur-3xl rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.1)] border border-white p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
              <LogOut size={40} />
            </div>
            <h3 className="text-2xl font-black text-[#111827] tracking-tight mb-2">Signing Out?</h3>
            <p className="text-gray-500 font-medium mb-8">Are you sure you want to log out of your Shortlist account?</p>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => { logout(); setShowLogoutModal(false); }}
                className="w-full py-4 bg-[#111827] text-white rounded-full font-black uppercase tracking-widest text-[13px] hover:bg-gray-800 hover:shadow-2xl hover:shadow-gray-300 transition-all duration-300 cursor-pointer active:scale-95"
              >
                Sign Me Out
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-4 bg-white text-gray-500 border border-gray-100 rounded-full font-black uppercase tracking-widest text-[13px] hover:bg-gray-50 transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

