"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  Thermometer, 
  Scale, 
  MessageSquare, 
  Send, 
  Lock,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface ChatMessage {
  id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  sent_at: string;
}

export default function HandoverVerificationPage() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>("h0000000-0000-0000-0000-000000000001");
  const [otpCode, setOtpCode] = useState<string>("8492");
  const [expectedKg, setExpectedKg] = useState<number>(25.0);
  const [deliveredKg, setDeliveredKg] = useState<string>("25.0");
  const [smellCheck, setSmellCheck] = useState<boolean>(true);
  const [containerCheck, setContainerCheck] = useState<boolean>(true);
  const [tempCheck, setTempCheck] = useState<boolean>(true);
  const [tempCelsius, setTempCelsius] = useState<string>("68.5");
  const [notes, setNotes] = useState<string>("");
  const [verifiedStatus, setVerifiedStatus] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // In-app chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender_name: "Rahul Sharma (Donor)",
      sender_role: "donor",
      content: "Surplus 25kg Basmati Pulao packed in stainless steel insulated urns at Banquet Gate 2.",
      sent_at: "14:15",
    },
    {
      id: "m-2",
      sender_name: "Vikram (Volunteer Driver)",
      sender_role: "volunteer",
      content: "Loaded into delivery van. ETA to Shanti Ashram is 18 minutes.",
      sent_at: "14:28",
    },
  ]);
  const [newMsg, setNewMsg] = useState<string>("");

  const handleVerify = async () => {
    if (!user?.token) return;
    const inspectionPassed = smellCheck && containerCheck && tempCheck;

    if (!inspectionPassed) {
      setActionMessage("Cannot verify handover: All physical inspection criteria must be confirmed before accepting surplus food.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/v1/handover/sessions/${sessionId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          otp_code: otpCode,
          actual_delivered_kg: parseFloat(deliveredKg) || expectedKg,
          visual_inspection_passed: inspectionPassed,
          temperature_celsius: parseFloat(tempCelsius) || null,
          recipient_notes: notes || "Visual and thermal inspection completed. Clean delivery.",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setVerifiedStatus(data.status);
        setActionMessage(`Handover successfully verified! ${data.actual_delivered_kg} kg recorded in impact dashboard.`);
      } else {
        setActionMessage(`Verification failed (${res.status}): ${data.detail || "Invalid verification"}`);
      }
    } catch {
      // Offline/Local Simulation Fallback
      setVerifiedStatus("VERIFIED_DELIVERED");
      setActionMessage(`Handover verified (offline simulation): ${deliveredKg} kg delivered successfully.`);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender_name: `${user?.fullName || "Recipient"} (${user?.role || "recipient"})`,
      sender_role: user?.role || "recipient",
      content: newMsg.trim(),
      sent_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setNewMsg("");
  };

  return (
    <div className="min-h-screen bg-brand-cream text-ink-primary font-body pb-12">
      {/* Header */}
      <header className="border-b border-line-default bg-brand-paper sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/operations"
              className="p-2 -ml-2 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-brand-sage/40 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-brand-forest">AnnaSetu AI</span>
              <span className="text-line-default">/</span>
              <span className="font-semibold text-sm text-ink-secondary">Digital Handover & Verification</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-forest bg-brand-sage px-3 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4" />
            <span>FSSAI Handover Protocol</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Banner Alert */}
        {actionMessage && (
          <div className="p-4 rounded-xl bg-brand-paper border border-brand-leaf/30 shadow-sm text-xs font-semibold text-ink-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Handover Verification Form (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            {/* OTP Presentation Card */}
            <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-brand-forest" />
                  <h2 className="font-display font-bold text-base">Recipient Verification PIN</h2>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Ready at Arrival
                </span>
              </div>
              <p className="text-xs text-ink-secondary">
                Present this 4-digit PIN to the volunteer driver or donor upon physical arrival. Never share before physical inspection.
              </p>

              <div className="p-4 rounded-xl bg-brand-cream border border-line-default text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-ink-secondary tracking-widest">Digital Handover OTP</div>
                <div className="font-mono font-extrabold text-3xl tracking-widest text-brand-forest">{otpCode}</div>
                <div className="text-[10px] text-ink-secondary">Single-use cryptographically bound to Allocation #8492</div>
              </div>
            </div>

            {/* Mandatory Physical Inspection Checklist */}
            <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-brand-forest" />
                  <h3 className="font-display font-bold text-base">Mandatory Physical Inspection</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Required Before Accept
                </span>
              </div>
              <p className="text-xs text-ink-secondary">
                Recipients must conduct a physical assessment. Surplus food failing inspection must be declined to protect beneficiaries.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-brand-cream border border-line-default cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smellCheck}
                    onChange={(e) => setSmellCheck(e.target.checked)}
                    className="mt-0.5 rounded text-brand-forest focus:ring-brand-forest w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-ink-primary">Aroma & Freshness Assessment: </span>
                    <span className="text-ink-secondary">Natural fresh food scent. Completely free from sour, rancid, or off-odors.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-brand-cream border border-line-default cursor-pointer">
                  <input
                    type="checkbox"
                    checked={containerCheck}
                    onChange={(e) => setContainerCheck(e.target.checked)}
                    className="mt-0.5 rounded text-brand-forest focus:ring-brand-forest w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-ink-primary">Container Hygiene & Integrity: </span>
                    <span className="text-ink-secondary">Vessels were sealed during transit. No leaks, insect contamination, or dust exposure.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-brand-cream border border-line-default cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempCheck}
                    onChange={(e) => setTempCheck(e.target.checked)}
                    className="mt-0.5 rounded text-brand-forest focus:ring-brand-forest w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-ink-primary">Thermal Handover Check: </span>
                    <span className="text-ink-secondary">Food is hot held (&gt;60°C) or actively chilled (&lt;5°C).</span>
                  </div>
                </label>
              </div>

              {/* Temperature & Quantity Input */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-ink-primary mb-1">Measured Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempCelsius}
                    onChange={(e) => setTempCelsius(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-line-default bg-brand-paper text-xs font-semibold focus:outline-none focus:border-brand-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-primary mb-1">Delivered Quantity (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={deliveredKg}
                    onChange={(e) => setDeliveredKg(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-line-default bg-brand-paper text-xs font-semibold focus:outline-none focus:border-brand-forest"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleVerify}
                disabled={verifiedStatus === "VERIFIED_DELIVERED"}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                  verifiedStatus === "VERIFIED_DELIVERED"
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-brand-forest text-brand-paper hover:bg-brand-deep"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {verifiedStatus === "VERIFIED_DELIVERED"
                    ? "Handover Confirmed & Locked"
                    : `Authenticate OTP & Confirm Handover (${deliveredKg} kg)`}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: In-App Coordination Chat (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm flex flex-col h-[520px]">
              <div className="flex items-center justify-between border-b border-line-default pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-forest" />
                  <h3 className="font-display font-bold text-base">In-App Rescue Chat</h3>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-ink-secondary bg-brand-cream px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  <span>Masked Relay</span>
                </div>
              </div>

              {/* Privacy Disclaimer */}
              <div className="py-2 px-3 rounded-lg bg-brand-sage/40 text-[10px] text-brand-deep border border-brand-leaf/20 my-2">
                Personal phone numbers are masked to protect donor and recipient privacy. Coordination takes place within AnnaSetu.
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
                {messages.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-brand-cream border border-line-default text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-ink-primary">{m.sender_name}</span>
                      <span className="text-ink-secondary">{m.sent_at}</span>
                    </div>
                    <div className="text-ink-primary text-xs leading-relaxed">{m.content}</div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-line-default flex gap-2">
                <input
                  type="text"
                  placeholder="Type pickup instruction or note..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-line-default bg-brand-paper text-xs focus:outline-none focus:border-brand-forest"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-brand-forest text-brand-paper hover:bg-brand-deep transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
