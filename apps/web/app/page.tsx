"use client";

import Link from "next/link";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Utensils, 
  Building2, 
  Truck, 
  Activity, 
  LogIn, 
  UserCircle2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] text-[#14221D] font-body">
      
      {/* Clean, Focused Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1F5D46] flex items-center justify-center text-white font-bold text-xl shadow-xs">
              अ
            </div>
            <div>
              <span className="font-bold text-lg text-[#1F5D46]">
                AnnaSetu AI
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] text-gray-500 font-medium">
                अन्नसेतु
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-600">
            <Link href="/listings" className="hover:text-[#1F5D46] transition-colors">
              Surplus Feed
            </Link>
            <Link href="/listings/create" className="hover:text-[#1F5D46] transition-colors">
              Donate Food
            </Link>
            <Link href="/recipients/capacity" className="hover:text-[#1F5D46] transition-colors">
              Ashram Demands
            </Link>
            <Link href="/handover" className="hover:text-[#1F5D46] transition-colors">
              Handover & OTP
            </Link>
            <Link href="/operations" className="hover:text-[#1F5D46] transition-colors">
              Operations
            </Link>
          </nav>

          {/* Auth Status & Sign In Button */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-[#1F5D46] border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <UserCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">{user.fullName}</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                  {user.role}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#1F5D46] text-white hover:bg-[#164333] transition-all shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Clean Landing Page */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 sm:py-16 space-y-16">
        
        {/* Simple & Clean Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>FSSAI-Compliant Food Rescue Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#14221D] tracking-tight leading-tight">
            Connect Surplus Food With <br />
            <span className="text-[#1F5D46]">Those Who Need It Most</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
            AnnaSetu AI bridges commercial event caterers and wedding hosts with verified ashrams, orphanages, and community shelters through verified digital handovers.
          </p>

          <div className="pt-2 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1F5D46] text-white font-bold text-sm hover:bg-[#164333] transition-all shadow-md group"
            >
              <span>Get Started — Select Your Role</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* The Two Main Action Paths (Donor vs Recipient) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* Path 1: For Donors */}
          <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Utensils className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                For Food Donors
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Have surplus wholesome meals from weddings, banquets, or corporate cafeterias? Post dish quantities with compulsory photo evidence to initiate a rapid rescue.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <Link
                href="/listings/create"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Post Food Surplus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/listings"
                className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs transition-colors"
              >
                Browse Active Listings
              </Link>
            </div>
          </div>

          {/* Path 2: For Ashrams & Recipients */}
          <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                For Ashrams & Shelters
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Run an orphanage, shelter, or community kitchen? Update your daily meal deficit and dietary preferences so the algorithm can match safe meals directly to you.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <Link
                href="/recipients/capacity"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Update Shelter Demand</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/handover"
                className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs transition-colors"
              >
                Verify Delivery with OTP
              </Link>
            </div>
          </div>

        </section>

        {/* Clean Verified Impact Counter Bar */}
        <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-2">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Verified Platform Impact</h3>
              <p className="text-[11px] text-gray-500">Only physically verified deliveries count toward this ledger.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full self-start">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>98.4% Handover Acceptance</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase">Meals Delivered</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1F5D46] mt-0.5">700+</div>
              <div className="text-[10px] text-gray-500">~350g wholesome portions</div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase">Food Rescued</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1F5D46] mt-0.5">245 kg</div>
              <div className="text-[10px] text-gray-500">Edible surplus saved</div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase">CO₂e Avoided</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-0.5">612 kg</div>
              <div className="text-[10px] text-gray-500">Landfill emissions prevented</div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase">Water Conserved</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-0.5">196,000 L</div>
              <div className="text-[10px] text-gray-500">Embedded water saved</div>
            </div>
          </div>
        </section>

      </main>

      {/* Clean Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 AnnaSetu AI. Clean, Verified Food Redistribution.</p>
          <div className="flex gap-4 font-semibold">
            <Link href="/login" className="hover:text-[#1F5D46]">Sign In</Link>
            <Link href="/operations" className="hover:text-[#1F5D46]">Operations</Link>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-[#1F5D46]">FastAPI Docs</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
