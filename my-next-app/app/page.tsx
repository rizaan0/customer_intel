import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { HeroDither } from "@/components/hero-dither";
import { GlowingAreaChart } from "@/components/ui/c-chart-16";
import { readBriefing } from "@/lib/store";
import { alertTakeaway } from "@/lib/takeaways";
import type { Briefing } from "@/lib/types";
import { liftLabel, weekLabel } from "@/lib/weeks";

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
      <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-28">
        <HeroDither />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 text-center">
          <h1 className="max-w-[11em] text-[1.75rem] text-stone-950 sm:max-w-[10em] sm:text-5xl lg:text-6xl">
            See where <span className="whitespace-nowrap">complaints <em className="italic text-teal-900">concentrate.</em></span>
          </h1>

          <p className="mt-6 max-w-[34ch] text-pretty text-base leading-normal text-stone-600 sm:text-lg">
            Spikes, lift, and the orders behind them.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/briefing"
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow-md"
            >
              <span>Open briefing</span>
              <svg className="h-4 w-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Live Workspace Preview Window */}
        {briefing && alert ? (
          <div id="preview" className="relative z-10 mx-auto mt-14 max-w-7xl scroll-mt-24 px-6 sm:mt-18">
            <div className="rounded-3xl border border-stone-200/90 bg-stone-100/70 p-2.5 shadow-xl sm:p-4">
              <div className="rounded-2xl border border-stone-200/90 bg-white shadow-xs overflow-hidden">
                {/* Window Chrome */}
                <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/70 px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                    <span className="ml-2 text-xs text-stone-400">This week</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Loaded
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
                        <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                          Spike
                        </span>
                      </div>
                      <h3 className="mt-2 text-2xl font-semibold capitalize tracking-tight text-stone-950 sm:text-3xl">
                        {alert.issue}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-stone-600">
                        {alertTakeaway(briefing.records, alert.issue, briefing.latestWeek, alert.current)}
                      </p>

                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
                          <span className="text-xs uppercase font-semibold text-stone-400">Current</span>
                          <p className="mt-1 font-mono text-xl font-bold text-stone-950">{alert.current}</p>
                          <span className="text-xs text-stone-500">complaints</span>
                        </div>
                        <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
                          <span className="text-xs uppercase font-semibold text-stone-400">Baseline</span>
                          <p className="mt-1 font-mono text-xl font-bold text-stone-950">{alert.baseline.toFixed(1)}</p>
                          <span className="text-xs text-stone-500">4-wk avg</span>
                        </div>
                        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
                          <span className="text-xs uppercase font-semibold text-teal-700">Lift</span>
                          <p className="mt-1 font-mono text-xl font-bold text-teal-900">
                            {alert.factor ? liftLabel(alert.factor.lift) : "—"}
                          </p>
                        </div>
                      </div>

                      <GlowingAreaChart
                        className="mt-6 aspect-auto h-52 w-full"
                        xKey="week"
                        data={[...new Set(briefing.records.map((record) => record.week))].sort().map((week) => ({
                          week: weekLabel(week).replace(/^Week of /, "").replace(/ \d{4}$/, ""),
                          complaints: briefing.records.filter((record) => record.week === week && record.issue === alert.issue).length,
                        }))}
                        series={[{ key: "complaints", label: alert.issue, color: "#0f766e" }]}
                      />

                      <div className="mt-6 flex items-center gap-4">
                        <Link
                          href={`/briefing/evidence/${alert.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 transition-colors hover:text-teal-950"
                        >
                          <span>Investigate</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>

                    {/* Operational Attribution Card */}
                    <div className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-5 sm:p-6">
                      <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
                        <span className="text-xs font-semibold text-stone-700">Concentrated at</span>
                        <span className="rounded-md bg-stone-200/60 px-2 py-0.5 font-mono text-xs font-medium text-stone-700">
                          {alert.factor?.dimension ?? "Operational"}
                        </span>
                      </div>

                      <div className="mt-4">
                        <span className="sr-only">Factor</span>
                        <p className="mt-0.5 text-lg font-semibold text-stone-950">
                          {alert.factor?.value ?? "Unknown Factor"}
                        </p>
                      </div>

                      <div className="mt-5 space-y-2 border-t border-stone-200/60 pt-4 text-xs">
                        <div className="flex justify-between text-stone-600">
                          <span>Complaints</span>
                          <span className="font-mono font-medium text-stone-950">
                            {alert.factor ? `${alert.factor.complaintCount} of ${alert.current}` : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Orders</span>
                          <span className="font-mono font-medium text-stone-950">
                            {alert.factor ? `${Math.round(alert.factor.orderShare * 100)}% of orders` : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Scope</span>
                          <span className="font-mono text-stone-950">{briefing.complaintCount} complaints, {briefing.orderCount} orders</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
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
