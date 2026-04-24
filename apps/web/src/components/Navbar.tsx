"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Bell, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? (user.role === "RECRUITER" ? "/recruiter" : user.role === "ADMIN" ? "/admin" : "/jobs") : "/"} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Shortlist</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6">
            {!user ? (
              <>
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Sign in
                </Link>
                <Link href="/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Get started
                </Link>
              </>
            ) : (
              <>
                {user.role === "CANDIDATE" && (
                  <>
                    <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Jobs</Link>
                    <Link href="/applications" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">My Applications</Link>
                  </>
                )}
                {user.role === "RECRUITER" && (
                  <>
                    <Link href="/recruiter" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
                    <Link href="/recruiter/create-job" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Post Job</Link>
                  </>
                )}
                {user.role === "ADMIN" && (
                  <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
                )}
                <Link href="/notifications" className="text-gray-400 hover:text-gray-700 transition-colors relative">
                  <Bell size={18} />
                </Link>
                <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut size={18} />
                </button>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold">
                  {user.email[0].toUpperCase()}
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="sm:hidden text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 border-t border-gray-50 mt-2 pt-3 flex flex-col gap-3">
            {!user ? (
              <>
                <Link href="/login" className="text-sm text-gray-600" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link href="/register" className="text-sm text-indigo-600 font-medium" onClick={() => setMenuOpen(false)}>Get started</Link>
              </>
            ) : (
              <>
                {user.role === "CANDIDATE" && (
                  <>
                    <Link href="/jobs" className="text-sm text-gray-600" onClick={() => setMenuOpen(false)}>Jobs</Link>
                    <Link href="/applications" className="text-sm text-gray-600" onClick={() => setMenuOpen(false)}>Applications</Link>
                  </>
                )}
                {user.role === "RECRUITER" && (
                  <>
                    <Link href="/recruiter" className="text-sm text-gray-600" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <Link href="/recruiter/create-job" className="text-sm text-gray-600" onClick={() => setMenuOpen(false)}>Post Job</Link>
                  </>
                )}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="text-sm text-red-500 text-left">Logout</button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
