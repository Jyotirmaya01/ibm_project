"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Users, 
  Utensils, 
  Package, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle,
  Sparkles,
  Building2 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiUrl } from "@/lib/api-config";

export default function RecipientCapacityPage() {
  const { user } = useAuth();
  
  const [peopleServed, setPeopleServed] = useState<number>(45);
  const [mealsNeeded, setMealsNeeded] = useState<number>(45);
  const [existingMeals, setExistingMeals] = useState<number>(5);
  const [storageType, setStorageType] = useState<string>("refrigerated");
  const [maxStorageKg, setMaxStorageKg] = useState<number>(40);
  const [isPureVeg, setIsPureVeg] = useState<boolean>(true);
  const [canCollectDirectly, setCanCollectDirectly] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const netDeficit = Math.max(0, mealsNeeded - existingMeals);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        recipient_id: "a0000000-0000-0000-0000-000000000001", // Shanti Ashram
        people_served: peopleServed,
        meals_needed: mealsNeeded,
        existing_meals_available: existingMeals,
        storage_capability: storageType,
        max_storage_kg: maxStorageKg,
        dietary_preferences: isPureVeg ? ["pure_veg"] : ["standard"],
        can_collect_directly: canCollectDirectly,
        notes: "Daily capacity snapshot updated via AnnaSetu Web Portal",
      };

      const res = await fetch(apiUrl("/v1/recipients/capacity"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token || "mock-token-recipient"}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update capacity snapshot.");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error updating capacity snapshot.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-ink-primary font-body py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation */}
        <Link
          href="/operations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-secondary hover:text-brand-forest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Operations
        </Link>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sage text-brand-forest text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-marigold" />
            Phase 5 · Recipient Demand & Capacity
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink-primary">
            Update Shelter Demand & Safe Capacity
          </h1>
          <p className="text-sm text-ink-secondary">
            AnnaSetu distributes food according to actual meal deficits and storage capacity to prevent waste and unsafe holding.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Error Saving Capacity</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="font-bold">Capacity snapshot successfully saved and timestamped! Fresh for 24 hours.</div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Meal Demand */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <h2 className="text-base font-bold font-display text-ink-primary flex items-center gap-2">
              <Utensils className="w-5 h-5 text-brand-forest" />
              1. Current Meal Demand & Deficit
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">People Served</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-ink-secondary absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    value={peopleServed}
                    onChange={(e) => setPeopleServed(parseInt(e.target.value) || 0)}
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-line-default focus:border-brand-forest focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Meals Needed Today</label>
                <input
                  type="number"
                  min="0"
                  value={mealsNeeded}
                  onChange={(e) => setMealsNeeded(parseInt(e.target.value) || 0)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line-default focus:border-brand-forest focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Pantry Stock / In Hand</label>
                <input
                  type="number"
                  min="0"
                  value={existingMeals}
                  onChange={(e) => setExistingMeals(parseInt(e.target.value) || 0)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line-default focus:border-brand-forest focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Calculated Net Deficit Callout */}
            <div className="p-3.5 rounded-xl bg-brand-cream border border-line-default flex items-center justify-between text-xs">
              <span className="text-ink-secondary">Net Meal Deficit (Max allocation limit):</span>
              <span className="font-bold text-sm text-brand-forest">
                {netDeficit} Meals Requested
              </span>
            </div>
          </div>

          {/* Section 2: Safe Storage & Logistics Capacity */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <h2 className="text-base font-bold font-display text-ink-primary flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-forest" />
              2. Safe Storage & Preservation Limits
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Available Storage Facilities</label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line-default focus:border-brand-forest focus:outline-none"
                >
                  <option value="refrigerated">Refrigerated Chilling (&lt;5°C)</option>
                  <option value="freezer">Commercial Freezer (&lt;-18°C)</option>
                  <option value="dry_only">Dry / Ambient Storage Only</option>
                  <option value="none">Immediate Consumption Only (No Storage)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Max Safe Storage Capacity (kg)</label>
                <input
                  type="number"
                  min="1"
                  value={maxStorageKg}
                  onChange={(e) => setMaxStorageKg(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-line-default focus:border-brand-forest focus:outline-none"
                  required
                />
                <span className="text-[11px] text-ink-secondary mt-1 block">Optimizer will never exceed this ceiling.</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPureVeg}
                  onChange={(e) => setIsPureVeg(e.target.checked)}
                  className="rounded text-brand-forest focus:ring-brand-forest"
                />
                <span className="text-xs font-semibold text-ink-primary">Shelter observes strict Pure Vegetarian dietary requirement</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canCollectDirectly}
                  onChange={(e) => setCanCollectDirectly(e.target.checked)}
                  className="rounded text-brand-forest focus:ring-brand-forest"
                />
                <span className="text-xs font-semibold text-ink-primary">Organization has staff or transport to collect directly from donor</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <Link href="/operations" className="text-sm font-semibold text-ink-secondary hover:underline">
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-brand-forest hover:bg-brand-deep text-brand-paper font-bold text-sm transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Saving Snapshot..." : "Save Timestamped Capacity Snapshot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
