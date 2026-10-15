import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Dashboard } from "@/components/dashboard";
import { readBriefing } from "@/lib/store";
import { liftLabel, percent, weekLabel } from "@/lib/weeks";

export default function BriefingPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 text-stone-500">Loading briefing…</main>}>
      <Briefing />
    </Suspense>
  );
}

async function Briefing() {
  await connection();
  const briefing = readBriefing();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
      <section>
        <p className="text-sm text-stone-500">{weekLabel(briefing.latestWeek)}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950">What got worse</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          {briefing.complaintCount} complaints linked to {briefing.orderCount} orders. A spike is this week against the
          average of the previous four. Concentration is complaint share divided by that factor&apos;s share of orders.
          {briefing.gmailCount > 0 ? ` ${briefing.gmailCount} complaints were imported from Gmail.` : ""}
        </p>
      </section>

      {briefing.alerts.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-5 text-stone-600">No issue rose far enough to brief this week.</p>
      ) : (
        <div className="grid gap-4">
          {briefing.alerts.map((alert) => (
            <article key={alert.slug} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold capitalize text-stone-950">{alert.issue}</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    {alert.current} this week, average {alert.baseline.toFixed(1)} over the previous four weeks
                    {Number.isFinite(alert.ratio) ? ` (${alert.ratio.toFixed(1)}×)` : ""}.
                  </p>
                </div>
                <Link className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white" href={`/investigate/${alert.slug}`}>
                  View evidence
                </Link>
              </div>
              {alert.factor ? (
                <p className="mt-4 text-base text-stone-800">
                  Concentrated at <span className="font-semibold">{alert.factor.value}</span>
                  <span className="text-stone-500"> ({alert.factor.dimension})</span>. {percent(alert.factor.complaintShare)} of these
                  complaints, {percent(alert.factor.orderShare)} of orders, lift {liftLabel(alert.factor.lift)}.
                </p>
              ) : (
                <p className="mt-4 text-stone-600">No operational factor cleared the lift threshold.</p>
              )}
              <p className="mt-3 text-sm text-stone-500">
                Sentiment {alert.sentiment.negative} negative · Severity {alert.severity.high} high, {alert.severity.medium} medium,{" "}
                {alert.severity.low} low
                {alert.gmailCount > 0 ? ` · ${alert.gmailCount} from Gmail` : ""}
              </p>
            </article>
          ))}
        </div>
      )}

      <Dashboard briefing={briefing} />
    </main>
  );
}
