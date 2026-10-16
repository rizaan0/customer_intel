import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { BriefingShell } from "@/components/briefing-shell";
import { GlowingAreaChart } from "@/components/ui/c-chart-16";
import { readBriefing } from "@/lib/store";
import { alertTakeaway, complaintWeeks } from "@/lib/takeaways";
import type { ComplaintRecord } from "@/lib/types";
import { liftLabel, percent, weekLabel } from "@/lib/weeks";

export default function BriefingPage() {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading briefing…</p>}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  await connection();
  const briefing = readBriefing();

  return (
    <BriefingShell>
      <div className="space-y-8">
        {/* Header Breadcrumbs & Meta */}
        <div className="flex flex-col gap-2 border-b border-stone-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-balance text-3xl text-stone-950 sm:text-4xl">
              Overview
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {briefing.latestWeek ? weekLabel(briefing.latestWeek) : "All Time"}
            </span>
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Complaints"
            value={String(briefing.complaintCount)}
            icon={
              <svg aria-hidden="true" className="size-4 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
          <MetricCard
            title="Orders"
            value={String(briefing.orderCount)}
            icon={
              <svg aria-hidden="true" className="size-4 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            }
          />
          <MetricCard
            title="Rate"
            value={briefing.orderCount === 0 ? "—" : `${((briefing.complaintCount / briefing.orderCount) * 100).toFixed(1)}%`}
            icon={
              <svg aria-hidden="true" className="size-4 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" x2="5" y1="5" y2="19" />
                <circle cx="6.5" cy="6.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
              </svg>
            }
          />
          <MetricCard
            title="Top issue"
            value={mostCommon(briefing.records)}
            capitalize
            icon={
              <svg aria-hidden="true" className="size-4 text-teal-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            }
          />
        </section>

        {/* Prioritized Spiking Anomaly Alerts Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-balance text-2xl text-stone-950">Spikes</h2>
            </div>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-stone-700">
              {briefing.alerts.length}
            </span>
          </div>

          {briefing.complaintCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600">
              <p>No complaint records are loaded.</p>
              <Link href="/upload" className="mt-3 inline-flex rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
                Upload a dataset
              </Link>
            </div>
          ) : briefing.alerts.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-600">
              No spikes this week.
            </div>
          ) : (
            <div className="grid gap-4">
              {briefing.alerts.map((alert, idx) => (
                <article
                  key={alert.slug}
                  className="group relative rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all hover:border-stone-300 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          {(alert.current / alert.baseline).toFixed(1)}×
                        </span>
                        <h3 className="text-lg font-bold capitalize tracking-tight text-stone-950">
                          {alert.issue}
                        </h3>
                      </div>
                      <p className="max-w-3xl text-pretty text-xs leading-relaxed text-stone-600 sm:text-sm">
                        {alertTakeaway(briefing.records, alert.issue, briefing.latestWeek, alert.current)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <Link
                        href={`/briefing/evidence/${alert.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-stone-800"
                      >
                        <span>Investigate</span>
                        <span className="text-stone-400">→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Factor Callout Strip */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3.5 text-xs">
                    {alert.factor ? (
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500">At</span>
                        <span className="font-semibold text-stone-900">{alert.factor.value}</span>
                        <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-medium text-stone-600">
                          {alert.factor.dimension}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="font-medium text-teal-800 tabular-nums">
                          {percent(alert.factor.complaintShare)} of complaints ({alert.factor.complaintCount})
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-xs font-bold text-teal-900">
                          Lift {liftLabel(alert.factor.lift)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-500">No factor with lift of 2 or more.</span>
                    )}

                    <div className="flex items-center gap-2 font-mono text-xs text-stone-500 tabular-nums">
                      <span className="text-rose-600 font-medium">{alert.sentiment.negative} negative</span>
                      <span className="text-stone-300">·</span>
                      <span className="text-amber-700 font-medium">{alert.severity.high} high severity</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Weekly Volume Distribution */}
        <WeeklyTotals records={briefing.records} />
      </div>
    </BriefingShell>
  );
}

function MetricCard({
  title,
  value,
  icon,
  capitalize = false,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-500">{title}</span>
        {icon}
      </div>
      <p className={`mt-3 font-semibold text-stone-950 tabular-nums ${capitalize ? "font-sans text-2xl leading-tight capitalize" : "font-mono text-3xl"}`}>
        {value}
      </p>
    </article>
  );
}

function WeeklyTotals({ records }: { records: ComplaintRecord[] }) {
  const weeks = complaintWeeks(records);
  if (weeks.length === 0) return null;

  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-2xl text-stone-950">Weekly volume</h2>
        </div>
        <span className="font-mono text-xs text-stone-500">{weeks.length} weeks</span>
      </div>

      <GlowingAreaChart
        className="mt-4 aspect-auto h-64 w-full"
        xKey="week"
        data={weeks.map((week) => ({
          week: weekLabel(week).replace(/^Week of /, "").replace(/ \d{4}$/, ""),
          complaints: records.filter((record) => record.week === week).length,
        }))}
        series={[{ key: "complaints", label: "Complaints", color: "var(--chart-1)" }]}
      />
    </section>
  );
}

function mostCommon(records: ComplaintRecord[]): string {
  const counts = new Map<string, number>();
  for (const record of records) counts.set(record.issue, (counts.get(record.issue) ?? 0) + 1);
  let best = "None";
  let bestCount = 0;
  for (const [issue, count] of counts) {
    if (count > bestCount) {
      best = issue;
      bestCount = count;
    }
  }
  return best;
}
