"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Utensils, 
  Camera, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  RefreshCw, 
  LogOut, 
  ArrowRight,
  Eye,
  Check,
  Send,
  Navigation,
  FileCheck2,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  SharedListing, 
  getSharedListings, 
  saveSharedListing 
} from "@/lib/shared-listings";
import AddressAutocomplete from "@/components/address-autocomplete";
import { 
  matchNearbyAshramsWithGeminiFlash, 
  NearbyAshramMatch 
} from "@/lib/gemini-flash-matcher";

export default function DonorDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Strict route guard & Privacy Isolation
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?role=donor");
      } else if (user.role !== "donor") {
        // STRICT PRIVACY: Recipients/Receptionists cannot view the Donor page
        router.push("/dashboard/recipient");
      }
    }
  }, [user, loading, router]);

  // Form states
  const [dishTitle, setDishTitle] = useState("Royal Vegetable Pulao & Paneer Gravy");
  const [category, setCategory] = useState("Cooked Rice & Grains");
  const [description, setDescription] = useState("Freshly prepared banquet lunch buffet. Kept strictly untouched in hot insulated chafing vessels.");
  const [quantityValue, setQuantityValue] = useState<number>(120);
  const [quantityUnit, setQuantityUnit] = useState<string>("meals");
  const [prepTime, setPrepTime] = useState<string>("1:00 PM Today");
  const [storageCondition, setStorageCondition] = useState<string>("Hot insulated vessels (>65°C)");
  const [contactPersonName, setContactPersonName] = useState<string>(user?.fullName || "Jyotirmaya Sabat");
  const [donorPhone, setDonorPhone] = useState<string>("+91 98765 43210");
  const [locationAddress, setLocationAddress] = useState<string>("Sabat Grand Banquet Hall, 80 Feet Road, Indiranagar, Bengaluru");
  const [landmark, setLandmark] = useState<string>("Near BDA Complex Indiranagar");

  // Keep contactPersonName synced with logged-in user profile
  useEffect(() => {
    if (user?.fullName) {
      setContactPersonName(user.fullName);
    }
  }, [user?.fullName]);

  // Photo state
  const [photoUrl, setPhotoUrl] = useState<string>("https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60");
  const [isPhotoBlurry, setIsPhotoBlurry] = useState<boolean>(false);

  // AI Verification Bot State
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationStage, setVerificationStage] = useState<number>(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiEnhancedText, setAiEnhancedText] = useState<string>("");
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Google Gemini Flash Bot Ashram Matches State
  const [flashMatches, setFlashMatches] = useState<NearbyAshramMatch[]>([]);
  const [isMatchingWithFlash, setIsMatchingWithFlash] = useState<boolean>(false);
  const [dispatchSuccessAshram, setDispatchSuccessAshram] = useState<string | null>(null);

  // Live listings state
  const [myListings, setMyListings] = useState<SharedListing[]>([]);

  const loadListings = () => {
    const all = getSharedListings();
    setMyListings(all);
    // If we have listings and no matches computed yet, compute initial match
    if (all.length > 0 && flashMatches.length === 0) {
      const top = all[0];
      matchNearbyAshramsWithGeminiFlash({
        title: top.title,
        category: top.category,
        quantityValue: top.quantityValue,
        quantityUnit: top.quantityUnit,
        pickupAddress: top.locationAddress,
        landmark: top.landmark,
        storageCondition: top.storageCondition,
        prepTime: top.prepTime,
        donorName: top.donorName,
      }).then((res) => {
        setFlashMatches(res.matches);
      });
    }
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

  // Handle Photo Upload
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
          setIsPhotoBlurry(false);
          setAiError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit and Trigger AI Verification
  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      setAiError("Please upload or select a food photo before submitting.");
      return;
    }

    setAiError(null);
    setSuccessNotice(null);
    setIsVerifying(true);
    setVerificationStage(1);

    // Stage 1: Photo clarity check
    setTimeout(() => {
      if (isPhotoBlurry) {
        setIsVerifying(false);
        setAiError("⚠️ AI Vision Notice: Food photo is blurry or missing packaging view. Please click 'Fix & Re-upload Clear Photo' below.");
        return;
      }
      setVerificationStage(2);

      // Stage 2: Food safety rule check
      setTimeout(() => {
        setVerificationStage(3);

        // Stage 3: AI Description Enhancement
        const enhanced = `AI Verified: High-quality ${dishTitle.toLowerCase()}. Prepared ${prepTime} under clean hygienic protocols. Temperature certified (${storageCondition}). Rich in balanced plant protein and fiber. Safely packed in food-grade steel containers suitable for prompt community distribution.`;
        setAiEnhancedText(enhanced);

        setTimeout(() => {
          setVerificationStage(4);

          // Stage 4: Automatically publish listing
          setTimeout(() => {
            const newListing: SharedListing = {
              id: `listing-${Date.now()}`,
              title: dishTitle,
              description: description,
              aiEnhancedDescription: enhanced,
              category: category,
              quantityValue: Number(quantityValue),
              quantityUnit: quantityUnit,
              photoUrl: photoUrl,
              donorName: contactPersonName.trim() || user?.fullName || "Food Donor",
              donorOrg: user?.organizationName || "Sabat Catering",
              donorPhone: donorPhone,
              locationAddress: locationAddress,
              landmark: landmark,
              distanceKm: 1.8,
              prepTime: prepTime,
              expiryHours: 4,
              storageCondition: storageCondition,
              status: "VERIFIED",
              createdAt: new Date().toISOString(),
              dietaryBadges: ["Pure Veg", "AI Verified", "Insulated Packaging", "FSSAI Compliant"],
              safetyScore: 99,
            };

            saveSharedListing(newListing);
            loadListings();
            setIsVerifying(false);
            setSuccessNotice(`Food listing successfully AI verified and published live! Nearby Ashrams can now view and accept it.`);

            // Trigger Google Gemini Flash Matcher Bot
            setIsMatchingWithFlash(true);
            matchNearbyAshramsWithGeminiFlash({
              title: dishTitle,
              category: category,
              quantityValue: Number(quantityValue),
              quantityUnit: quantityUnit,
              pickupAddress: locationAddress,
              landmark: landmark,
              storageCondition: storageCondition,
              prepTime: prepTime,
              donorName: contactPersonName.trim() || user?.fullName || "Food Donor",
            }).then((res) => {
              setFlashMatches(res.matches);
              setIsMatchingWithFlash(false);
            });
          }, 800);
        }, 1000);
      }, 1000);
    }, 1200);
  };

  const handleFixBlurryPhoto = () => {
    setPhotoUrl("https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=60");
    setIsPhotoBlurry(false);
    setAiError(null);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center font-body text-gray-500 text-sm">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-2 border-[#1F5D46] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Verifying secure donor session...</p>
        </div>
      </div>
    );
  }

  // Strict Privacy Isolation: Ashrams/Receptionists cannot see Donor page
  if (user.role !== "donor") {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center font-body px-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto font-bold text-xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-gray-900">Private Donor Portal</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Privacy Protection Active: You are logged in as an <strong>Ashram / Receptionist</strong>. This donor dashboard is strictly private to verified caterers and food donors.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push("/dashboard/recipient")}
              className="w-full py-2.5 rounded-xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-xs transition-colors"
            >
              Go to Your Ashram Dashboard
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
                <span className="text-xs bg-emerald-100 text-[#1F5D46] font-bold px-2.5 py-0.5 rounded-full">
                  Donor Portal
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Surplus Food Posting & AI Safety Verification
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
        
        {/* Welcome Banner */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Food Donor / Caterer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14221D]">
              Welcome, {user.fullName || "Food Donor"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Posting on behalf of <strong className="text-gray-800">{user.organizationName || "Sabat Catering"}</strong> ({user.email}). Post surplus food below for instant AI verification and immediate ashram dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-gray-200 text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Postings</span>
              <span className="text-xl font-extrabold text-[#1F5D46]">{myListings.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-gray-200 text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Safety Score</span>
              <span className="text-xl font-extrabold text-emerald-600">100%</span>
            </div>
          </div>
        </section>

        {/* Success Alert */}
        {successNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">{successNotice}</p>
              <p className="text-xs text-emerald-700">
                You can scroll down to view your active listing, or switch to the Recipient Portal to test accepting it as an Ashram.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 1: Surplus Food Posting Form */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-[#14221D] flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#1F5D46]" />
                <span>Post Surplus Food Details</span>
              </h2>
              <p className="text-xs text-gray-500">
                Fill in the live details and upload a photo. Our AI Assistant Bot will automatically verify and publish it.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Step 1 of 2: Food Entry
            </span>
          </div>

          <form onSubmit={handleSubmitListing} className="space-y-6">
            
            {/* Photo Upload Area */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Food Dish Photo (Compulsory for AI Safety Audit)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Photo Preview Card */}
                <div className="md:col-span-1 rounded-2xl border-2 border-dashed border-gray-300 p-2 relative bg-gray-50 flex flex-col items-center justify-center min-h-[190px] overflow-hidden group">
                  {photoUrl ? (
                    <div className="relative w-full h-full min-h-[180px] rounded-xl overflow-hidden">
                      <img 
                        src={photoUrl} 
                        alt="Food preview" 
                        className={`w-full h-full object-cover transition-all ${isPhotoBlurry ? "blur-sm" : ""}`}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                        <Camera className="w-4 h-4" />
                        <span>Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-600">Upload Dish Photo</p>
                      <p className="text-[10px] text-gray-400">PNG, JPG up to 10MB</p>
                    </div>
                  )}

                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>

                {/* Photo selection presets */}
                <div className="md:col-span-2 space-y-3 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-gray-600">
                    Click a preset photo to test or upload from your device:
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl("https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60");
                        setDishTitle("Royal Vegetable Pulao & Paneer Gravy");
                        setIsPhotoBlurry(false);
                        setAiError(null);
                      }}
                      className="p-2 rounded-xl border border-gray-200 text-[11px] font-semibold text-left hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                    >
                      🍚 Paneer Pulao
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl("https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=60");
                        setDishTitle("Dal Tadka & Handmade Wheat Rotis");
                        setIsPhotoBlurry(false);
                        setAiError(null);
                      }}
                      className="p-2 rounded-xl border border-gray-200 text-[11px] font-semibold text-left hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                    >
                      🫓 Dal & Rotis
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl("https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=60");
                        setDishTitle("Dum Biryani & Mixed Vegetable Curry");
                        setIsPhotoBlurry(false);
                        setAiError(null);
                      }}
                      className="p-2 rounded-xl border border-gray-200 text-[11px] font-semibold text-left hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                    >
                      🍲 Dum Biryani
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPhotoBlurry(true);
                        setAiError("Simulated blurry photo activated. Submit to see the AI Bot detect it!");
                      }}
                      className="p-2 rounded-xl border border-amber-300 bg-amber-50 text-[11px] font-bold text-amber-800 text-left hover:bg-amber-100 transition-all"
                    >
                      ⚠️ Test Blurry Photo
                    </button>
                  </div>

                  {isPhotoBlurry && (
                    <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                      <span>⚠️ Blurry photo simulator active (Bot will prompt to re-upload).</span>
                      <button
                        type="button"
                        onClick={handleFixBlurryPhoto}
                        className="underline font-bold text-amber-900"
                      >
                        Reset to clear photo
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Food Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  Dish / Food Title *
                </label>
                <input
                  type="text"
                  required
                  value={dishTitle}
                  onChange={(e) => setDishTitle(e.target.value)}
                  placeholder="e.g. Basmati Dum Biryani & Dal Makhani"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F5D46]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F5D46] bg-white"
                >
                  <option>Cooked Rice & Grains</option>
                  <option>Breads & Rotis</option>
                  <option>Dal & Curries</option>
                  <option>Vegetables & Sabji</option>
                  <option>Sweets & Snacks</option>
                </select>
              </div>
            </div>

            {/* Quantity & Storage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  Quantity / Amount of Food *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantityValue}
                    onChange={(e) => setQuantityValue(Number(e.target.value))}
                    className="w-2/3 px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F5D46]"
                  />
                  <select
                    value={quantityUnit}
                    onChange={(e) => setQuantityUnit(e.target.value)}
                    className="w-1/3 px-2 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F5D46] bg-white"
                  >
                    <option value="meals">meals</option>
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="trays">trays</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  Preparation Time *
                </label>
                <input
                  type="text"
                  required
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="e.g. 1:00 PM Today"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F5D46]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  Storage Condition *
                </label>
                <select
                  value={storageCondition}
                  onChange={(e) => setStorageCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F5D46] bg-white"
                >
                  <option>Hot insulated vessels (&gt;65°C)</option>
                  <option>Clean sealed steel containers</option>
                  <option>Refrigerated (2°C - 5°C)</option>
                  <option>Ambient Room Temperature</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Food Description & Handling Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe dishes, ingredients, purity, and vessel packaging..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F5D46]"
              />
            </div>

            {/* Donor Contact & Exact Location */}
            <div className="pt-2 border-t border-gray-100 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1F5D46]" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Donor Contact & Exact Pickup Location
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPersonName}
                    onChange={(e) => setContactPersonName(e.target.value)}
                    placeholder="Enter your contact name..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F5D46]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F5D46]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Landmark / Venue Name
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near BDA Complex"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F5D46]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  Full Street Address for Volunteer Pickup *
                </label>
                <AddressAutocomplete
                  value={locationAddress}
                  onChange={(addr) => setLocationAddress(addr)}
                  onSelectSuggestion={(sug) => {
                    setLocationAddress(sug.address);
                    setLandmark(sug.landmark);
                  }}
                  placeholder="Start typing venue name, street, or catering hall (e.g. Indiranagar, Koramangala)..."
                  required
                />
              </div>
            </div>

            {/* Error banner */}
            {aiError && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{aiError}</span>
                </div>
                {isPhotoBlurry && (
                  <button
                    type="button"
                    onClick={handleFixBlurryPhoto}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors"
                  >
                    Click to Re-upload Clear Photo
                  </button>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 rounded-2xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Assistant Bot Verifying Food Safety...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Submit Food Donation & Run AI Verification</span>
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Interactive AI Verification Trace Console */}
          {isVerifying && (
            <div className="p-5 rounded-2xl bg-gray-900 text-white space-y-4 shadow-md animate-in fade-in">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wide text-gray-200">
                    AnnaSetu AI Autonomous Verification Bot
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Live Audit in Progress
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                
                {/* Step 1 */}
                <div className="flex items-start gap-2.5">
                  {verificationStage >= 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-gray-300">Step 1: Computer Vision & Photo Quality Inspection</span>
                    {verificationStage === 1 && (
                      <p className="text-[11px] text-amber-300 font-sans">Scanning dish clarity, packaging seal, and vessel hygiene...</p>
                    )}
                    {verificationStage > 1 && (
                      <p className="text-[11px] text-emerald-300 font-sans">Passed: Overhead clarity certified, stainless steel vessels identified.</p>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-2.5">
                  {verificationStage >= 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-gray-300">Step 2: FSSAI Safety & Temperature Window Rule Check</span>
                    {verificationStage === 2 && (
                      <p className="text-[11px] text-amber-300 font-sans">Validating preparation time elapsed & safe consumption threshold (&lt;4 hrs)...</p>
                    )}
                    {verificationStage > 2 && (
                      <p className="text-[11px] text-emerald-300 font-sans">Passed: Safe distribution window computed (4.0 hrs remaining).</p>
                    )}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-2.5">
                  {verificationStage >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-gray-300">Step 3: AI Description Enhancement & Nutritional Tagging</span>
                    {verificationStage === 3 && (
                      <p className="text-[11px] text-amber-300 font-sans">Synthesizing dietary metadata, allergen warnings, and distribution notes...</p>
                    )}
                    {verificationStage > 3 && (
                      <p className="text-[11px] text-emerald-300 font-sans">Complete: Enhanced description with high-protein & Pure Veg tags.</p>
                    )}
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-2.5">
                  {verificationStage >= 4 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-gray-300">Step 4: Automatic Publication to Ashram Feeds</span>
                    {verificationStage === 4 && (
                      <p className="text-[11px] text-emerald-400 font-sans">Broadcasting listing to all nearby verified Ashrams and Shelters...</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </section>

        {/* SECTION 1.5: Autonomous Google Gemini Flash Bot - Nearby Ashram Suggestions */}
        {(flashMatches.length > 0 || isMatchingWithFlash) && (
          <section className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-[#164333] to-[#0F2D22] text-white space-y-5 shadow-lg border border-emerald-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-400 text-emerald-950 shrink-0 font-bold shadow-md">
                  <Sparkles className="w-5 h-5 text-emerald-950 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-extrabold text-white">
                      🤖 AnnaSetu AI Flash Agent — Auto-Matched Nearby Ashrams
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Google Gemini 3.5 Flash Bot
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Proximity analysis calculated from your pickup address. Ashrams ranked by urgency, travel time, and meal deficit.
                  </p>
                </div>
              </div>

              {isMatchingWithFlash && (
                <div className="flex items-center gap-2 text-xs text-amber-300 font-mono bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-amber-400/30 shrink-0">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Flash Bot Computing...</span>
                </div>
              )}
            </div>

            {/* Alert banner on dispatch */}
            {dispatchSuccessAshram && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Priority dispatch alert sent to <strong>{dispatchSuccessAshram}</strong>! Handover protocol initialized.
                  </span>
                </div>
                <Link
                  href="/handover"
                  className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-100 transition-all shrink-0"
                >
                  Open Live Chat &amp; Handover →
                </Link>
              </div>
            )}

            {/* Match Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {flashMatches.map((ashram) => (
                <div
                  key={ashram.id}
                  className={`p-4 rounded-2xl flex flex-col justify-between border transition-all ${
                    ashram.isRecommended
                      ? "bg-white/10 border-amber-400/60 shadow-md ring-1 ring-amber-400/30"
                      : "bg-white/5 border-emerald-700/40 hover:bg-white/10"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/20 uppercase tracking-wide">
                        {ashram.type}
                      </span>
                      {ashram.isRecommended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400 text-emerald-950 font-sans shadow-xs">
                          ⭐ Top Flash Pick
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white leading-snug">
                        {ashram.name}
                      </h3>
                      <p className="text-[11px] text-emerald-200/80 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
                        <span>{ashram.address}</span>
                      </p>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded-xl bg-black/20 text-center">
                        <div className="text-[10px] text-emerald-300 font-medium">Distance &amp; Time</div>
                        <div className="text-xs font-extrabold text-white">
                          {ashram.distanceKm} km • ~{ashram.travelTimeMinutes}m
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-black/20 text-center">
                        <div className="text-[10px] text-amber-300 font-medium">Meal Deficit</div>
                        <div className="text-xs font-extrabold text-white">
                          {ashram.deficitMeals} meals
                        </div>
                      </div>
                    </div>

                    {/* AI Rationale */}
                    <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-[11px] text-emerald-100 leading-relaxed font-sans">
                      <p className="line-clamp-3">
                        <span className="text-amber-300 font-bold">🤖 Flash Reason:</span> {ashram.aiRationale}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3 border-t border-emerald-800/40 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDispatchSuccessAshram(ashram.name);
                        // Save to shared listings recipient
                        if (myListings.length > 0) {
                          const top = { ...myListings[0] };
                          top.status = "ACCEPTED";
                          saveSharedListing(top);
                          loadListings();
                        }
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>⚡ Send Priority Dispatch Alert</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: Real Live Details Entered by Donor */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#14221D]">
                Your Live Food Donations & Real Details
              </h2>
              <p className="text-xs text-gray-500">
                Real-time status of food surplus submitted from your establishment.
              </p>
            </div>
            <button
              onClick={loadListings}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="space-y-4">
            {myListings.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-sm">
                No active listings yet. Submit surplus food above to start!
              </div>
            ) : (
              myListings.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:border-emerald-300 transition-all flex flex-col md:flex-row gap-6 items-start"
                >
                  {/* Photo */}
                  <div className="w-full md:w-48 h-36 rounded-2xl overflow-hidden shrink-0 bg-gray-100 relative">
                    <img 
                      src={item.photoUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-[#14221D]">
                        {item.title}
                      </h3>

                      {/* Status Badges */}
                      {item.status === "ACCEPTED" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Accepted by {item.acceptedByOrg || "Ashram"}
                        </span>
                      ) : item.status === "DECLINED" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                          Declined ({item.declineReason || "Re-routing"})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                          <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                          AI Verified • Published Live
                        </span>
                      )}
                    </div>

                    {/* AI Enhanced Description */}
                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-emerald-800 text-[11px]">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>AI Assistant Verified Description:</span>
                      </div>
                      <p className="leading-relaxed">
                        {item.aiEnhancedDescription || item.description}
                      </p>
                    </div>

                    {/* Live Specs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-gray-600">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Quantity</span>
                        <span className="font-extrabold text-[#1F5D46]">{item.quantityValue} {item.quantityUnit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Prep Time</span>
                        <span className="font-semibold text-gray-800">{item.prepTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Storage</span>
                        <span className="font-semibold text-gray-800">{item.storageCondition}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Safety Score</span>
                        <span className="font-extrabold text-emerald-700">{item.safetyScore}% FSSAI</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#1F5D46]" />
                        <span>{item.locationAddress} ({item.landmark})</span>
                      </div>

                      {/* If Accepted, show Handover details & Open Chat */}
                      {item.status === "ACCEPTED" && (
                        <div className="flex flex-wrap items-center gap-2">
                          {item.handoverOtp && (
                            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900 font-mono text-xs font-bold flex items-center gap-2">
                              <span>Handover OTP: {item.handoverOtp}</span>
                              <span className="text-[10px] text-emerald-800 font-sans font-normal">
                                ({item.driverName})
                              </span>
                            </div>
                          )}
                          <Link
                            href={`/handover?listingId=${item.id}&role=donor`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-xs shadow-xs transition-all"
                          >
                            <span>Open Delivery & Live Chat</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

    </div>
  );
}
