import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { BriefingShell } from "@/components/briefing-shell";
import { readBriefing } from "@/lib/store";
import { complaintsHref } from "@/lib/takeaways";
import { liftLabel, percent, weekLabel } from "@/lib/weeks";

export default function EvidencePage({ params }: { params: Promise<{ issue: string }> }) {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading evidence dossier…</p>}>
      <Evidence params={params} />
    </Suspense>
  );
}

async function Evidence({ params }: { params: Promise<{ issue: string }> }) {
  await connection();
  const { issue } = await params;
  const briefing = readBriefing();
  const investigation = briefing.investigations.find((item) => item.slug === issue);

  if (!investigation) {
    return (
      <BriefingShell>
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-sm text-stone-600">No active investigation dossier matches &ldquo;{issue}&rdquo;.</p>
          <Link
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs"
            href="/briefing"
          >
            ← Return to Overview
          </Link>
        </div>
      </BriefingShell>
    );
  }

  const complaintWeeks = [...new Set(investigation.trend.map((point) => point.week))];
  const present = investigation.trend.filter((point) => point.count > 0);
  const max = Math.max(...present.map((point) => point.count), 1);
  const topFactor = investigation.factors.find((factor) => factor.qualifies) ?? investigation.factors[0] ?? null;

  return (
    <BriefingShell>
      <div className="space-y-8">
        {/* Breadcrumb & Dossier Header */}
        <div className="border-b border-stone-200/80 pb-5">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Link href="/briefing" className="hover:text-stone-900">Briefing</Link>
            <span>/</span>
            <span>Investigations</span>
            <span>/</span>
            <span className="font-semibold capitalize text-stone-950">{investigation.issue}</span>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-rose-500" />
              <h1 className="text-2xl font-bold capitalize tracking-tight text-stone-950 sm:text-3xl">
                {investigation.issue} Investigation Dossier
              </h1>
            </div>

            <Link
              href={complaintsHref({ issue: investigation.issue, week: briefing.latestWeek })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 shadow-xs transition-colors hover:bg-stone-50"
            >
              <span>Explore All {investigation.current} Messages</span>
              <span className="text-stone-400">→</span>
            </Link>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-stone-600 sm:text-sm">
            This investigation was triggered because {investigation.issue} complaints spiked to{" "}
            <span className="font-semibold text-stone-900">{investigation.current} instances</span> in the current period, exceeding the historical 4-week average of{" "}
            <span className="font-semibold text-stone-900">{investigation.baseline.toFixed(1)}</span> (
            <span className="font-semibold text-rose-700">{(investigation.current / investigation.baseline).toFixed(1)}× surge</span>).
          </p>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold uppercase tracking-wider">
              <span>Current Period</span>
              <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">Active</span>
            </div>
            <p className="mt-3 font-mono text-3xl font-bold text-stone-950">{investigation.current}</p>
            <p className="mt-1 text-xs text-stone-500">Complaints in latest week</p>
          </div>
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold uppercase tracking-wider">
              <span>Historical Baseline</span>
              <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">4-Wk Avg</span>
            </div>
            <p className="mt-3 font-mono text-3xl font-bold text-stone-950">{investigation.baseline.toFixed(1)}</p>
            <p className="mt-1 text-xs text-stone-500">Normal operating volume</p>
          </div>
          <div className="rounded-2xl border border-teal-200/80 bg-teal-50/50 p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-teal-800 font-semibold uppercase tracking-wider">
              <span>Attribution Factor</span>
              <span className="rounded-md bg-teal-100 px-1.5 py-0.5 text-[10px] text-teal-900 font-bold">
                {topFactor ? `Lift ${liftLabel(topFactor.lift)}×` : "Baseline"}
              </span>
            </div>
            <p className="mt-3 truncate text-2xl font-bold text-teal-950">{topFactor ? topFactor.value : "None"}</p>
            <p className="mt-1 text-xs text-teal-800">
              {topFactor ? `${topFactor.dimension} • ${topFactor.complaintCount} complaints (${percent(topFactor.complaintShare)} share)` : "Within normal operational bounds"}
            </p>
          </div>
        </div>

        {/* Longitudinal Volume Trend Section */}
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-stone-950 uppercase">Longitudinal Issue Volume</h2>
              <p className="text-xs text-stone-500">Click any weekly bar to filter the complaints ledger</p>
            </div>
            <span className="font-mono text-xs text-stone-500">{present.length} Periods Recorded</span>
          </div>

          {complaintWeeks.length < 2 ? (
            <p className="mt-4 text-xs text-stone-500">
              Insufficient longitudinal data points to render historical timeline.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {investigation.trend.map((point) => (
                <Link
                  key={point.week}
                  href={complaintsHref({ week: point.week, issue: investigation.issue })}
                  className="group grid grid-cols-[8.5rem_1fr_3rem] items-center gap-3 rounded-lg p-1 text-xs transition-colors hover:bg-stone-50"
                >
                  <span className="font-medium text-stone-700 group-hover:text-stone-950">
                    {weekLabel(point.week).replace("Week of ", "")}
                  </span>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-teal-800 transition-all group-hover:bg-teal-700"
                      style={{ width: `${point.count === 0 ? 0 : Math.max(4, (point.count / max) * 100)}%` }}
                    />
                  </div>
                  <span className="text-right font-mono font-semibold text-stone-900">{point.count}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Operational Attribution Matrix Table */}
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-sm font-bold tracking-tight text-stone-950 uppercase">Operational Factor Attribution</h2>
            <p className="text-xs text-stone-500">
              Lift is calculated as (Complaint Share / Order Share). Factors with Lift ≥ 2.0 and ≥ 5 complaints are marked for escalation.
            </p>
          </div>

          {briefing.orderCount === 0 ? (
            <p className="mt-4 text-xs text-stone-500">Order facts are not loaded; cannot compute operational lift.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-600">
                    <th className="p-3 font-semibold uppercase tracking-wider text-[11px] text-stone-500">Factor / Dimension</th>
                    <th className="p-3 font-semibold text-stone-700 text-center">Complaints</th>
                    <th className="p-3 font-semibold text-stone-700 text-center">Complaint Share</th>
                    <th className="p-3 font-semibold text-stone-700 text-center">Order Share</th>
                    <th className="p-3 font-semibold text-stone-700 text-right">Calculated Lift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {investigation.factors.map((factor) => {
                    const isHigh = factor.qualifies;

                    return (
                      <tr key={`${factor.dimension}-${factor.value}`} className="transition-colors hover:bg-stone-50/60">
                        <td className="p-3 font-medium text-stone-900">
                          <Link
                            className="font-semibold text-teal-800 hover:text-teal-950 hover:underline"
                            href={complaintsHref({
                              issue: investigation.issue,
                              week: briefing.latestWeek,
                              dimension: factor.dimension,
                              factor: factor.value,
                            })}
                          >
                            {factor.value}
                          </Link>
                          <span className="ml-2 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-mono text-stone-500">
                            {factor.dimension}
                          </span>
                          {isHigh ? (
                            <span className="ml-2 inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                              Marked Escalation
                            </span>
                          ) : null}
                        </td>
                        <td className="p-3 font-mono text-center font-medium text-stone-900">{factor.complaintCount}</td>
                        <td className="p-3 font-mono text-center text-stone-600">{percent(factor.complaintShare)}</td>
                        <td className="p-3 font-mono text-center text-stone-600">{percent(factor.orderShare)}</td>
                        <td className="p-3 text-right">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 font-mono font-bold ${
                              isHigh
                                ? "bg-rose-100 text-rose-900"
                                : factor.lift > 1.0
                                  ? "bg-teal-50 text-teal-900"
                                  : "bg-stone-100 text-stone-700"
                            }`}
                          >
                            {liftLabel(factor.lift)}×
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Representative Support Messages */}
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-stone-950 uppercase">
                Representative Support Messages ({investigation.examples.length})
              </h2>
              <p className="text-xs text-stone-500">Direct customer email records extracted from the connected inbox</p>
            </div>
            <span className="text-xs text-stone-400 font-mono">Source: Gmail</span>
          </div>

          {investigation.examples.length === 0 ? (
            <p className="text-xs text-stone-500">No example complaints were saved for this issue.</p>
          ) : (
            <div className="space-y-3">
              {investigation.examples.map((example) => (
                <article
                  key={example.id}
                  className="rounded-xl border border-stone-200/70 bg-stone-50/40 p-4 transition-colors hover:bg-white hover:border-stone-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/50 pb-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">{example.id}</span>
                      <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-600">
                        Gmail
                      </span>
                      {example.orderId ? (
                        <span className="rounded-md bg-stone-200/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-stone-800">
                          Order #{example.orderId}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-stone-500">
                      <span className="capitalize">{example.severity} severity</span>
                      <span>•</span>
                      <span className="capitalize">{example.sentiment}</span>
                      {example.createdAt ? (
                        <>
                          <span>•</span>
                          <span>{example.createdAt.slice(0, 10)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-stone-800 font-normal sm:text-sm">
                    {example.text}
                  </p>

                  <div className="mt-2.5 text-[11px] font-mono text-stone-400">
                    Rule trigger: {example.reason}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </BriefingShell>
  );
}
