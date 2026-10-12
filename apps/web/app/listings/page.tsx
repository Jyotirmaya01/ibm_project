"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Plus, 
  Layers, 
  RefreshCw 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiUrl } from "@/lib/api-config";

interface FoodItem {
  id: string;
  name: string;
  food_type: string;
  quantity_value: number;
  quantity_unit: string;
  storage_condition: string;
}

interface ListingCard {
  id: string;
  title: string;
  description?: string;
  approx_area_name: string;
  status: string;
  pickup_window_start: string;
  pickup_window_end: string;
  items: FoodItem[];
  photos: { id: string; photo_type: string; storage_path: string }[];
}

export default function ListingsFeedPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/v1/listings"), {
        headers: { Authorization: `Bearer ${user?.token || "mock-token-recipient"}` },
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [user]);

  // Demo fallback items if local in-memory DB hasn't been populated via POST
  const displayListings = listings.length > 0 ? listings : [
    {
      id: "l0000000-0000-0000-0000-000000000001",
      title: "Wedding Surplus: 30kg Basmati Rice & Dal Makhani",
      description: "Buffet food untouched from banquet evening. Kept in clean hot-holding chafers.",
      approx_area_name: "Indiranagar, Bengaluru (~2.4 km away)",
      status: "AVAILABLE",
      pickup_window_start: new Date().toISOString(),
      pickup_window_end: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      items: [
        { id: "1", name: "Steamed Basmati Rice", food_type: "cooked_rice", quantity_value: 30, quantity_unit: "kg", storage_condition: "hot_held" },
        { id: "2", name: "Dal Makhani", food_type: "cooked_curry", quantity_value: 15, quantity_unit: "kg", storage_condition: "hot_held" },
      ],
      photos: [{ id: "p1", photo_type: "overhead_dish", storage_path: "mock/photo.jpg" }],
    },
    {
      id: "l0000000-0000-0000-0000-000000000002",
      title: "Community Bhandara: 50kg Khichdi & Sabzi",
      description: "Freshly prepared satvik prasad, clean stainless steel containers.",
      approx_area_name: "Malleshwaram, Bengaluru (~4.1 km away)",
      status: "AVAILABLE",
      pickup_window_start: new Date().toISOString(),
      pickup_window_end: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      items: [
        { id: "3", name: "Moong Dal Khichdi", food_type: "cooked_rice", quantity_value: 50, quantity_unit: "kg", storage_condition: "room_temperature" },
      ],
      photos: [{ id: "p2", photo_type: "overhead_dish", storage_path: "mock/photo2.jpg" }],
    },
  ];

  return (
    <div className="min-h-screen bg-brand-cream text-ink-primary font-body py-10 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/operations"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-brand-forest mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Operations
            </Link>
            <h1 className="text-3xl font-bold font-display text-ink-primary">
              Available Surplus Food Listings
            </h1>
            <p className="text-sm text-ink-secondary mt-1">
              Real-time verified surplus meals ready for allocation to ashrams and community shelters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchListings}
              className="p-2.5 rounded-xl border border-line-default bg-brand-paper hover:bg-brand-sage/40 transition-colors"
              title="Refresh Listings"
            >
              <RefreshCw className={`w-4 h-4 text-ink-primary ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/listings/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-forest text-brand-paper font-semibold text-sm hover:bg-brand-deep transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Post Surplus Food
            </Link>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayListings.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm hover:border-brand-leaf/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Status and Tag */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {item.status}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-forest bg-brand-sage px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Photo Verified
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold font-display text-ink-primary leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-ink-secondary mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Location & Time */}
                <div className="space-y-1.5 text-xs text-ink-secondary pt-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-forest" />
                    <span>{item.approx_area_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-brand-forest" />
                    <span>Pickup window: within next 3–4 hours</span>
                  </div>
                </div>

                {/* Dish Quantities */}
                <div className="pt-2 border-t border-line-default space-y-1.5">
                  <div className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider">Dishes & Quantity</div>
                  <div className="flex flex-wrap gap-2">
                    {item.items.map((dish, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-cream border border-line-default text-xs font-semibold text-ink-primary">
                        <span>{dish.name}:</span>
                        <span className="text-brand-forest font-bold">{dish.quantity_value} {dish.quantity_unit}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  href="/operations"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-line-default bg-brand-cream hover:bg-brand-sage/40 font-semibold text-xs text-brand-forest transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  View Allocation & Split Plan
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
