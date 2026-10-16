import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { BriefingShell } from "@/components/briefing-shell";
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
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>Operations Briefing</span>
              <span>/</span>
              <span className="font-medium text-stone-900">Weekly Executive Synthesis</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
              Operations Overview
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
            title="Total Complaints"
            value={String(briefing.complaintCount)}
            caption="Verified records in active scope"
            badge="100% Ingested"
            badgeType="neutral"
            icon={
              <svg className="h-4 w-4 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
          <MetricCard
            title="Total Orders"
            value={String(briefing.orderCount)}
            caption="Matched shipments baseline"
            badge="Benchmark"
            badgeType="neutral"
            icon={
              <svg className="h-4 w-4 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            }
          />
          <MetricCard
            title="Complaint Rate"
            value={briefing.orderCount === 0 ? "—" : `${((briefing.complaintCount / briefing.orderCount) * 100).toFixed(1)}%`}
            caption={`${briefing.complaintCount} per ${briefing.orderCount} total orders`}
            badge="Ratio"
            badgeType="neutral"
            icon={
              <svg className="h-4 w-4 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" x2="5" y1="5" y2="19" />
                <circle cx="6.5" cy="6.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
              </svg>
            }
          />
          <MetricCard
            title="Prevalent Issue"
            value={mostCommon(briefing.records)}
            caption="Highest frequency category"
            badge="Surveillance"
            badgeType="accent"
            capitalize
            icon={
              <svg className="h-4 w-4 text-teal-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <h2 className="text-lg font-semibold tracking-tight text-stone-950">Prioritized Spike Alerts</h2>
              <p className="text-xs text-stone-500">
                Statistical anomalies exceeding ≥1.5× 4-week average with minimum 8 complaint threshold
              </p>
            </div>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-stone-700">
              {briefing.alerts.length} Active Alerts
            </span>
          </div>

          {briefing.complaintCount === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
              No complaint records are currently loaded to analyze.
            </div>
          ) : briefing.alerts.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-600">
              All issue categories remain within standard operating baseline parameters this week.
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
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Alert #{idx + 1} • {(alert.current / alert.baseline).toFixed(1)}× Spike
                        </span>
                        <h3 className="text-lg font-bold capitalize tracking-tight text-stone-950">
                          {alert.issue}
                        </h3>
                      </div>
                      <p className="max-w-3xl text-xs leading-relaxed text-stone-600 sm:text-sm">
                        {alertTakeaway(briefing.records, alert.issue, briefing.latestWeek, alert.current)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <Link
                        href={`/briefing/evidence/${alert.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-stone-800"
                      >
                        <span>Investigate Evidence</span>
                        <span className="text-stone-400">→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Factor Callout Strip */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3.5 text-xs">
                    {alert.factor ? (
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500">Root attribution candidate:</span>
                        <span className="font-semibold text-stone-900">{alert.factor.value}</span>
                        <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                          {alert.factor.dimension}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="font-medium text-teal-800">
                          {percent(alert.factor.complaintShare)} of complaints ({alert.factor.complaintCount})
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[11px] font-bold text-teal-900">
                          Lift {liftLabel(alert.factor.lift)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-500">No operational factor crossed the lift ≥2.0 threshold.</span>
                    )}

                    <div className="flex items-center gap-2 font-mono text-[11px] text-stone-500">
                      <span className="text-rose-600 font-medium">{alert.sentiment.negative} Negative</span>
                      <span>/</span>
                      <span className="text-amber-700 font-medium">{alert.severity.high} High Severity</span>
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
  caption,
  badge,
  badgeType = "neutral",
  icon,
  capitalize = false,
}: {
  title: string;
  value: string;
  caption: string;
  badge: string;
  badgeType?: "neutral" | "accent";
  icon: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs transition-all hover:border-stone-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-500">{title}</span>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
              badgeType === "accent"
                ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-600/20"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {badge}
          </span>
          {icon}
        </div>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight text-stone-950 font-mono ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-500">{caption}</p>
    </article>
  );
}

function WeeklyTotals({ records }: { records: ComplaintRecord[] }) {
  const weeks = complaintWeeks(records);
  const max = Math.max(...weeks.map((week) => records.filter((record) => record.week === week).length), 1);
  if (weeks.length === 0) return null;

  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-stone-950">Weekly Total Ingestion Volume</h2>
          <p className="text-xs text-stone-500">Only verified timestamps in scope; no synthetic extrapolation</p>
        </div>
        <span className="font-mono text-xs text-stone-500">{weeks.length} Weeks Recorded</span>
      </div>

      <div className="mt-5 space-y-3">
        {weeks.map((week) => {
          const count = records.filter((record) => record.week === week).length;
          const sharePct = Math.round((count / max) * 100);
          return (
            <div key={week} className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-3 text-xs">
              <span className="font-medium text-stone-700">{weekLabel(week).replace("Week of ", "")}</span>
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-teal-800 transition-all duration-300"
                  style={{ width: `${Math.max(4, sharePct)}%` }}
                />
              </div>
              <span className="text-right font-mono font-semibold text-stone-900">{count} msgs</span>
            </div>
          );
        })}
      </div>
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
