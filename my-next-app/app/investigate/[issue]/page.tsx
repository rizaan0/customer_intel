import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { readBriefing } from "@/lib/store";
import { liftLabel, percent, weekLabel } from "@/lib/weeks";

export default function InvestigationPage({ params }: { params: Promise<{ issue: string }> }) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 text-stone-500">Loading evidence…</main>}>
      <Investigation params={params} />
    </Suspense>
  );
}

async function Investigation({ params }: { params: Promise<{ issue: string }> }) {
  await connection();
  const { issue } = await params;
  const briefing = readBriefing();
  const investigation = briefing.investigations.find((item) => item.slug === issue);

  if (!investigation) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <p className="text-stone-600">That issue is not in the current briefing.</p>
        <Link className="mt-4 inline-block text-sm font-medium text-teal-800" href="/briefing">
          Back to the briefing
        </Link>
      </main>
    );
  }

  const max = Math.max(...investigation.trend.map((point) => point.count), 1);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
      <div>
        <Link className="text-sm font-medium text-teal-800" href="/briefing">
          Back to the briefing
        </Link>
        <h1 className="mt-2 text-3xl font-semibold capitalize tracking-tight text-stone-950">{investigation.issue}</h1>
        <p className="mt-2 text-stone-600">
          {investigation.current} in the {weekLabel(briefing.latestWeek).replace("Week of ", "week of ")}, average{" "}
          {investigation.baseline.toFixed(1)} over the previous four weeks.
          {investigation.gmailCount > 0 ? ` ${investigation.gmailCount} of this week came from Gmail.` : ""}
        </p>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Trend</h2>
        <div className="mt-4 space-y-3">
          {investigation.trend.map((point) => (
            <div key={point.week} className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3 text-sm">
              <span className="text-stone-600">{weekLabel(point.week).replace("Week of ", "")}</span>
              <div className="h-2 rounded-full bg-stone-100">
                <div
                  className="h-2 rounded-full bg-teal-800"
                  style={{ width: `${Math.max(4, (point.count / max) * 100)}%` }}
                />
              </div>
              <span className="text-right font-medium text-stone-800">{point.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Where it sits</h2>
        <p className="mt-1 text-sm text-stone-500">Lift is complaint share divided by order share. 2 or more is marked.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-stone-500">
              <tr>
                <th className="py-2 font-medium">Factor</th>
                <th className="py-2 font-medium">Complaints</th>
                <th className="py-2 font-medium">Complaint share</th>
                <th className="py-2 font-medium">Order share</th>
                <th className="py-2 font-medium">Lift</th>
              </tr>
            </thead>
            <tbody>
              {investigation.factors.map((factor) => (
                <tr key={`${factor.dimension}-${factor.value}`} className="border-t border-stone-100">
                  <td className="py-2 text-stone-800">
                    {factor.value}
                    <span className="ml-2 text-stone-400">{factor.dimension}</span>
                    {factor.qualifies ? <span className="ml-2 text-teal-800">marked</span> : null}
                  </td>
                  <td className="py-2">{factor.complaintCount}</td>
                  <td className="py-2">{percent(factor.complaintShare)}</td>
                  <td className="py-2">{percent(factor.orderShare)}</td>
                  <td className="py-2 font-medium">{liftLabel(factor.lift)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">Complaints behind the strongest factor</h2>
        {investigation.examples.map((example) => (
          <article key={example.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">
              {example.channel}
              {example.orderId ? ` · Order ${example.orderId}` : ""} · {example.severity} severity · {example.sentiment}
              {example.id.startsWith("gmail-") ? " · Gmail" : ""}
            </p>
            <p className="mt-2 text-stone-800">{example.text}</p>
            <p className="mt-2 text-sm text-stone-500">{example.reason}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
