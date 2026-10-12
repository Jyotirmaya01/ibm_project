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
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  Bot,
  Play,
  Zap
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { apiUrl } from "@/lib/api-config";

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

interface SafetyReviewItem {
  id: string;
  listing_id: string;
  status: string;
  rule_version: string;
  risk_indicators: string[];
  observations: { indicator: string; severity: string; details: string }[];
  limitations_disclaimer: string;
}

interface AllocationItem {
  id: string;
  recipient_id: string;
  recipient_name: string;
  requested_kg: number;
  allocated_kg: number;
  confirmed_kg?: number;
  status: string;
}

interface AllocationPlan {
  id: string;
  listing_id: string;
  total_available_kg: number;
  total_allocated_kg: number;
  total_unallocated_kg: number;
  optimizer_engine: string;
  status: string;
  allocations: AllocationItem[];
}

interface AgentMission {
  mission_id: string;
  listing_id: string;
  stage: string;
  food_name: string;
  total_quantity_kg: number;
  safety_cleared: boolean;
  allocated_kg: number;
  requires_human_review: boolean;
  human_checkpoint_reason?: string;
  human_review_resolved: boolean;
  audit_trail: { timestamp: string; step: string; message: string }[];
}

interface AuditItem {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
  details: Record<string, any>;
}

export default function OperationsDashboard() {
  const { user, loginAsRole } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<OrgItem[]>([]);
  const [safetyReviews, setSafetyReviews] = useState<SafetyReviewItem[]>([]);
  const [allocationPlans, setAllocationPlans] = useState<AllocationPlan[]>([]);
  const [agentMissions, setAgentMissions] = useState<AgentMission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchHealthAndData = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch(apiUrl("/health"));
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
        const orgRes = await fetch(apiUrl("/v1/organizations"), {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setOrganizations(orgData);
        }
      } catch {
        // Fallback
      }

      // Fetch safety review queue
      try {
        const safetyRes = await fetch(apiUrl("/v1/safety/review-queue"), {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (safetyRes.ok) {
          const safetyData = await safetyRes.json();
          setSafetyReviews(safetyData);
        }
      } catch {
        // Fallback
      }

      // Fetch agent missions
      try {
        const agentRes = await fetch(apiUrl("/v1/agent/missions"), {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (agentRes.ok) {
          const agentData = await agentRes.json();
          setAgentMissions(agentData);
        }
      } catch {
        // Fallback
      }

      // Fetch audit logs
      try {
        const auditRes = await fetch(apiUrl("/v1/audit/logs?limit=12"), {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAuditLogs(auditData);
        }
      } catch {
        // Fallback
      }
    }
  };

  useEffect(() => {
    fetchHealthAndData();
  }, [user]);

  const handleVerifyOrg = async (orgId: string, newStatus: string) => {
    if (!user?.token) return;
    try {
      const res = await fetch(apiUrl(`/v1/organizations/${orgId}/verify?verification_status=${newStatus}`), {
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
    } catch {
      setActionMessage("Network error communicating with API.");
    }
  };

  const handleClearSafetyHold = async (assessmentId: string) => {
    if (!user?.token) return;
    try {
      const res = await fetch(apiUrl(`/v1/safety/reviews/${assessmentId}/decide`), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({
          decision: "ELIGIBLE_UNDER_RULES",
          notes: `Cleared by ${user.fullName} following secondary thermal holding verification.`
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Safety hold cleared under FSSAI rules. Listing eligible for distribution.`);
        fetchHealthAndData();
      } else {
        setActionMessage(`Action blocked (${res.status}): ${data.detail || "Forbidden"}`);
      }
    } catch {
      setActionMessage("Network error clearing safety hold.");
    }
  };

  const handleRunOptimization = async (listingId?: string) => {
    if (!user?.token) return;
    try {
      const targetId = listingId || "00000000-0000-0000-0000-000000000001";
      const res = await fetch(apiUrl(`/v1/allocations/optimize/${targetId}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Optimization computed using ${data.optimizer_engine}: ${data.total_allocated_kg} kg allocated across ${data.allocations.length} recipient(s).`);
        setAllocationPlans((prev) => [data, ...prev.filter((p) => p.id !== data.id)]);
      } else {
        setActionMessage(`Optimization error (${res.status}): ${data.detail || "Unable to solve"}`);
      }
    } catch {
      setActionMessage("Network error running optimizer.");
    }
  };

  const handleAcceptAllocation = async (allocationId: string, qty: number) => {
    if (!user?.token) return;
    try {
      const res = await fetch(apiUrl(`/v1/allocations/${allocationId}/accept`), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ accepted_kg: qty }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Allocation confirmed for ${data.confirmed_kg} kg.`);
        setAllocationPlans((plans) =>
          plans.map((p) => ({
            ...p,
            allocations: p.allocations.map((a) => (a.id === allocationId ? { ...a, status: data.status, confirmed_kg: data.confirmed_kg } : a)),
          }))
        );
      } else {
        setActionMessage(`Accept error: ${data.detail}`);
      }
    } catch {
      setActionMessage("Network error confirming allocation.");
    }
  };

  const handleDeclineAllocation = async (allocationId: string) => {
    if (!user?.token) return;
    try {
      const res = await fetch(apiUrl(`/v1/allocations/${allocationId}/decline`), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ reason: "Capacity reached" }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Allocation declined. Atomic recovery replan initiated.`);
        setAllocationPlans((plans) =>
          plans.map((p) => ({
            ...p,
            allocations: p.allocations.map((a) => (a.id === allocationId ? { ...a, status: data.status } : a)),
          }))
        );
      } else {
        setActionMessage(`Decline error: ${data.detail}`);
      }
    } catch {
      setActionMessage("Network error declining allocation.");
    }
  };

  const handleLaunchAgentMission = async () => {
    if (!user?.token) return;
    try {
      const listingId = "00000000-0000-0000-0000-000000000001";
      const res = await fetch(apiUrl(`/v1/agent/missions/start/${listingId}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Agent Mission ${data.mission_id} launched! Stage: ${data.stage} (${data.allocated_kg}kg allocated).`);
        setAgentMissions((prev) => [data, ...prev.filter((m) => m.mission_id !== data.mission_id)]);
      } else {
        setActionMessage(`Agent error (${res.status}): ${data.detail || "Workflow execution failed"}`);
      }
    } catch {
      setActionMessage("Network error launching agent workflow.");
    }
  };

  const handleResumeAgentMission = async (missionId: string) => {
    if (!user?.token) return;
    try {
      const res = await fetch(apiUrl(`/v1/agent/missions/${missionId}/resume`), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ notes: `Approved by ${user.fullName} via Operations Console.` }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Agent Mission ${missionId} resumed! Current stage: ${data.stage}`);
        setAgentMissions((prev) => prev.map((m) => (m.mission_id === missionId ? data : m)));
      } else {
        setActionMessage(`Resume error: ${data.detail}`);
      }
    } catch {
      setActionMessage("Network error resuming mission.");
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
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold pl-4">
              <Link href="/handover" className="text-brand-forest hover:underline">
                Digital Handover
              </Link>
              <span className="text-line-default">•</span>
              <Link href="/recipients/capacity" className="text-brand-forest hover:underline">
                Demand Portal
              </Link>
              <span className="text-line-default">•</span>
              <Link href="/certificate" className="text-amber-700 font-bold hover:underline">
                ESG & Spoilage Hub
              </Link>
            </div>
          </div>

          {/* Role Switcher */}
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
              <div className="text-xs text-ink-secondary">Safety Standard</div>
              <div className="font-bold text-sm text-brand-forest mt-1">FSSAI Surplus 2019</div>
            </div>
            <div className="p-4 rounded-xl bg-brand-cream border border-line-default">
              <div className="text-xs text-ink-secondary">Database & Auth</div>
              <div className="font-bold text-sm text-brand-forest mt-1">Supabase + RLS Active</div>
            </div>
          </div>
        </section>

        {/* Phase 7: LangGraph Agent Missions Orchestration Section */}
        <section className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-brand-forest" />
                <h2 className="text-lg font-bold font-display">LangGraph Autonomous Missions</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-sage text-brand-forest">
                  StateGraph Engine
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-1">
                Autonomous multi-agent lifecycle: Intake validation → FSSAI safety gate → Demand discovery → Deterministic optimization → Multi-recipient outreach → Coordination.
              </p>
            </div>
            <button
              onClick={() => handleLaunchAgentMission()}
              className="py-2.5 px-4 rounded-lg bg-brand-forest text-brand-paper font-semibold text-xs hover:bg-brand-deep transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Launch Autonomous Mission</span>
            </button>
          </div>

          {agentMissions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
              {agentMissions.map((m) => (
                <div key={m.mission_id} className="p-4 rounded-xl bg-brand-cream border border-line-default space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-ink-primary font-mono">{m.mission_id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        m.stage === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                        m.stage === "HUMAN_CHECKPOINT" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {m.stage.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-ink-secondary">
                      {m.allocated_kg > 0 ? `${m.allocated_kg} kg Allocated` : "Pre-Allocation"}
                    </span>
                  </div>

                  {/* Checkpoint Banner if Held */}
                  {m.requires_human_review && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-2">
                      <div className="flex items-start gap-1.5 text-amber-900 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>Checkpoint Hold: {m.human_checkpoint_reason}</span>
                      </div>
                      <button
                        onClick={() => handleResumeAgentMission(m.mission_id)}
                        className="w-full py-1.5 rounded-md bg-amber-700 text-white font-semibold text-[11px] hover:bg-amber-800 transition-colors"
                      >
                        Coordinator Override & Resume
                      </button>
                    </div>
                  )}

                  {/* Audit Trail Snippet */}
                  <div className="space-y-1.5 pt-1 border-t border-line-default">
                    <div className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">
                      Execution Step Trace ({m.audit_trail.length} steps)
                    </div>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-[11px] font-mono">
                      {m.audit_trail.map((entry, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-brand-paper border border-line-default flex items-center justify-between text-[10px]">
                          <span className="font-bold text-brand-forest">[{entry.step}]</span>
                          <span className="text-ink-secondary truncate max-w-[240px]">{entry.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-brand-cream border border-line-default text-xs text-ink-secondary text-center space-y-1.5">
              <Bot className="w-6 h-6 text-brand-forest mx-auto opacity-70" />
              <div className="font-semibold text-ink-primary">No Autonomous Agent Missions Active</div>
              <div className="text-[11px]">Click "Launch Autonomous Mission" above to trigger a live end-to-end LangGraph coordination run.</div>
            </div>
          )}
        </section>

        {/* Operational Queues */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Queue 1: Safety Evidence Review Queue (Phase 4 Focus) */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-forest" />
                <h3 className="font-display font-bold text-base">Safety Review Queue</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {safetyReviews.length} On Hold
              </span>
            </div>
            <p className="text-xs text-ink-secondary">
              Listings requiring photo completeness check, FSSAI ambient limit inspection, or reviewer override.
            </p>
            
            {safetyReviews.length > 0 ? (
              <div className="space-y-3">
                {safetyReviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-900">Status: {rev.status}</span>
                      <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                        {rev.rule_version}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-800">
                      {rev.risk_indicators.join(", ") || "Held for temperature clarification."}
                    </div>
                    <button
                      onClick={() => handleClearSafetyHold(rev.id)}
                      className="w-full py-1.5 rounded-lg bg-brand-forest text-brand-paper font-semibold text-xs hover:bg-brand-deep transition-colors"
                    >
                      Clear Hold & Approve
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-brand-cream border border-line-default text-xs text-ink-secondary text-center space-y-1">
                <FileCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                <div className="font-semibold text-ink-primary">Safety Queue Clear</div>
                <div>All current listings comply with FSSAI holding limits.</div>
              </div>
            )}
          </div>

          {/* Queue 2: Recipient Organizations */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-forest" />
                <h3 className="font-display font-bold text-base">Recipient Network</h3>
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

          {/* Queue 3: Distribution Plans */}
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-forest" />
                <h3 className="font-display font-bold text-base">Allocation Plans</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-sage text-brand-forest">
                {allocationPlans.length} Active
              </span>
            </div>
            <p className="text-xs text-ink-secondary">
              Deterministic OR-Tools quantity split reservations and recovery replanning events.
            </p>

            <button
              onClick={() => handleRunOptimization()}
              className="w-full py-2 px-3 rounded-lg bg-brand-forest text-brand-paper font-semibold text-xs hover:bg-brand-deep transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Simulate 30kg Surplus Optimization</span>
            </button>

            {allocationPlans.length > 0 ? (
              <div className="space-y-3 pt-2">
                {allocationPlans.map((plan) => (
                  <div key={plan.id} className="p-3.5 rounded-xl bg-brand-cream border border-line-default text-xs space-y-2.5">
                    <div className="flex justify-between items-center border-b border-line-default pb-2">
                      <span className="font-bold text-ink-primary">
                        {plan.total_allocated_kg} / {plan.total_available_kg} kg Allocated
                      </span>
                      <span className="text-[10px] bg-brand-sage text-brand-forest px-1.5 py-0.5 rounded font-semibold">
                        {plan.optimizer_engine}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {plan.allocations.map((alloc) => (
                        <div key={alloc.id} className="p-2.5 rounded-lg bg-brand-paper border border-line-default text-[11px] space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-ink-primary">{alloc.recipient_name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              alloc.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" :
                              alloc.status === "PARTIALLY_ACCEPTED" ? "bg-blue-100 text-blue-800" :
                              alloc.status === "DECLINED" ? "bg-red-100 text-red-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {alloc.status}
                            </span>
                          </div>
                          <div className="text-ink-secondary flex justify-between">
                            <span>Offered: <strong className="text-ink-primary">{alloc.allocated_kg} kg</strong></span>
                            {alloc.confirmed_kg !== undefined && (
                              <span>Confirmed: <strong className="text-emerald-700">{alloc.confirmed_kg} kg</strong></span>
                            )}
                          </div>
                          {alloc.status === "OFFERED" && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleAcceptAllocation(alloc.id, alloc.allocated_kg)}
                                className="flex-1 py-1 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                              >
                                Accept All
                              </button>
                              <button
                                onClick={() => handleAcceptAllocation(alloc.id, Math.round(alloc.allocated_kg * 0.7 * 10) / 10)}
                                className="flex-1 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                              >
                                Partial (70%)
                              </button>
                              <button
                                onClick={() => handleDeclineAllocation(alloc.id)}
                                className="flex-1 py-1 rounded bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-brand-cream border border-line-default text-xs text-ink-secondary text-center space-y-1">
                <div>No active plans yet.</div>
                <div className="text-[11px]">Click above to run optimization against seed recipient capacities.</div>
              </div>
            )}
          </div>
        </section>

        {/* Phase 9: Tamper-Evident Operational Audit Trail */}
        <section className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-forest" />
              <h3 className="font-display font-bold text-base">Operational Audit Trail</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-sage text-brand-forest">
              {auditLogs.length} Events Logged
            </span>
          </div>
          <p className="text-xs text-ink-secondary">
            Authoritative, append-only log of privileged state changes, FSSAI reviews, allocation generation, and verified digital handovers.
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-brand-cream border border-line-default text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[11px] text-brand-forest px-1.5 py-0.5 rounded bg-brand-sage/60">
                        {log.action}
                      </span>
                      <span className="text-ink-secondary text-[11px]">
                        Target: <strong className="text-ink-primary font-mono">{log.resource_type}</strong>
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-secondary truncate max-w-xl font-mono">
                      {JSON.stringify(log.details)}
                    </div>
                  </div>
                  <div className="text-[10px] text-ink-secondary font-mono shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-brand-cream border border-line-default text-xs text-ink-secondary text-center">
                No recent audit events captured in local buffer.
              </div>
            )}
          </div>
        </section>

        {/* Non-Certification Notice (Strict PRD Trust Boundary) */}
        <section className="p-4 rounded-xl bg-brand-sage/60 border border-brand-leaf/20 flex items-start gap-3 text-xs text-brand-deep">
          <AlertTriangle className="w-4 h-4 text-brand-forest shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Authoritative Food Safety Rule:</span> AI models and photograph analysis evaluate visible completeness and handling evidence only. They do not and cannot certify microbiological safety. Physical inspection and recorded handover confirmation by the recipient are mandatory.
          </div>
        </section>
      </main>
    </div>
  );
}
