"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Layers, 
  Building2, 
  ShieldCheck,
  RefreshCw 
} from "lucide-react";

interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  engine: string;
  timestamp?: string;
}

export default function OperationsDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/health");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reach backend API");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-brand-cream text-ink-primary font-body">
      {/* Header */}
      <header className="border-b border-line-default bg-brand-paper">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-brand-sage/40 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-brand-forest">AnnaSetu AI</span>
              <span className="text-line-default">/</span>
              <span className="font-semibold text-sm text-ink-secondary">Operations Console</span>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line-default bg-brand-paper hover:bg-brand-sage/30 text-xs font-semibold text-ink-primary transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Status
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* System Health Card */}
        <section className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-forest" />
              Core Agentic & Allocation Service Health
            </h2>
            {loading ? (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-sage text-brand-forest">Checking...</span>
            ) : health ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Operational
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Offline / Unreachable
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default">
              <div className="text-xs text-ink-secondary">Engine</div>
              <div className="font-bold text-sm text-ink-primary mt-1">{health?.engine || "AnnaSetu AI Core"}</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default">
              <div className="text-xs text-ink-secondary">API Version</div>
              <div className="font-bold text-sm text-ink-primary mt-1">{health?.version || "0.1.0"}</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default">
              <div className="text-xs text-ink-secondary">Environment</div>
              <div className="font-bold text-sm text-ink-primary mt-1 capitalize">{health?.environment || "Development"}</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default">
              <div className="text-xs text-ink-secondary">PostgreSQL & Auth</div>
              <div className="font-bold text-sm text-brand-forest mt-1">Supabase Active</div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Note: Start the FastAPI service at <code>http://localhost:8000</code> to view live responses.
            </div>
          )}
        </section>

        {/* Operational Queues Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Queue 1: Food Listings & Safety Reviews */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-forest" />
                <h3 className="font-display font-bold text-base">Safety Evidence Queue</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-sage text-brand-forest">0 Holds</span>
            </div>
            <p className="text-xs text-ink-secondary">
              Listings requiring photo completeness check, FSSAI temperature verification, or human reviewer clearance.
            </p>
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default text-xs text-ink-secondary text-center">
              No pending safety reviews in current cycle.
            </div>
          </div>

          {/* Queue 2: Active Allocation Plans */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-forest" />
                <h3 className="font-display font-bold text-base">OR-Tools Allocation Plans</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-sage text-brand-forest">0 Active</span>
            </div>
            <p className="text-xs text-ink-secondary">
              Real-time multi-recipient quantity splits, reservations, and recovery re-allocations.
            </p>
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default text-xs text-ink-secondary text-center">
              No active allocation optimizations running.
            </div>
          </div>

          {/* Queue 3: Recipient Organizations */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-forest" />
                <h3 className="font-display font-bold text-base">Recipient Network</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-sage text-brand-forest">3 Synthetic Orgs</span>
            </div>
            <p className="text-xs text-ink-secondary">
              Ashrams, shelters, and community kitchens with active demand and storage capability snapshots.
            </p>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-brand-cream border border-line-default text-xs flex justify-between items-center">
                <span className="font-semibold text-ink-primary">Shanti Ashram Kitchen</span>
                <span className="text-[10px] bg-brand-sage text-brand-forest px-1.5 py-0.5 rounded font-medium">Refrigerated</span>
              </div>
              <div className="p-2.5 rounded-lg bg-brand-cream border border-line-default text-xs flex justify-between items-center">
                <span className="font-semibold text-ink-primary">Hope Child Shelter</span>
                <span className="text-[10px] bg-brand-sage text-brand-forest px-1.5 py-0.5 rounded font-medium">Dry Only</span>
              </div>
              <div className="p-2.5 rounded-lg bg-brand-cream border border-line-default text-xs flex justify-between items-center">
                <span className="font-semibold text-ink-primary">City Night Shelter</span>
                <span className="text-[10px] bg-brand-sage text-brand-forest px-1.5 py-0.5 rounded font-medium">Direct Capacity</span>
              </div>
            </div>
          </div>
        </section>

        {/* Ground-Truth Metrics Notice */}
        <section className="p-4 rounded-xl bg-brand-sage/60 border border-brand-leaf/20 flex items-start gap-3 text-xs text-brand-deep">
          <Clock className="w-4 h-4 text-brand-forest shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Ground-Truth Accounting Policy:</span> In accordance with AnnaSetu PRD Section 4 & Rules Section 2, food listed or proposed is never counted as food rescued. Only verified handovers with recipient acceptance timestamps contribute to confirmed impact metrics.
          </div>
        </section>
      </main>
    </div>
  );
}
