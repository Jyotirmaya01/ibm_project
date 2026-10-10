"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Utensils, 
  ArrowRight, 
  CheckCircle2, 
  LogOut, 
  Bot, 
  ShieldCheck, 
  PlusCircle, 
  QrCode,
  Users
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Strict route guard & automatic role dispatch
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "donor") {
        router.push("/dashboard/donor");
      } else {
        router.push("/dashboard/recipient");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center font-body text-gray-500 text-sm">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-2 border-[#1F5D46] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Verifying secure session...</p>
        </div>
      </div>
    );
  }

  const isDonor = user.role === "donor";

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-[#14221D] font-body flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F5D46] flex items-center justify-center text-white font-bold text-xl shadow-xs">
              अ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-[#1F5D46] tracking-tight">
                  AnnaSetu AI
                </span>
                <span className="text-xs bg-emerald-100 text-[#1F5D46] font-bold px-2 py-0.5 rounded-full">
                  Dashboard
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                {isDonor ? "Food Donor / Vendor Workspace" : "Ashram / Receiver Workspace"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-gray-800">
                {user.fullName || user.organizationName || "Verified User"}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{user.email}</span>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-10">
        
        {/* Welcome & Role Card */}
        <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>OTP Authenticated Session</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14221D]">
              Welcome, {user.fullName || user.organizationName}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {isDonor
                ? "You are logged in as a Food Donor / Vendor. Post surplus meals from your events to immediately alert nearby ashrams."
                : "You are logged in as an Ashram / Shelter Recipient. Broadcast your dining demands and verify food deliveries using 6-digit OTP."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1.5 shrink-0 min-w-[220px]">
            <div className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
              Organization Role
            </div>
            <div className="font-bold text-sm text-[#1F5D46] flex items-center gap-2">
              {isDonor ? <Utensils className="w-4 h-4 text-amber-600" /> : <Building2 className="w-4 h-4 text-blue-600" />}
              <span>{isDonor ? "Food Donor / Vendor" : "Food Receiver / Ashram"}</span>
            </div>
            <div className="text-[11px] text-gray-500">
              Establishment: <strong>{user.organizationName || "Registered Center"}</strong>
            </div>
          </div>
        </section>

        {/* Action Center Tailored to the Role */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#14221D]">
            {isDonor ? "Donor Actions & Management" : "Ashram Actions & Demands"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {isDonor ? (
              <>
                {/* Donor Action 1 */}
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Donate Food Surplus
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Log leftover banquet dishes, portions, prep timestamp, and dietary flags for immediate pickup.
                    </p>
                  </div>
                  <Link
                    href="/listings/create"
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>Create Donation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Donor Action 2 */}
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1F5D46] flex items-center justify-center">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Active Listings Feed
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Monitor surplus listings, recipient match status, and volunteer pickup updates in real time.
                    </p>
                  </div>
                  <Link
                    href="/listings"
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-colors"
                  >
                    <span>Browse Feed</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Ashram Action 1 */}
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Update Meal Demand
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Declare your shelter's meal requirements, dining schedule, and storage capacity so donors can match meals.
                    </p>
                  </div>
                  <Link
                    href="/recipients/capacity"
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>Broadcast Demand</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Ashram Action 2 */}
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1F5D46] flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Verify Delivery with OTP
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Generate or verify the confidential 6-digit handover OTP upon physical arrival of the food vehicle.
                    </p>
                  </div>
                  <Link
                    href="/handover"
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-colors"
                  >
                    <span>Delivery Handover</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </>
            )}

            {/* Common Action: Autonomous AI Copilot */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-purple-400 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-gray-900">
                  AI Coordination Copilot
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Trigger autonomous LangGraph agent pipelines for real-time safety inspection, route dispatch, and allocation.
                </p>
              </div>
              <Link
                href="/agent"
                className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Launch Copilot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 AnnaSetu AI • Zero False Claims • Verified Email Authentication</p>
          <div className="flex gap-6 font-semibold">
            <Link href="/" className="hover:text-[#1F5D46]">Home</Link>
            <button onClick={logout} className="hover:text-rose-600">Sign Out</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
