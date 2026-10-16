import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { BriefingShell } from "@/components/briefing-shell";
import { readBriefing } from "@/lib/store";
import { complaintsHref } from "@/lib/takeaways";
import { liftLabel, percent, weekLabel } from "@/lib/weeks";

export default function EvidencePage({ params }: { params: Promise<{ issue: string }> }) {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading…</p>}>
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
          <p className="text-sm text-stone-600">No investigation for &ldquo;{issue}&rdquo;.</p>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl capitalize text-stone-950 sm:text-4xl">
              {investigation.issue}
            </h1>

            <Link
              href={complaintsHref({ issue: investigation.issue, week: briefing.latestWeek })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 shadow-xs transition-colors hover:bg-stone-50"
            >
              {investigation.current} complaints
            </Link>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-stone-500">This week</span>
            <p className="mt-3 font-mono text-3xl font-bold text-stone-950">{investigation.current}</p>
          </div>
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-stone-500">4-week average</span>
            <p className="mt-3 font-mono text-3xl font-bold text-stone-950">{investigation.baseline.toFixed(1)}</p>
          </div>
          <div className="rounded-2xl border border-teal-200/80 bg-teal-50/50 p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-teal-800">
              <span>Concentrated at</span>
              {topFactor ? <span className="font-mono">{liftLabel(topFactor.lift)}×</span> : null}
            </div>
            <p className="mt-3 truncate text-2xl font-bold text-teal-950">{topFactor ? topFactor.value : "None"}</p>
            {topFactor ? (
              <p className="mt-1 text-xs text-teal-800">
                {topFactor.dimension} · {topFactor.complaintCount} complaints
              </p>
            ) : null}
          </div>
        </div>

        {/* Longitudinal Volume Trend Section */}
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-stone-500">By week</h2>
            </div>
            <span className="font-mono text-xs text-stone-500">{present.length} weeks</span>
          </div>

          {complaintWeeks.length < 2 ? (
            <p className="mt-4 text-xs text-stone-500">
              Need at least two weeks.
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
            <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-stone-500">Factors</h2>
          </div>

          {briefing.orderCount === 0 ? (
            <p className="mt-4 text-xs text-stone-500">No orders loaded.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-600">
                    <th scope="col" className="p-3 font-semibold text-stone-700">Factor</th>
                    <th scope="col" className="p-3 font-semibold text-stone-700 text-center">Complaints</th>
                    <th scope="col" className="p-3 font-semibold text-stone-700 text-center">Complaint Share</th>
                    <th scope="col" className="p-3 font-semibold text-stone-700 text-center">Order Share</th>
                    <th scope="col" className="p-3 font-semibold text-stone-700 text-right">Lift</th>
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
                          <span className="ml-2 rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-mono text-stone-500">
                            {factor.dimension}
                          </span>
                          {isHigh ? (
                            <span className="ml-2 inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                              High lift
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
              <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-stone-500">
                Messages ({investigation.examples.length})
              </h2>
            </div>
          </div>

          {investigation.examples.length === 0 ? (
            <p className="text-xs text-stone-500">No sample messages.</p>
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
                      <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-600">
                        Gmail
                      </span>
                      {example.orderId ? (
                        <span className="rounded-md bg-stone-200/60 px-1.5 py-0.5 font-mono text-xs font-semibold text-stone-800">
                          Order #{example.orderId}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-stone-500">
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

                  <div className="mt-2.5 text-xs font-mono text-stone-400">
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
