import Link from "next/link";
import { ShieldCheck, HeartHandshake, Sparkles, ArrowRight, Activity } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="border-b border-line-default bg-brand-paper/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-forest flex items-center justify-center text-brand-paper font-display font-bold text-xl shadow-sm">
              अ
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-brand-forest">
                AnnaSetu AI
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-ink-secondary bg-brand-sage px-2 py-0.5 rounded-full font-medium">
                Food Rescue Network
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/operations"
              className="text-sm font-semibold text-brand-forest hover:text-brand-deep transition-colors px-3 py-2 rounded-lg"
            >
              Operations Dashboard
            </Link>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs sm:text-sm font-medium text-ink-secondary hover:text-ink-primary flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4 text-brand-marigold" />
              API Docs
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 sm:py-24 flex flex-col justify-center">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-sage text-brand-forest text-sm font-medium">
            <Sparkles className="w-4 h-4 text-brand-marigold" />
            Intelligent Surplus Food Redistribution
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-ink-primary leading-tight font-display">
            Turn surplus food into{" "}
            <span className="text-brand-forest">safely delivered</span> meals.
          </h1>

          <p className="text-lg sm:text-xl text-ink-secondary leading-relaxed font-body">
            AnnaSetu AI coordinates transparent food rescue between event organizers, bhandaras, caterers, and nearby ashrams, orphanages, and community kitchens across India. Driven by deterministic optimization and verified handovers.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/operations"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-forest text-brand-paper font-semibold hover:bg-brand-deep transition-all shadow-sm group"
            >
              Open Operations Console
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <a
              href="#architecture"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-line-default bg-brand-paper text-ink-primary font-semibold hover:bg-brand-sage/40 transition-colors"
            >
              System Blueprint
            </a>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <section id="architecture" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20">
          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-sage flex items-center justify-center text-brand-forest">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-ink-primary">
              Safety Evidence, Not Claims
            </h3>
            <p className="text-sm text-ink-secondary font-body leading-relaxed">
              Compulsory dish photography, time tracking, and FSSAI-aligned rules. AI assesses completeness and evidence without falsely certifying microbiological safety.
            </p>
          </div>

          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-sage flex items-center justify-center text-brand-forest">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-ink-primary">
              Google OR-Tools Allocation
            </h3>
            <p className="text-sm text-ink-secondary font-body leading-relaxed">
              Deterministic mathematical optimization splits single large donations across multiple eligible recipients. No duplicate reservations and zero hallucinated quantities.
            </p>
          </div>

          <div className="p-6 rounded-card bg-brand-paper border border-line-default shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-sage flex items-center justify-center text-brand-forest">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-ink-primary">
              Verified Handover & Recovery
            </h3>
            <p className="text-sm text-ink-secondary font-body leading-relaxed">
              In-app coordination and dynamic re-allocation if a recipient declines. Impact numbers only count physically accepted, completed rescues.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line-default bg-brand-paper py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-secondary font-body">
          <p>© 2026 AnnaSetu AI. Aligned with UN SDG 2 (Zero Hunger) & SDG 12 (Responsible Consumption).</p>
          <div className="flex gap-6">
            <Link href="/operations" className="hover:text-brand-forest">Operations</Link>
            <a href="http://localhost:8000/health" target="_blank" rel="noreferrer" className="hover:text-brand-forest">Backend Health</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
