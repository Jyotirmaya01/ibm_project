"use client";

import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowRight, 
  Utensils, 
  Building2, 
  LogIn, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  HeartHandshake, 
  Sparkles
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDFCF7] text-[#14221D] font-body selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Top Header: Strictly ONLY Log In & Sign Up */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          
          {/* Logo & Platform Name */}
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
                  अन्नसेतु
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Surplus Food Redistribution & Rescue Network
              </p>
            </div>
          </Link>

          {/* Strictly Only Two Buttons: Log In & Sign Up */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              <LogIn className="w-4 h-4 text-gray-600" />
              <span>Log In</span>
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-xl bg-[#1F5D46] text-white hover:bg-[#164333] transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Project Details Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 sm:py-16 space-y-20">
        
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#1F5D46] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Intelligent, Need-Based Food Redistribution</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#14221D] tracking-tight leading-tight">
            Bridging Surplus Food to <br />
            <span className="text-[#1F5D46]">Ashrams & Shelters in Need</span>
          </h1>

          <p className="text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
            AnnaSetu AI connects commercial event caterers, wedding banquets, and food distributors with verified ashrams, orphanages, and community shelters — preventing food wastage through safety verification and OTP-authenticated delivery.
          </p>

          {/* Strictly Only Two Primary Actions: Sign Up & Log In */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#1F5D46] text-white font-bold text-sm hover:bg-[#164333] transition-all shadow-md group"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up for Access</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-800 font-bold text-sm hover:bg-gray-50 hover:border-gray-400 transition-all shadow-xs"
            >
              <LogIn className="w-4 h-4 text-[#1F5D46]" />
              <span>Log In with OTP</span>
            </Link>
          </div>
        </section>

        {/* The Two Entities We Serve: Vendor vs Receiver */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14221D]">
              Built for Two Core Stakeholders
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              A purposeful system designed strictly for those who donate surplus meals and those who shelter and feed people in need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Entity 1: Food Donors / Vendors */}
            <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between space-y-6 hover:border-amber-400 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Utensils className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    Donor / Distributor
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                    Food Donors & Vendors
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Caterers, wedding halls, hotels, restaurants, and wholesale food distributors with freshly prepared surplus meals.
                </p>

                <ul className="space-y-2.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Quickly list surplus quantity, preparation time, and dietary tags (Veg/Non-Veg).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Automated food safety shelf-life calculation based on FSSAI guidelines.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Receive real-time confirmation when nearby verified ashrams accept the batch.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Link
                  href="/signup?role=donor"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <span>Sign Up as Food Donor / Vendor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Entity 2: Food Receivers / Ashrams */}
            <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between space-y-6 hover:border-blue-400 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Recipient Organization
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                    Ashrams & Community Shelters
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Registered ashrams, orphanages, old-age shelters, and charitable dining facilities serving meals to vulnerable individuals.
                </p>

                <ul className="space-y-2.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Broadcast daily meal deficits, dining headcounts, and refrigeration capacity.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Get paired with freshly cooked surplus meals within safe transit proximity.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Secure handover verification using a confidential 6-digit delivery OTP code.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Link
                  href="/signup?role=recipient"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <span>Sign Up as Receiver / Ashram</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* In-Depth Project Details & How the System Works */}
        <section className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-sm space-y-10">
          
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <span className="text-xs font-bold text-[#1F5D46] uppercase tracking-wider">
              Project Architecture & Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14221D]">
              How AnnaSetu AI Rescues Food in Real Time
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              From the instant a banquet concludes to the moment warm meals are received at an ashram, our 4-stage protocol ensures zero spoilage and complete transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#1F5D46] font-bold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="font-bold text-sm text-gray-900">
                Surplus Intake
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                The food donor submits dish quantity, food type, preparation time, and photo verification from their kitchen.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#1F5D46] font-bold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="font-bold text-sm text-gray-900">
                Safety Evaluation
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Automated evaluation checks dish perishability and temperature decay curves to compute the exact safe consumption window.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#1F5D46] font-bold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="font-bold text-sm text-gray-900">
                Need-Based Matching
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Demand discovery identifies nearby ashrams with immediate dinner or lunch deficits within the reachability radius.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#1F5D46] font-bold flex items-center justify-center text-sm">
                04
              </div>
              <h3 className="font-bold text-sm text-gray-900">
                OTP Handover
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Delivery reaches the ashram. Handover is finalized only after recipient enters their confidential 6-digit delivery OTP.
              </p>
            </div>

          </div>

          {/* Core Commitments */}
          <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#1F5D46] shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900">100% Free & Dignified</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Surplus food is never resold, commercialized, or monetized.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#1F5D46] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900">FSSAI Safety Compliance</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Perishable dishes past their safe consumption limit are rejected.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#1F5D46] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900">Fast Handover Windows</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Real-time alerts ensure meals reach beneficiaries while warm.</p>
              </div>
            </div>
          </div>

        </section>

        {/* Final Bottom Call to Action: Strictly Only Sign Up & Log In */}
        <section className="text-center p-10 sm:p-14 rounded-3xl bg-[#1F5D46] text-white space-y-6 shadow-md">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Save Meals or Receive Food?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Create an account with your organization details or sign in directly using email OTP verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#1F5D46] font-bold text-xs hover:bg-emerald-50 transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up (Donor or Receiver)</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#164333] border border-emerald-700 text-white font-bold text-xs hover:bg-[#123629] transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to Existing Account</span>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer: Strictly Log In & Sign Up */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 AnnaSetu AI. Clean, Verified Food Redistribution.</p>
          <div className="flex gap-6 font-semibold">
            <Link href="/login" className="hover:text-[#1F5D46]">Log In</Link>
            <Link href="/signup" className="hover:text-[#1F5D46]">Sign Up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
