"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  Truck, 
  Thermometer, 
  MessageSquare, 
  Send, 
  Lock,
  Building2,
  Users
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  SharedListing, 
  HandoverChatMessage,
  getSharedListings, 
  getSharedListingById,
  getHandoverMessages,
  addHandoverMessage,
  saveHandoverMessages
} from "@/lib/shared-listings";

function HandoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const paramListingId = searchParams.get("listingId");
  const paramRole = searchParams.get("role") || (user?.role === "donor" ? "donor" : "recipient");

  const [activeListing, setActiveListing] = useState<SharedListing | null>(null);
  
  // Strictly two parties: Donor & Receiver
  const [activeSenderRole, setActiveSenderRole] = useState<"donor" | "recipient">("recipient");
  const [messages, setMessages] = useState<HandoverChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState<string>("");

  // Inspection states
  const [smellCheck, setSmellCheck] = useState<boolean>(true);
  const [containerCheck, setContainerCheck] = useState<boolean>(true);
  const [tempCheck, setTempCheck] = useState<boolean>(true);
  const [tempCelsius, setTempCelsius] = useState<string>("68.5");
  const [deliveredKg, setDeliveredKg] = useState<string>("35.0");
  const [verifiedStatus, setVerifiedStatus] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load listing & deduplicated chat messages
  const loadData = () => {
    let listing: SharedListing | undefined;
    if (paramListingId) {
      listing = getSharedListingById(paramListingId);
    }
    if (!listing) {
      const all = getSharedListings();
      listing = all.find((l) => l.status === "ACCEPTED") || all[0];
    }

    if (listing) {
      setActiveListing(listing);
      const rawMsgs = getHandoverMessages(listing.id);
      
      if (rawMsgs.length > 0) {
        // Strict deduplication by ID so messages NEVER appear twice
        const seen = new Set<string>();
        const unique = rawMsgs.filter((m) => {
          if (!m.id || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        setMessages(unique);
      } else {
        // Seed strictly two clean messages: Donor and Receiver
        const initialSeed: HandoverChatMessage[] = [
          {
            id: `msg-seed-1-${listing.id}`,
            listingId: listing.id,
            senderName: "Donor",
            senderRole: "donor",
            content: `Hello! Food (${listing.quantityValue} ${listing.quantityUnit}) is prepared and packed in insulated containers. Ready for pickup!`,
            sentAt: "14:15",
          },
          {
            id: `msg-seed-2-${listing.id}`,
            listingId: listing.id,
            senderName: "Receiver",
            senderRole: "recipient",
            content: `Thank you! Our kitchen team is prepared to receive the meals upon arrival. Handover OTP is confirmed.`,
            sentAt: "14:20",
          }
        ];
        saveHandoverMessages(listing.id, initialSeed);
        setMessages(initialSeed);
      }
    }
  };

  useEffect(() => {
    loadData();
    if (paramRole === "donor") {
      setActiveSenderRole("donor");
    } else {
      setActiveSenderRole("recipient");
    }

    const handleUpdate = () => loadData();
    window.addEventListener("annasetu_listings_updated", handleUpdate);
    window.addEventListener("annasetu_chat_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("annasetu_listings_updated", handleUpdate);
      window.removeEventListener("annasetu_chat_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [paramListingId, paramRole]);

  // Handle Send Direct Chat Message - strictly once, never duplicate
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeListing) return;

    const messageContent = newMsg.trim();
    setNewMsg("");

    // Strictly two names: Donor and Receiver
    const senderName = activeSenderRole === "donor" ? "Donor" : "Receiver";

    // Save to storage
    addHandoverMessage(
      activeListing.id,
      senderName,
      activeSenderRole,
      messageContent
    );

    // Read deduplicated list from storage immediately
    const rawMsgs = getHandoverMessages(activeListing.id);
    const seen = new Set<string>();
    const unique = rawMsgs.filter((m) => {
      if (!m.id || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
    setMessages(unique);
  };

  // Verify Handover
  const handleVerifyHandover = () => {
    const inspectionPassed = smellCheck && containerCheck && tempCheck;
    if (!inspectionPassed) {
      setActionMessage("Cannot complete handover: All physical inspection criteria must be confirmed before accepting surplus food.");
      return;
    }

    setVerifiedStatus("VERIFIED_DELIVERED");
    setActionMessage(`Handover successfully authenticated! OTP verified. Delivered food logged into AnnaSetu Impact Audit Trail.`);

    if (activeListing) {
      // Add a clean completion message from Receiver
      addHandoverMessage(
        activeListing.id,
        "Receiver",
        "recipient",
        `Handover completed successfully! We verified the temperature (${tempCelsius}°C) and aroma. All ${deliveredKg} kg safely received!`
      );
      const rawMsgs = getHandoverMessages(activeListing.id);
      const seen = new Set<string>();
      const unique = rawMsgs.filter((m) => {
        if (!m.id || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      setMessages(unique);
    }
  };

  if (!activeListing) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center font-body text-gray-500 text-sm">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-2 border-[#1F5D46] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading Delivery Handover...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-[#14221D] font-body flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (activeSenderRole === "donor") {
                  router.push("/dashboard/donor");
                } else {
                  router.push("/dashboard/recipient");
                }
              }}
              className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>

            <div className="hidden sm:block h-5 w-px bg-gray-200" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-[#1F5D46] tracking-tight">
                  AnnaSetu AI
                </span>
                <span className="text-xs bg-emerald-100 text-[#1F5D46] font-bold px-2.5 py-0.5 rounded-full">
                  Delivery & Chat
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Live Coordination Between Donor & Receiver
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Selector: strictly Donor View or Receiver View */}
            <div className="flex items-center rounded-xl border border-gray-300 p-1 bg-gray-50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveSenderRole("donor")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeSenderRole === "donor"
                    ? "bg-[#1F5D46] text-white shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Donor View
              </button>
              <button
                type="button"
                onClick={() => setActiveSenderRole("recipient")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeSenderRole === "recipient"
                    ? "bg-[#1F5D46] text-white shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Receiver View
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-6">
        
        {/* Banner Alert */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Top Summary: Donor and Receiver */}
        <section className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Delivering Party (Donor) */}
          <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#1F5D46]" />
              <span>Donor</span>
            </span>
            <h3 className="font-extrabold text-base text-[#14221D]">
              {activeListing.donorName || "Food Donor"}
            </h3>
            <p className="text-xs text-gray-600 font-medium">
              {activeListing.donorOrg || "Catering & Banquet"}
            </p>
            <p className="text-[11px] text-gray-500">
              Location: {activeListing.locationAddress}
            </p>
          </div>

          {/* Receiving Party (Receiver) */}
          <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Receiver</span>
            </span>
            <h3 className="font-extrabold text-base text-[#14221D]">
              {activeListing.acceptedByOrg || "Ashram / Shelter"}
            </h3>
            <p className="text-xs text-gray-600 font-medium">
              Meals Reserved: <strong className="text-[#1F5D46]">{activeListing.quantityValue} {activeListing.quantityUnit}</strong>
            </p>
            <p className="text-[11px] text-gray-500">
              Food: {activeListing.title}
            </p>
          </div>

          {/* Driver Logistics */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Delivery Status</span>
            </span>
            <h3 className="font-extrabold text-base text-[#14221D] flex items-center justify-between">
              <span>{activeListing.driverName || "Raju M. (Volunteer Driver)"}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                ETA 15 Mins
              </span>
            </h3>
            <p className="text-xs text-gray-600">
              Status: Food collected in insulated van, en route to Receiver
            </p>
          </div>

        </section>

        {/* Two-Column: Left = Delivery OTP & Inspection, Right = Direct Live Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Delivery OTP & Inspection (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Delivery OTP Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#1F5D46]" />
                  <h3 className="font-extrabold text-base text-[#14221D]">
                    Delivery Handover OTP
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Verification Code
                </span>
              </div>

              <p className="text-xs text-gray-500">
                The Receiver shares this OTP upon delivery to complete verification.
              </p>

              {/* Big OTP Display */}
              <div className="p-5 rounded-2xl bg-[#F8F9FA] border border-gray-200 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                  Handover Verification OTP
                </div>
                <div className="font-mono font-extrabold text-3xl tracking-widest text-[#1F5D46]">
                  {activeListing.handoverOtp || "849-216"}
                </div>
              </div>
            </div>

            {/* Mandatory Inspection Checklist */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-[#1F5D46]" />
                  <h4 className="font-bold text-sm text-[#14221D]">
                    Physical Inspection Checklist
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Inspection Gate
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smellCheck}
                    onChange={(e) => setSmellCheck(e.target.checked)}
                    className="mt-0.5 rounded text-[#1F5D46] focus:ring-[#1F5D46] w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-gray-900">Aroma & Freshness: </span>
                    <span className="text-gray-600">Fresh cooked scent. Completely free from off-odors.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={containerCheck}
                    onChange={(e) => setContainerCheck(e.target.checked)}
                    className="mt-0.5 rounded text-[#1F5D46] focus:ring-[#1F5D46] w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-gray-900">Container Hygiene: </span>
                    <span className="text-gray-600">Sealed insulated vessels intact without leaks.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempCheck}
                    onChange={(e) => setTempCheck(e.target.checked)}
                    className="mt-0.5 rounded text-[#1F5D46] focus:ring-[#1F5D46] w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-gray-900">Temperature Certified: </span>
                    <span className="text-gray-600">Hot held (&gt;65°C).</span>
                  </div>
                </label>
              </div>

              {/* Temp & Quantity Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Measured Temp (°C)</label>
                  <input
                    type="text"
                    value={tempCelsius}
                    onChange={(e) => setTempCelsius(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1F5D46]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Delivered (kg)</label>
                  <input
                    type="text"
                    value={deliveredKg}
                    onChange={(e) => setDeliveredKg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1F5D46]"
                  />
                </div>
              </div>

              {/* Confirm Handover Button */}
              <button
                type="button"
                onClick={handleVerifyHandover}
                disabled={verifiedStatus === "VERIFIED_DELIVERED"}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                  verifiedStatus === "VERIFIED_DELIVERED"
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-[#1F5D46] hover:bg-[#164333] text-white"
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

          {/* RIGHT COLUMN: Live Direct Chat between Donor & Receiver (7 cols) */}
          <div className="lg:col-span-7">
            
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs flex flex-col h-[650px] p-6 space-y-4">
              
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1F5D46] flex items-center justify-center font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#14221D]">
                      Direct Coordination Chat
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Live direct conversation between Donor and Receiver
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Secure Direct Relay</span>
                </div>
              </div>

              {/* Live Chat Message Stream: strictly Donor and Receiver */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
                {messages.map((m) => {
                  const isDonor = m.senderRole === "donor" || m.senderName === "Donor";

                  return (
                    <div 
                      key={m.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
                        isDonor
                          ? "bg-blue-50/70 border-blue-200 text-blue-950 ml-6"
                          : "bg-amber-50/70 border-amber-200 text-amber-950 mr-6"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-extrabold flex items-center gap-1.5">
                          {isDonor ? (
                            <>
                              <Building2 className="w-3.5 h-3.5 text-blue-700" />
                              <span className="text-blue-900 font-bold">Donor</span>
                            </>
                          ) : (
                            <>
                              <Users className="w-3.5 h-3.5 text-amber-700" />
                              <span className="text-amber-900 font-bold">Receiver</span>
                            </>
                          )}
                        </span>
                        <span className="text-gray-400 font-mono">{m.sentAt}</span>
                      </div>
                      <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input & Sender Selector: strictly Donor or Receiver */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-gray-100 space-y-2.5">
                
                {/* Active sender selector: only 2 names: Donor or Receiver */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-bold">Send Message As:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveSenderRole("donor")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        activeSenderRole === "donor"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Donor
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSenderRole("recipient")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        activeSenderRole === "recipient"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Receiver
                    </button>
                  </div>
                </div>

                {/* Input box */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder={
                      activeSenderRole === "donor"
                        ? "Type message as Donor (e.g. food packed at Gate 2)..."
                        : "Type message as Receiver (e.g. kitchen team ready to receive)..."
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F5D46]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>

              </form>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default function HandoverVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center font-body text-gray-500 text-sm">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-2 border-[#1F5D46] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading Delivery Handover...</p>
        </div>
      </div>
    }>
      <HandoverContent />
    </Suspense>
  );
}
