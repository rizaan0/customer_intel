import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { readBriefing } from "@/lib/store";
import { alertTakeaway } from "@/lib/takeaways";
import type { Briefing } from "@/lib/types";
import { liftLabel, weekLabel } from "@/lib/weeks";

const STEPS = [
  {
    num: "01",
    title: "Complaint Ingestion",
    subtitle: "Keyword Normalization",
    description: "Every support email is parsed, structured, and labeled into standardized categories with deterministic rules.",
  },
  {
    num: "02",
    title: "Pattern Detection",
    subtitle: "Historical 4-Week Baseline",
    description: "Statistical volume checks automatically flag any issue surging ≥1.5× over its baseline with at least 8 instances.",
  },
  {
    num: "03",
    title: "Operational Lift",
    subtitle: "Complaint Share vs. Order Share",
    description: "Cross-checks affected orders against warehouse, product, and carrier distributions to detect overrepresentation.",
  },
  {
    num: "04",
    title: "Evidence Ledger",
    subtitle: "Direct Root Cause Audit",
    description: "Drill down into verified email messages and order records behind the alert to validate findings before acting.",
  },
];

export default function HomePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-6 py-24 text-stone-500">Loading…</main>}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  await connection();
  const briefing = loadBriefing();
  const alert = briefing?.alerts.find((item) => item.issue && item.slug) ?? null;

  return (
    <main className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 sm:pt-20 sm:pb-28">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 shadow-xs transition-colors hover:border-stone-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-stone-700">Enterprise Operations Intelligence v1.0</span>
            <span className="text-stone-300">•</span>
            <span className="text-xs text-stone-500">Continuous Root Cause Auditing</span>
          </div>

          <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-6xl sm:leading-[1.08] lg:text-7xl">
            Turn fragmented support mail into{" "}
            <span className="bg-gradient-to-r from-stone-950 via-teal-900 to-emerald-700 bg-clip-text text-transparent">
              operational root cause.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
            Stop treating complaints as disconnected tickets. Customer Complaint Intelligence links inbox messages to order operations, calculates statistical lift, and isolates supply chain failures in real time.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/briefing"
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow-md"
            >
              <span>Explore Live Briefing</span>
              <svg className="h-4 w-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-800 shadow-xs transition-colors hover:bg-stone-50"
            >
              How It Works
            </a>
          </div>

          <div className="mt-8 flex items-center gap-6 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Zero Hardcoded Insights
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Calculated Statistical Lift
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Gmail Live Connector Ready
            </span>
          </div>
        </div>

        {/* Live Workspace Preview Window */}
        {briefing && alert ? (
          <div id="preview" className="mt-14 scroll-mt-24 sm:mt-18">
            <div className="rounded-3xl border border-stone-200/90 bg-stone-100/70 p-2.5 shadow-xl sm:p-4">
              <div className="rounded-2xl border border-stone-200/90 bg-white shadow-xs overflow-hidden">
                {/* Window Chrome */}
                <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/70 px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                    <span className="ml-2 font-mono text-[11px] text-stone-400">cci://workspace/weekly-briefing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active Dataset Loaded
                    </span>
                    <span className="hidden text-xs text-stone-400 sm:inline">
                      {briefing.latestWeek ? weekLabel(briefing.latestWeek) : "Current Period"}
                    </span>
                  </div>
                </div>

                {/* Window Inner Content */}
                <div className="p-6 sm:p-8">
                  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
                          Prioritized Anomaly
                        </span>
                        <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-mono text-stone-600">
                          Alert 01 of {briefing.alerts.length}
                        </span>
                      </div>
                      <h3 className="mt-2 text-2xl font-semibold capitalize tracking-tight text-stone-950 sm:text-3xl">
                        {alert.issue} Spike Detected
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-stone-600">
                        {alertTakeaway(briefing.records, alert.issue, briefing.latestWeek, alert.current)}
                      </p>

                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
                          <span className="text-[10px] uppercase font-semibold text-stone-400">Current</span>
                          <p className="mt-1 font-mono text-xl font-bold text-stone-950">{alert.current}</p>
                          <span className="text-[10px] text-stone-500">complaints</span>
                        </div>
                        <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
                          <span className="text-[10px] uppercase font-semibold text-stone-400">Baseline</span>
                          <p className="mt-1 font-mono text-xl font-bold text-stone-950">{alert.baseline.toFixed(1)}</p>
                          <span className="text-[10px] text-stone-500">4-wk avg</span>
                        </div>
                        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
                          <span className="text-[10px] uppercase font-semibold text-teal-700">Calculated Lift</span>
                          <p className="mt-1 font-mono text-xl font-bold text-teal-900">
                            {alert.factor ? liftLabel(alert.factor.lift) : "—"}
                          </p>
                          <span className="text-[10px] text-teal-600">vs order share</span>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-4">
                        <Link
                          href={`/briefing/evidence/${alert.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 transition-colors hover:text-teal-950"
                        >
                          <span>Review Full Investigation Ledger</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>

                    {/* Operational Attribution Card */}
                    <div className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-5 sm:p-6">
                      <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
                        <span className="text-xs font-semibold text-stone-700">Attribution Factor</span>
                        <span className="rounded-md bg-stone-200/60 px-2 py-0.5 font-mono text-[10px] font-medium text-stone-700">
                          {alert.factor?.dimension ?? "Operational"}
                        </span>
                      </div>

                      <div className="mt-4">
                        <span className="text-xs text-stone-500">Root entity candidate</span>
                        <p className="mt-0.5 text-lg font-semibold text-stone-950">
                          {alert.factor?.value ?? "Unknown Factor"}
                        </p>
                      </div>

                      <div className="mt-5 space-y-2 border-t border-stone-200/60 pt-4 text-xs">
                        <div className="flex justify-between text-stone-600">
                          <span>Complaint Representation:</span>
                          <span className="font-mono font-medium text-stone-950">
                            {alert.factor ? `${alert.factor.complaintCount} of ${alert.current}` : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Benchmark Order Share:</span>
                          <span className="font-mono font-medium text-stone-950">
                            {alert.factor ? `${Math.round(alert.factor.orderShare * 100)}% of orders` : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Dataset Scope:</span>
                          <span className="font-mono text-stone-950">{briefing.complaintCount} msgs / {briefing.orderCount} ord</span>
                        </div>
                      </div>

                      <p className="mt-4 rounded-lg bg-white p-2.5 text-[11px] leading-relaxed text-stone-500 border border-stone-200/60">
                        This correlation cleared the minimum lift threshold of ≥2.0× and was flagged for operational review.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* 4-Step Analytical Framework Section */}
      <section id="workflow" className="border-t border-stone-200/80 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">Analytical Methodology</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              From raw support tickets to verified operational root cause.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
              Traditional CS ticketing tools treat every email as an isolated fire to extinguish. Customer Complaint Intelligence operates a 4-step pipeline that surfaces macro supply chain failures.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-stone-50/50 p-6 transition-all hover:border-stone-300 hover:bg-white hover:shadow-sm"
              >
                <div>
                  <span className="font-mono text-2xl font-bold tracking-tight text-teal-800">
                    {step.num}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-stone-950">{step.title}</h3>
                  <span className="text-[11px] font-medium text-teal-700">{step.subtitle}</span>
                  <p className="mt-3 text-xs leading-relaxed text-stone-600">{step.description}</p>
                </div>
                <div className="mt-6 h-1 w-8 rounded-full bg-stone-200 transition-colors group-hover:bg-teal-700" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Comparison / Persona Section */}
      <section className="border-t border-stone-200/80 bg-stone-50/50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Business Value</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Built for cross-functional operations triage.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
              <div className="h-9 w-9 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                OPS
              </div>
              <h3 className="mt-4 text-base font-semibold text-stone-950">Operations Managers</h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Identify which warehouse or delivery partner has abnormal complaint spikes without waiting for monthly reviews.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
              <div className="h-9 w-9 rounded-lg bg-teal-900 text-white flex items-center justify-center font-bold text-xs">
                SUP
              </div>
              <h3 className="mt-4 text-base font-semibold text-stone-950">Customer Support Leads</h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Discover root cause clusters rather than answering repeat messages individually. Link tickets to actual orders.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
              <div className="h-9 w-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                PART
              </div>
              <h3 className="mt-4 text-base font-semibold text-stone-950">Carrier & Logistics Owners</h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Validate service agreements with undeniable evidence: complaint shares weighted against actual package volume.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="border-t border-stone-200/80 bg-stone-950 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to audit this week’s complaints?
            </h2>
            <p className="mt-2 text-xs text-stone-400 sm:text-sm">
              Explore the pre-computed briefing ledger or connect your support Gmail inbox.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/briefing"
              className="rounded-full bg-white px-6 py-2.5 text-xs font-semibold text-stone-950 shadow-sm transition-colors hover:bg-stone-100"
            >
              Open Operations Briefing
            </Link>
            <Link
              href="/settings"
              className="rounded-full border border-stone-700 px-6 py-2.5 text-xs font-semibold text-stone-300 transition-colors hover:bg-stone-900 hover:text-white"
            >
              Configure Mailbox
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">CCI</span>
            <span>•</span>
            <span>Final-Year Major Project Demonstration Build</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/briefing" className="transition-colors hover:text-stone-950">Briefing</Link>
            <Link href="/upload" className="transition-colors hover:text-stone-950">Upload</Link>
            <Link href="/settings" className="transition-colors hover:text-stone-950">Settings</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function loadBriefing(): Briefing | null {
  try {
    return readBriefing();
  } catch {
    return null;
  }
}
