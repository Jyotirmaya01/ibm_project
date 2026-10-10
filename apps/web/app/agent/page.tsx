"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Bot, 
  Sparkles, 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Scale, 
  ShieldCheck, 
  Building2, 
  Truck, 
  RefreshCw,
  Send,
  Terminal,
  Activity,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AgentStepLog {
  node: string;
  title: string;
  status: "pending" | "running" | "completed" | "flagged";
  thought: string;
  outputSummary?: string;
}

export default function AgentMissionPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentStepLog[]>([]);
  const [missionResult, setMissionResult] = useState<any | null>(null);

  const initialNodes: AgentStepLog[] = [
    {
      node: "intake_validation",
      title: "1. Visual Intake & Completeness Validation",
      status: "pending",
      thought: "Vision model inspecting photo evidence for container seals, plate fullness, and hygiene flags.",
    },
    {
      node: "safety_evaluation",
      title: "2. FSSAI Food Safety Rules Engine",
      status: "pending",
      thought: "Verifying preparation timestamp against FSSAI-SURPLUS-2019-V1.2 (<4h ambient limit).",
    },
    {
      node: "demand_discovery",
      title: "3. Recipient Demand & Capacity Discovery",
      status: "pending",
      thought: "Querying active verified ashrams & shelters within 8km with valid <24h capacity snapshots.",
    },
    {
      node: "optimization",
      title: "4. Deterministic Solver (Google OR-Tools)",
      status: "pending",
      thought: "Computing linear programming allocation to split surplus without hallucination or excess.",
    },
    {
      node: "recipient_outreach",
      title: "5. Recipient Outreach & Reservation Hold",
      status: "pending",
      thought: "Locking transactional reservation and dispatching SMS/WhatsApp notifications to matching shelter.",
    },
    {
      node: "handover_coordination",
      title: "6. Volunteer Dispatch & OTP Security Gate",
      status: "pending",
      thought: "Generating 4-digit verification PIN and provisioning masked phone in-app coordination thread.",
    },
  ];

  const handleRunAgent = async (customText?: string) => {
    const textToRun = customText || prompt || "60kg surplus Basmati Rice & Dal from Grand Banquets Aerocity. Find an ashram within 5km.";
    setPrompt(textToRun);
    setIsRunning(true);
    setMissionResult(null);

    // Initialize step states
    setAgentLogs(initialNodes);

    // Simulate / Trigger LangGraph step-by-step state machine execution with visual feedback
    const nodes = [...initialNodes];

    for (let i = 0; i < nodes.length; i++) {
      setActiveNode(nodes[i].node);
      nodes[i].status = "running";
      setAgentLogs([...nodes]);

      // Delay for realistic agent reasoning demonstration
      await new Promise((resolve) => setTimeout(resolve, 850));

      nodes[i].status = "completed";
      if (nodes[i].node === "intake_validation") {
        nodes[i].outputSummary = "PASSED: High-resolution photo validated. Dish: Basmati Rice & Dal Makhani. Quantity: 60 kg.";
      } else if (nodes[i].node === "safety_evaluation") {
        nodes[i].outputSummary = "PASSED: Prepared 1h 15m ago, hot-held in stainless urns at >65°C. FSSAI rule clearance granted.";
      } else if (nodes[i].node === "demand_discovery") {
        nodes[i].outputSummary = "DISCOVERED: 2 matching nearby recipients: Seva Ashram (Deficit: 80 meals) & Bal Orphanage (Deficit: 50 meals).";
      } else if (nodes[i].node === "optimization") {
        nodes[i].outputSummary = "OPTIMIZED: Solved via Bounded Simplex. Allocated 35 kg to Seva Ashram and 25 kg to Bal Orphanage. 0 kg waste.";
      } else if (nodes[i].node === "recipient_outreach") {
        nodes[i].outputSummary = "RESERVED: Both shelters confirmed availability. Reservations locked in memory.";
      } else if (nodes[i].node === "handover_coordination") {
        nodes[i].outputSummary = "DISPATCHED: Volunteer driver assigned. Generated OTP: 8419. Masked coordination chat initialized.";
      }
      setAgentLogs([...nodes]);
    }

    setIsRunning(false);
    setActiveNode(null);
    setMissionResult({
      missionId: "msn-" + Math.random().toString(36).substring(2, 8),
      allocatedKg: 60,
      estimatedMeals: 171,
      co2MitigatedKg: 150,
      recipientsAssigned: ["Seva Ashram Kitchen (35 kg)", "Bal Snehi Orphanage (25 kg)"],
      verificationOtp: "8419",
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#14221D] font-body flex flex-col justify-between py-6 px-6">
      
      {/* Top Bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1F5D46] flex items-center justify-center text-white font-bold text-xl shadow-xs">
              <Bot className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-[#1F5D46]">
                  AnnaSetu Copilot
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  LangGraph Agentic Engine
                </span>
              </div>
              <p className="text-xs text-gray-500">Autonomous Food Rescue & Optimization Agent</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/operations"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Operations Console
          </Link>
          <Link
            href="/login"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#1F5D46] text-white hover:bg-[#164333] transition-colors"
          >
            Role Login
          </Link>
        </div>
      </header>

      {/* Main Agent Workspace */}
      <main className="max-w-6xl mx-auto w-full py-8 space-y-8 flex-1">
        
        {/* Agent Command Input Box */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Prompt the Autonomous Rescue Agent</span>
            </div>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Backed by FSSAI Rules & Google OR-Tools Mathematical Dual-Solver
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 50kg surplus lunch from corporate canteen in Aerocity. Find recipient shelter..."
              className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#1F5D46]"
            />
            <button
              onClick={() => handleRunAgent()}
              disabled={isRunning}
              className="px-6 py-3 rounded-xl bg-[#1F5D46] hover:bg-[#164333] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Agent Thinking...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Mission</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400">Try Sample Missions:</span>
            <button
              onClick={() => handleRunAgent("Wedding surplus 40kg dal & rice held at 65C. Match with vegetarian ashram.")}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 transition-colors font-medium border border-gray-200"
            >
              🥘 Wedding Feast (40kg Pure Veg)
            </button>
            <button
              onClick={() => handleRunAgent("Corporate conference surplus 75kg mixed meals. Split between 2 nearby orphanages.")}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 transition-colors font-medium border border-gray-200"
            >
              🏢 Corporate Canteen (75kg Multi-Split)
            </button>
            <button
              onClick={() => handleRunAgent("Bhandara khichdi 100kg. Prepare driver dispatch and verify OTP.")}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 transition-colors font-medium border border-gray-200"
            >
              🙏 Community Bhandara (100kg Large Batch)
            </button>
          </div>
        </div>

        {/* Live LangGraph Execution Pipeline & Reasoning */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Pipeline Steps */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#1F5D46]" />
                <h3 className="font-bold text-sm text-gray-900">
                  LangGraph StateGraph Execution Pipeline
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {isRunning ? "STATE: EXECUTING" : missionResult ? "STATE: SUCCESS" : "STATE: IDLE"}
              </span>
            </div>

            <div className="space-y-3">
              {(agentLogs.length > 0 ? agentLogs : initialNodes).map((step, idx) => (
                <div
                  key={step.node}
                  className={`p-4 rounded-xl border transition-all ${
                    activeNode === step.node
                      ? "border-[#1F5D46] bg-emerald-50/50 shadow-xs ring-1 ring-[#1F5D46]"
                      : step.status === "completed"
                      ? "border-emerald-200 bg-white"
                      : "border-gray-100 bg-gray-50/50 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {step.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : activeNode === step.node ? (
                        <RefreshCw className="w-4 h-4 text-[#1F5D46] animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[9px] text-gray-500">
                          {idx + 1}
                        </div>
                      )}
                      <span className="font-bold text-xs text-gray-900">{step.title}</span>
                    </div>

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      step.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : activeNode === step.node
                        ? "bg-amber-100 text-amber-800 animate-pulse"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {step.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-2 pl-6 font-mono leading-relaxed">
                    {step.thought}
                  </p>

                  {step.outputSummary && (
                    <div className="mt-2.5 ml-6 p-2 rounded-lg bg-emerald-100/70 text-emerald-900 text-xs font-semibold">
                      {step.outputSummary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Mission Result Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Cpu className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-gray-900">
                  Mission Dispatch Output
                </h3>
              </div>

              {missionResult ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                    <span className="font-bold block">Autonomous Mission Success!</span>
                    <span>Mission ID: <strong>{missionResult.missionId}</strong></span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Surplus Allocated:</span>
                      <strong className="text-gray-900">{missionResult.allocatedKg} kg</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Wholesome Meals:</span>
                      <strong className="text-gray-900">~{missionResult.estimatedMeals} meals</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">CO₂ Avoided:</span>
                      <strong className="text-emerald-700">{missionResult.co2MitigatedKg} kg</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Verification PIN:</span>
                      <strong className="font-mono text-sm text-[#1F5D46]">{missionResult.verificationOtp}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="font-bold text-gray-700 block">Assigned Shelters:</span>
                    {missionResult.recipientsAssigned.map((rec: string, i: number) => (
                      <div key={i} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-2 text-gray-400">
                  <Bot className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-xs">
                    Run the agent above to watch autonomous food matching and verification in action.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Link
                href="/handover"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs transition-colors"
              >
                Go to Handover & OTP Portal
              </Link>
              <Link
                href="/operations"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition-colors"
              >
                Inspect Audit Logs
              </Link>
            </div>
          </div>

        </div>

      </main>

      {/* Clean Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-gray-400 pt-6">
        AnnaSetu AI • Agentic AI Coordination Engine • Powered by LangGraph StateGraph
      </footer>

    </div>
  );
}
