"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Utensils, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  KeyRound, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  UserPlus,
  User,
  Shield,
  Clock,
  HeartHandshake,
  Check,
  Lock
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, sendVerificationCode, verifyEmailCode } = useAuth();

  // If already authenticated, redirect straight to role-specific dashboard
  useEffect(() => {
    if (user) {
      if (user.role === "donor") {
        router.push("/dashboard/donor");
      } else {
        router.push("/dashboard/recipient");
      }
    }
  }, [user, router]);

  // Read role from query param or default to donor
  const initialRoleParam = searchParams.get("role");
  const [role, setRole] = useState<UserRole>(initialRoleParam === "recipient" ? "recipient" : "donor");

  // Keep state in sync if query param changes
  useEffect(() => {
    const qRole = searchParams.get("role");
    if (qRole === "recipient") {
      setRole("recipient");
    } else if (qRole === "donor") {
      setRole("donor");
    }
  }, [searchParams]);

  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [step, setStep] = useState<"enter_email" | "enter_otp">("enter_email");
  const [loading, setLoading] = useState(false);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isDonor = role === "donor";

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg(
        isDonor 
          ? "Please enter the Donor Coordinator name." 
          : "Please enter the Ashram Receptionist / Caretaker name."
      );
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      const result = await sendVerificationCode(email, role, fullName);
      setPreviewOtp(result.previewCode || null);
      setSuccessMsg(`Temporary verification OTP sent to ${email}`);
      setStep("enter_otp");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send verification OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg("Please enter the 6-digit OTP code received.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      await verifyEmailCode(email, otpCode, role, fullName, orgName);
      setSuccessMsg("Email verified! Redirecting to your personal dashboard...");
      
      // Strict redirect to role-specific dashboard only after OTP is verified
      setTimeout(() => {
        if (role === "donor") {
          router.push("/dashboard/donor");
        } else {
          router.push("/dashboard/recipient");
        }
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid verification OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-[#14221D] flex flex-col justify-between py-8 px-6 font-body">
      
      {/* Top Header */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between pb-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1F5D46] flex items-center justify-center text-white font-bold text-xl shadow-xs">
            अ
          </div>
          <div>
            <span className="font-bold text-lg text-[#1F5D46]">
              AnnaSetu AI
            </span>
            <span className="text-xs text-gray-500 block">
              {isDonor ? "Food Donor Portal Sign In" : "Ashram & Receptionist Intake Sign In"}
            </span>
          </div>
        </Link>

        <Link
          href={`/signup?role=${role}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>New {isDonor ? "Donor" : "Ashram"}? Register</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full py-8 space-y-6">
        
        {/* Role Switcher Tabs */}
        <div className="bg-gray-100/80 p-1.5 rounded-2xl flex items-center gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setRole("donor");
              setErrorMsg("");
              setStep("enter_email");
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              isDonor
                ? "bg-white text-[#1F5D46] shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-600" />
            <span>Food Donor / Caterer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("recipient");
              setErrorMsg("");
              setStep("enter_email");
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              !isDonor
                ? "bg-white text-[#1F5D46] shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Ashram / Receptionist</span>
          </button>
        </div>

        {/* Dynamic Header Based on Role */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-1 border shadow-2xs">
            {isDonor ? (
              <span className="bg-amber-50 text-amber-900 border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Utensils className="w-3 h-3 text-amber-600" />
                Caterers • Banquets • Restaurants • Event Planners
              </span>
            ) : (
              <span className="bg-blue-50 text-blue-900 border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-600" />
                Ashrams • Night Shelters • Orphanages • Community Kitchens
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold text-[#14221D]">
            {isDonor ? "Food Donor & Catering Sign In" : "Ashram Receptionist & Intake Sign In"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
            {isDonor
              ? "Publish surplus banquet meals, verify thermal shelf-life with AI vision, and coordinate instant volunteer dispatches."
              : "Review incoming freshly cooked meal offerings, run kitchen safety checks, and communicate directly with food donors."}
          </p>
        </div>

        {/* Dynamic Distinct Role Highlights Card */}
        <div className={`p-4 rounded-2xl border text-xs transition-all ${
          isDonor 
            ? "bg-amber-50/60 border-amber-200/80 text-amber-950" 
            : "bg-blue-50/60 border-blue-200/80 text-blue-950"
        }`}>
          <div className="font-bold flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#1F5D46]" />
            <span>{isDonor ? "Donor Portal Features & Tools" : "Ashram Receptionist Tools & Intake"}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-700">
            {isDonor ? (
              <>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>AI camera freshness & packaging verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Immediate broadcast to nearby ashrams within 5 km</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Direct two-party coordination chat with receiving staff</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Zero-liability digital handover receipt & OTP check</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time incoming food alerts matching dining capacity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sensory inspection & temperature checklist prior to intake</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Direct two-party coordination chat with donor manager</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Confidential 6-digit arrival verification OTP</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Privacy Notice Banner */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center gap-2.5 text-gray-600">
          <Lock className="w-4 h-4 text-[#1F5D46] shrink-0" />
          <span>
            <strong>Strict Privacy Isolation Active:</strong> {isDonor 
              ? "Your catering menus, kitchen financials, and donor logs remain strictly private and cannot be viewed by ashrams or external recipients." 
              : "Your shelter resident numbers, meal intake schedules, and pantry data are strictly private and shielded from external donors."}
          </span>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Code Dev / Testing Banner */}
        {previewOtp && step === "enter_otp" && (
          <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs space-y-1 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Temporary Verification OTP Dispatched</span>
            </div>
            <p className="text-gray-600">
              In production, this code is sent to <strong>{email}</strong>. For instant local testing, use:
            </p>
            <div className="text-2xl font-mono font-extrabold text-[#1F5D46] tracking-widest pt-1">
              {previewOtp}
            </div>
          </div>
        )}

        {/* Login Form Box */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          
          {step === "enter_email" ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              
              {/* Name & Organization Customized by Role */}
              <div className="space-y-4 pt-1">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    {isDonor ? "Donor Coordinator / Manager Name" : "Ashram Receptionist / Caretaker Name"}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isDonor ? "e.g. Ramesh Sharma (Catering Incharge)" : "e.g. Swami Anand / Sister Priya (Ashram Receptionist)"}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#1F5D46]"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {isDonor 
                      ? "This name will appear on your food dispatch receipts." 
                      : "This name will identify you in the arrival handover chat."}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    {isDonor ? "Catering / Banquet / Restaurant Name" : "Ashram / Community Shelter Name"}
                  </label>
                  <div className="relative">
                    {isDonor ? (
                      <Utensils className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    ) : (
                      <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    )}
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder={
                        isDonor
                          ? "e.g. Royal Palace Banquet & Caterers"
                          : "e.g. Shanti Annakshetra Community Ashram"
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#1F5D46]"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    {isDonor ? "Official Donor Email Address" : "Ashram Reception / Official Email Address"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isDonor ? "donor@caterer.com" : "reception@ashram.org"}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#1F5D46]"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    We will send a secure 6-digit OTP code to verify your session.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Send {isDonor ? "Donor" : "Ashram"} Sign-In OTP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              
              <div className="text-center space-y-1.5 pb-2">
                <span className="text-xs text-gray-600 block">
                  Verification OTP sent to <strong>{email}</strong>
                </span>
                <span className="text-xs text-gray-500 block">
                  Signing in as: <strong>{fullName}</strong> ({isDonor ? "Food Donor / Caterer" : "Ashram Receptionist"})
                </span>
                <button
                  type="button"
                  onClick={() => setStep("enter_email")}
                  className="text-xs text-[#1F5D46] font-semibold underline block mx-auto pt-1"
                >
                  Change email or details
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block text-center">
                  Enter 6-Digit Email OTP
                </label>
                <div className="relative max-w-xs mx-auto">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-11 pr-4 py-3 text-xl font-mono font-bold tracking-widest text-center rounded-xl border border-gray-300 focus:outline-none focus:border-[#1F5D46]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify OTP & Enter {isDonor ? "Donor" : "Ashram"} Dashboard</span>
              </button>

            </form>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 pt-6">
        AnnaSetu AI • Zero False Claims • Verified Email Authentication
      </footer>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center text-sm text-gray-500">
        Loading AnnaSetu authentication...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
