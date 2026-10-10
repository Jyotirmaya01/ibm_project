"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Utensils, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  LogIn, 
  Lock, 
  Mail,
  Heart
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginAsRole, logout } = useAuth();
  const [customEmail, setCustomEmail] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("donor");
  const [msg, setMsg] = useState("");

  const handleRoleSelect = async (role: UserRole, targetPath: string) => {
    await loginAsRole(role);
    setMsg(`Logged in successfully as ${role.toUpperCase()}`);
    setTimeout(() => {
      router.push(targetPath);
    }, 400);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    await loginAsRole(selectedRole);
    setMsg(`Authenticated as ${selectedRole.toUpperCase()}`);
    setTimeout(() => {
      if (selectedRole === "donor") router.push("/listings/create");
      else if (selectedRole === "recipient") router.push("/recipients/capacity");
      else if (selectedRole === "volunteer") router.push("/handover");
      else router.push("/operations");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#14221D] flex flex-col justify-between py-8 px-6 font-body">
      
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#164333] to-[#1F5D46] flex items-center justify-center text-white font-bold text-xl shadow-md">
            अ
          </div>
          <div>
            <span className="font-bold text-lg text-[#1F5D46]">
              AnnaSetu AI
            </span>
            <span className="text-xs text-gray-500 block">
              Identity & Access Management
            </span>
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-block text-gray-600">
              Active Session: <strong>{user.fullName}</strong> ({user.role.toUpperCase()})
            </span>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full py-10 space-y-10">
        
        {/* Title */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14221D]">
            Sign In to AnnaSetu
          </h1>
          <p className="text-sm text-gray-600">
            Select your role below for instant one-click portal access, or sign in with your registered organization credentials.
          </p>
          {msg && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{msg}</span>
            </div>
          )}
        </div>

        {/* 1-Click Role Switcher Cards (The Core Focus Requested) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Food Donor Card */}
          <div className="p-6 rounded-2xl bg-white border-2 border-amber-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Utensils className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Donors & Caterers
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  I Want to Donate Food
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Wedding halls, event organizers, corporate cafeterias, and restaurants with surplus wholesome meals.
                </p>
              </div>

              <ul className="text-xs text-gray-600 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>List unconsumed surplus with dish & weight breakdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Upload compulsory photo evidence for FSSAI verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Track real-time driver dispatch & verified meal receipts</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleSelect("donor", "/listings/create")}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-sm transition-all"
            >
              <span>Continue as Food Donor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Food Recipient Card */}
          <div className="p-6 rounded-2xl bg-white border-2 border-blue-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  Ashrams & Shelters
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  I Need Food for Our Shelter
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Verified orphanages, elderly ashrams, night shelters, and community kitchens serving meals to those in need.
                </p>
              </div>

              <ul className="text-xs text-gray-600 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Broadcast live daily occupancy & meal deficit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Specify dietary requirements (e.g., Pure Vegetarian)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Conduct physical aroma/temp inspection & verify with OTP PIN</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleSelect("recipient", "/recipients/capacity")}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all"
            >
              <span>Continue as Food Recipient</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3. Volunteer Driver Card */}
          <div className="p-6 rounded-2xl bg-white border-2 border-purple-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  Logistics & Delivery
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Volunteer Driver
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Community delivery partners transporting sealed, hot/cold insulated food bins safely.
                </p>
              </div>

              <ul className="text-xs text-gray-600 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Accept rescue delivery requests with route & ETA</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Coordinate with donors & recipients via masked in-app chat</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleSelect("volunteer", "/handover")}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition-all"
            >
              <span>Continue as Volunteer Driver</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 4. Operations & Safety Reviewer Card */}
          <div className="p-6 rounded-2xl bg-white border-2 border-emerald-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Operations & Safety
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Operations Console
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  FSSAI safety reviewers, NGO network coordinators, and platform auditors.
                </p>
              </div>

              <ul className="text-xs text-gray-600 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Review held food items with holding duration warnings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Monitor live audit log stream and verified impact ledger</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleSelect("coordinator", "/operations")}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-sm shadow-sm transition-all"
            >
              <span>Continue as Operations Coordinator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Secondary: Standard Email/Password Form */}
        <div className="max-w-md mx-auto pt-6 border-t border-gray-200">
          <form onSubmit={handleCustomSubmit} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 text-center">
              Or Sign In with Organization Email
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#1F5D46]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#1F5D46]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Select Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#1F5D46]"
              >
                <option value="donor">Food Donor (Caterer / Banquets)</option>
                <option value="recipient">Food Recipient (Ashram / Shelter)</option>
                <option value="volunteer">Volunteer Driver</option>
                <option value="coordinator">Operations Coordinator</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 pt-8">
        AnnaSetu AI • Secure Multi-Role Food Rescue Architecture
      </footer>

    </div>
  );
}
