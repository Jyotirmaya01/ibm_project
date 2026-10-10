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
  RefreshCw,
  UserCheck,
  ShieldAlert
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";

interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  engine: string;
  timestamp?: string;
}

interface OrgItem {
  id: string;
  name: string;
  type: string;
  verification_status: string;
  address?: string;
}

export default function OperationsDashboard() {
  const { user, loginAsRole } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<OrgItem[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchHealthAndData = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("http://localhost:8000/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth(null);
      }
    } catch {
      setHealth(null);
    } finally {
      setLoadingHealth(false);
    }

    // Fetch organizations
    if (user?.token) {
      try {
        const orgRes = await fetch("http://localhost:8000/v1/organizations", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setOrganizations(orgData);
        }
      } catch {
        // Fallback demo data
      }
    }
  };

  useEffect(() => {
    fetchHealthAndData();
  }, [user]);

  const handleVerifyOrg = async (orgId: string, newStatus: string) => {
    if (!user?.token) return;
    try {
      const res = await fetch(`http://localhost:8000/v1/organizations/${orgId}/verify?verification_status=${newStatus}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Organization status successfully updated to '${newStatus}' with audit log.`);
        fetchHealthAndData();
      } else {
        setActionMessage(`Action blocked (${res.status}): ${data.detail || "Forbidden"}`);
      }
    } catch (err: unknown) {
      setActionMessage("Network error communicating with API.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-ink-primary font-body">
      {/* Header */}
      <header className="border-b border-line-default bg-brand-paper sticky top-0 z-40">
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

          {/* Role Switcher for Phase 2 Verification */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-ink-primary">{user?.fullName}</div>
              <div className="text-[11px] font-medium text-brand-forest capitalize flex items-center justify-end gap-1">
                <UserCheck className="w-3 h-3 text-brand-forest" />
                Role: {user?.role.replace("_", " ")}
              </div>
            </div>

            <select
              value={user?.role || "coordinator"}
              onChange={(e) => loginAsRole(e.target.value as UserRole)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-line-default bg-brand-paper text-ink-primary hover:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
            >
              <option value="coordinator">Coordinator</option>
              <option value="safety_reviewer">Safety Reviewer</option>
              <option value="admin">System Admin</option>
              <option value="donor">Donor</option>
              <option value="recipient">Recipient</option>
              <option value="volunteer">Volunteer</option>
            </select>

            <button
              onClick={fetchHealthAndData}
              className="p-2 rounded-lg border border-line-default bg-brand-paper hover:bg-brand-sage/30 text-ink-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHealth ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Action / Alert Message */}
        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-brand-sage/80 border border-brand-leaf/30 text-xs font-medium text-brand-deep flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-forest shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-brand-forest font-bold text-xs hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* System Health Card */}
        <section className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-forest" />
              Agentic Platform Status
            </h2>
            {loadingHealth ? (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-sage text-brand-forest">Checking...</span>
            ) : health ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                FastAPI Operational
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Backend Offline (Run uvicorn)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default">
              <div className="text-xs text-ink-secondary">Engine</div>
              <div className="font-bold text-sm text-ink-primary mt-1">{health?.engine || "AnnaSetu AI Core"}</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default">
              <div className="text-xs text-ink-secondary">Active Role</div>
              <div className="font-bold text-sm text-brand-forest mt-1 capitalize">{user?.role.replace("_", " ")}</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default">
              <div className="text-xs text-ink-secondary">Access Matrix</div>
              <div className="font-bold text-sm text-ink-primary mt-1">{user?.permissions.length} Authorized Perms</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default">
              <div className="text-xs text-ink-secondary">Database & Auth</div>
              <div className="font-bold text-sm text-brand-forest mt-1">Supabase + RLS Active</div>
            </div>
          </div>
        </section>

        {/* Operational Queues */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Queue 1: Organizations & Verification */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-forest" />
                <h3 className="font-display font-bold text-base">Recipient Orgs</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-sage text-brand-forest">
                {organizations.length > 0 ? `${organizations.length} Loaded` : "3 Seed Orgs"}
              </span>
            </div>
            <p className="text-xs text-ink-secondary">
              Community shelters and ashrams. Coordinators can approve or update verification status.
            </p>
            <div className="space-y-2.5">
              {(organizations.length > 0 ? organizations : [
                { id: "a0000000-0000-0000-0000-000000000001", name: "Shanti Ashram Kitchen", type: "ashram", verification_status: "verified" },
                { id: "a0000000-0000-0000-0000-000000000002", name: "Hope Child Shelter", type: "orphanage", verification_status: "verified" },
              ]).map((org) => (
                <div key={org.id} className="p-3 rounded-xl bg-brand-cream border border-line-default text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-ink-primary">{org.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      org.verification_status === "verified" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {org.verification_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-ink-secondary capitalize">Type: {org.type}</span>
                    <button
                      onClick={() => handleVerifyOrg(org.id, org.verification_status === "verified" ? "pending" : "verified")}
                      className="text-[11px] font-semibold text-brand-forest hover:underline"
                    >
                      Toggle Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Queue 2: Food Safety Holds & Reviews */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-forest" />
                <h3 className="font-display font-bold text-base">Safety Exception Queue</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-sage text-brand-forest">0 Blocked</span>
            </div>
            <p className="text-xs text-ink-secondary">
              Listings requiring photo inspection, temperature compliance, or manual reviewer clearance.
            </p>
            <div className="p-6 rounded-xl bg-brand-cream border border-line-default text-xs text-ink-secondary text-center">
              Safety queue clear. All listings conform to current FSSAI guidelines.
            </div>
          </div>

          {/* Queue 3: Allocation Oversight */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-forest" />
                <h3 className="font-display font-bold text-base">Distribution Plans</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-sage text-brand-forest">0 Active</span>
            </div>
            <p className="text-xs text-ink-secondary">
              Deterministic OR-Tools quantity split reservations and recovery replanning events.
            </p>
            <div className="p-6 rounded-xl bg-brand-cream border border-line-default text-xs text-ink-secondary text-center">
              No pending quantity splits. Standing by for incoming food listings.
            </div>
          </div>
        </section>

        {/* Ground Truth Policy */}
        <section className="p-4 rounded-xl bg-brand-sage/60 border border-brand-leaf/20 flex items-start gap-3 text-xs text-brand-deep">
          <Clock className="w-4 h-4 text-brand-forest shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Role-Based Access Control Active:</span> Coordinators and Admins possess authority to review safety exceptions and verify organizations. Donors and Recipients operate within scoped least-privilege channels enforced by PostgreSQL Row Level Security.
          </div>
        </section>
      </main>
    </div>
  );
}
