"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  Plus, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  AlertTriangle 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiUrl } from "@/lib/api-config";

export default function CreateListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [title, setTitle] = useState("Wedding Surplus Rice & Dal");
  const [description, setDescription] = useState("Freshly prepared wedding buffet food held in clean thermal insulated chafing dishes.");
  const [area, setArea] = useState("Indiranagar, Bengaluru");
  const [pickupHours, setPickupHours] = useState("3");
  
  // Dish items
  const [dishes, setDishes] = useState([
    { name: "Steamed Basmati Rice", food_type: "cooked_rice", quantity_value: 30, quantity_unit: "kg", storage_condition: "hot_held" },
    { name: "Yellow Dal Tadka", food_type: "cooked_curry", quantity_value: 15, quantity_unit: "liters", storage_condition: "hot_held" }
  ]);
  
  // Compulsory photo simulation
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Rule: Compulsory Photo Check
    if (!photoUploaded) {
      setError("FSSAI Evidence Rule: At least one dish photo is strictly compulsory before publishing a listing.");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + parseInt(pickupHours) * 3600 * 1000);
      
      const payload = {
        title,
        description,
        approx_area_name: area,
        latitude: 12.9716,
        longitude: 77.5946,
        pickup_window_start: now.toISOString(),
        pickup_window_end: endTime.toISOString(),
        items: dishes.map(d => ({
          ...d,
          preparation_time: now.toISOString(),
          is_perishable: true,
        }))
      };

      // 1. Create draft
      const createRes = await fetch(apiUrl("/v1/listings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token || "mock-token-donor"}`
        },
        body: JSON.stringify(payload)
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.detail || "Failed to create draft listing.");
      }

      const listingData = await createRes.json();

      // 2. Attach compulsory photo
      const photoRes = await fetch(apiUrl(`/v1/listings/${listingData.id}/photos`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token || "mock-token-donor"}`
        },
        body: JSON.stringify({
          storage_path: `private/listings/${listingData.id}/overhead_dish.jpg`,
          photo_type: "overhead_dish"
        })
      });

      if (!photoRes.ok) throw new Error("Failed to attach photo evidence.");

      // 3. Publish
      const publishRes = await fetch(apiUrl(`/v1/listings/${listingData.id}/publish`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token || "mock-token-donor"}`
        }
      });

      if (!publishRes.ok) {
        const errData = await publishRes.json();
        throw new Error(errData.detail || "Failed to publish listing.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/listings");
      }, 1500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error publishing listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-ink-primary font-body py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back Link */}
        <Link
          href="/operations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-secondary hover:text-brand-forest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sage text-brand-forest text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-marigold" />
            Phase 3 · Donor Surplus Flow
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink-primary">
            Create Food Rescue Listing
          </h1>
          <p className="text-sm text-ink-secondary">
            Post surplus meals with compulsory evidence. AnnaSetu ensures safe distribution to nearby shelters.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Validation Warning</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="font-bold">Listing successfully submitted for safety review! Redirecting to feed...</div>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-6">
          {/* Section 1: Listing Overview */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <h2 className="text-base font-bold font-display text-ink-primary">1. Event & Location Information</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Listing Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-line-default focus:border-brand-forest focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-primary mb-1">Approximate Area / Locality</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-ink-secondary absolute left-3 top-3" />
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-line-default focus:border-brand-forest focus:outline-none"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-ink-secondary mt-1 block">Exact GPS is kept private until pickup is confirmed.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-primary mb-1">Pickup Available For (Hours)</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-ink-secondary absolute left-3 top-3" />
                    <select
                      value={pickupHours}
                      onChange={(e) => setPickupHours(e.target.value)}
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-line-default focus:border-brand-forest focus:outline-none"
                    >
                      <option value="2">Next 2 hours</option>
                      <option value="3">Next 3 hours</option>
                      <option value="4">Next 4 hours</option>
                      <option value="6">Next 6 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Preparation & Handling Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-line-default focus:border-brand-forest focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Food Dishes */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <h2 className="text-base font-bold font-display text-ink-primary">2. Food Dishes & Measured Quantities</h2>
            
            <div className="space-y-3">
              {dishes.map((dish, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-brand-cream border border-line-default text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-ink-primary">{dish.name}</div>
                    <div className="text-ink-secondary capitalize">Category: {dish.food_type.replace("_", " ")} · Holding: {dish.storage_condition.replace("_", " ")}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-brand-forest">{dish.quantity_value} {dish.quantity_unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Compulsory Photo Evidence (PRD Core Requirement) */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-display text-ink-primary">3. Compulsory Photo Evidence</h2>
              <span className="text-[11px] font-bold text-brand-forest bg-brand-sage px-2 py-0.5 rounded-full">
                Strict FSSAI Requirement
              </span>
            </div>

            <p className="text-xs text-ink-secondary">
              Photos are mandatory before a listing can be published. Upload a clear overhead image of the prepared dishes in their containers.
            </p>

            <div 
              onClick={() => setPhotoUploaded(!photoUploaded)}
              className={`p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center ${
                photoUploaded 
                  ? "border-emerald-500 bg-emerald-50/50" 
                  : "border-line-default hover:border-brand-forest bg-brand-cream/50"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-brand-sage text-brand-forest mx-auto flex items-center justify-center mb-3">
                <Camera className="w-6 h-6" />
              </div>
              
              {photoUploaded ? (
                <div>
                  <div className="font-bold text-sm text-emerald-800 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Overhead Dish Photo Verified (dish_buffet_01.jpg)
                  </div>
                  <p className="text-xs text-ink-secondary mt-1">Click to re-upload or toggle photo</p>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-sm text-ink-primary">Click to simulate camera capture / photo upload</div>
                  <p className="text-xs text-ink-secondary mt-1">Accepts JPEG, PNG, or WebP up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <Link href="/operations" className="text-sm font-semibold text-ink-secondary hover:underline">
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-3 rounded-xl font-bold text-brand-paper transition-all shadow-sm ${
                photoUploaded 
                  ? "bg-brand-forest hover:bg-brand-deep cursor-pointer" 
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {submitting ? "Publishing..." : "Submit & Publish Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
