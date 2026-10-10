"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Utensils, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  ArrowLeft,
  Check,
  X,
  Phone,
  Truck,
  QrCode,
  Users,
  AlertTriangle,
  Info
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  SharedListing, 
  getSharedListings, 
  acceptSharedListing, 
  declineSharedListing 
} from "@/lib/shared-listings";

export default function RecipientDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Strict route guard & Privacy Isolation
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?role=recipient");
      } else if (user.role === "donor") {
        // STRICT PRIVACY: Donors cannot view the Ashram/Receptionist page
        router.push("/dashboard/donor");
      }
    }
  }, [user, loading, router]);

  const [listings, setListings] = useState<SharedListing[]>([]);
  const [selectedListingForAccept, setSelectedListingForAccept] = useState<SharedListing | null>(null);
  const [selectedListingForDecline, setSelectedListingForDecline] = useState<SharedListing | null>(null);
  const [declineReason, setDeclineReason] = useState<string>("Sufficient meal supply already received");
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const loadListings = () => {
    const all = getSharedListings();
    setListings(all);
  };

  useEffect(() => {
    loadListings();
    const handleUpdate = () => loadListings();
    window.addEventListener("annasetu_listings_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("annasetu_listings_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleConfirmAccept = (listingId: string) => {
    const orgName = user?.organizationName || "Shanti Ashram Community Kitchen";
    const userName = user?.fullName || "Ashram Caretaker";
    const res = acceptSharedListing(listingId, orgName, userName);

    if (res.success) {
      loadListings();
      setSelectedListingForAccept(null);
      setActionSuccessNotice(`Food accepted! Redirecting to Delivery Page & Direct Chat...`);
      setTimeout(() => {
        router.push(`/handover?listingId=${listingId}&role=recipient`);
      }, 700);
    }
  };

  const handleConfirmDecline = (listingId: string) => {
    declineSharedListing(listingId, declineReason);
    loadListings();
    setSelectedListingForDecline(null);
    setActionSuccessNotice(`Listing declined and atomically re-routed to the next nearest community shelter.`);
    setTimeout(() => setActionSuccessNotice(null), 6000);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center font-body text-gray-500 text-sm">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-2 border-[#1F5D46] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Verifying secure recipient session...</p>
        </div>
      </div>
    );
  }

  // Strict Privacy Isolation: Donors cannot see Recipient/Ashram page
  if (user.role === "donor") {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center font-body px-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto font-bold text-xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-gray-900">Private Ashram Portal</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Privacy Protection Active: You are logged in as a <strong>Food Donor</strong>. This recipient dashboard is strictly private to verified ashrams, shelters, and food receptionists.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push("/dashboard/donor")}
              className="w-full py-2.5 rounded-xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-xs transition-colors"
            >
              Go to Your Donor Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-[#14221D] font-body flex flex-col justify-between">
      
      {/* Top Navigation */}
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
                <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                  Ashram / Recipient Portal
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Live Surplus Food Allocation & Handover Verification
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">

            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
        
        {/* Welcome & Capacity Header */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>Verified Ashram / Shelter Kitchen</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14221D]">
              Welcome, {user.fullName || "Ashram Caretaker"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Logged in for <strong className="text-gray-800">{user.organizationName || "Shanti Ashram Community Kitchen"}</strong> ({user.email}). View live surplus meals posted by donors below and choose to Accept or Deny.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-gray-200 text-center min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Residents In Need</span>
              <span className="text-xl font-extrabold text-[#1F5D46]">180 People</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-gray-200 text-center min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Cold Storage</span>
              <span className="text-xl font-extrabold text-emerald-600">Available</span>
            </div>
          </div>
        </section>

        {/* Global Notification */}
        {actionSuccessNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-bold">{actionSuccessNotice}</p>
          </div>
        )}

        {/* Live Incoming Food Listings Feed */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#14221D] flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#1F5D46]" />
                <span>Live Surplus Food Available for Delivery</span>
              </h2>
              <p className="text-xs text-gray-500">
                AI verified surplus meals prepared by nearby banquet halls, caterers, and events.
              </p>
            </div>

            <button
              onClick={loadListings}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Feed</span>
            </button>
          </div>

          {/* Listings Cards */}
          <div className="space-y-5">
            {listings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-sm space-y-2">
                <Info className="w-8 h-8 text-gray-400 mx-auto" />
                <p>No active surplus food postings available right now.</p>
                <p className="text-xs text-gray-400">
                  Switch to the Donor Portal to post fresh surplus food. It will immediately appear here!
                </p>
              </div>
            ) : (
              listings.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:border-emerald-300 transition-all flex flex-col md:flex-row gap-6 items-start"
                >
                  {/* Photo */}
                  <div className="w-full md:w-56 h-44 rounded-2xl overflow-hidden shrink-0 bg-gray-100 relative">
                    <img 
                      src={item.photoUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-xs">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                        {item.safetyScore}% Safe
                      </span>
                    </div>
                  </div>

                  {/* Main Details */}
                  <div className="flex-1 space-y-3 w-full">
                    
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-[#14221D]">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Offered by: <strong className="text-gray-800">{item.donorName}</strong> ({item.donorOrg})
                        </p>
                      </div>

                      {/* Status Badges */}
                      {item.status === "ACCEPTED" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Accepted by {item.acceptedByOrg || "Your Ashram"}
                        </span>
                      ) : item.status === "DECLINED" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                          Declined ({item.declineReason})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          Available for Acceptance
                        </span>
                      )}
                    </div>

                    {/* AI Verified Summary */}
                    <div className="p-3.5 rounded-2xl bg-[#FDFCF7] border border-emerald-200/80 text-xs text-[#14221D] space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-[#1F5D46] text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AI Assistant Verified Nutrition & Hygiene:</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {item.aiEnhancedDescription || item.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.dietaryBadges?.map((badge, idx) => (
                          <span 
                            key={idx}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800"
                          >
                            ✓ {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Live Specs & Pickup Distance */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Quantity</span>
                        <span className="font-extrabold text-[#1F5D46]">{item.quantityValue} {item.quantityUnit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Distance</span>
                        <span className="font-semibold text-gray-800">{item.distanceKm} km away</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Prepared Time</span>
                        <span className="font-semibold text-gray-800">{item.prepTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Safe Window</span>
                        <span className="font-extrabold text-amber-700">{item.expiryHours} hours left</span>
                      </div>
                    </div>

                    {/* Location Address */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#1F5D46]" />
                      <span>{item.locationAddress} ({item.landmark})</span>
                    </div>

                    {/* ACCEPT / DECLINE BUTTONS or HANDOVER OTP CARD */}
                    {item.status === "VERIFIED" ? (
                      <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedListingForAccept(item)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                        >
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Accept Food ({item.quantityValue} {item.quantityUnit})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedListingForDecline(item)}
                          className="py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                          <span>Deny / Decline</span>
                        </button>
                      </div>
                    ) : item.status === "ACCEPTED" ? (
                      <div className="pt-3 border-t border-gray-100 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-emerald-700" />
                            <span>Delivery Volunteer Dispatched: {item.driverName}</span>
                          </span>
                          <span className="text-emerald-700 font-extrabold">
                            ETA: {item.driverEtaMinutes || 20} Mins
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Handover Verification OTP</span>
                            <span className="font-mono text-base font-extrabold text-[#1F5D46] tracking-wider">
                              {item.handoverOtp}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/handover?listingId=${item.id}&role=recipient`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-xs shadow-xs transition-all"
                            >
                              <span>Open Delivery & Live Chat</span>
                              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 text-xs text-gray-400 italic">
                        This listing was declined and re-routed.
                      </div>
                    )}

                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* MODAL: Confirm Accept */}
      {selectedListingForAccept && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-5 border border-gray-200 animate-in zoom-in-95">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-2">
                <Check className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-lg font-extrabold text-[#14221D]">
                Confirm Food Acceptance
              </h3>
              <p className="text-xs text-gray-500">
                You are accepting this meal allocation for <strong>{user.organizationName || "Shanti Ashram"}</strong>.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Dish:</span>
                <span className="font-bold text-gray-800">{selectedListingForAccept.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quantity:</span>
                <span className="font-bold text-[#1F5D46]">{selectedListingForAccept.quantityValue} {selectedListingForAccept.quantityUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Donor Location:</span>
                <span className="font-bold text-gray-800">{selectedListingForAccept.landmark}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedListingForAccept(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAccept(selectedListingForAccept.id)}
                className="flex-1 py-2.5 rounded-xl bg-[#1F5D46] text-xs font-bold text-white hover:bg-[#164333]"
              >
                Confirm & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Decline */}
      {selectedListingForDecline && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-5 border border-gray-200 animate-in zoom-in-95">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold mb-2">
                <X className="w-5 h-5 text-rose-700" />
              </div>
              <h3 className="text-lg font-extrabold text-[#14221D]">
                Decline Food Donation
              </h3>
              <p className="text-xs text-gray-500">
                Please select a reason. The allocation engine will immediately offer this surplus to the next shelter.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">Decline Reason</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#1F5D46] bg-white"
              >
                <option>Sufficient meal supply already received</option>
                <option>Ashram dining capacity full for tonight</option>
                <option>Pickup distance exceeds collection window</option>
                <option>Dietary restriction mismatch</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedListingForDecline(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDecline(selectedListingForDecline.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-700 text-xs font-bold text-white hover:bg-rose-800"
              >
                Decline & Re-route
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
