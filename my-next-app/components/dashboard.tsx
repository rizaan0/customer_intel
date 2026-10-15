"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { CHANNEL_COLORS, DIMENSIONS, buildView, readFilters, type Filters } from "@/lib/analytics";
import type { Briefing, FactorDimension } from "@/lib/types";
import { weekLabel } from "@/lib/weeks";
import { ChannelMix } from "./charts/channel-mix";
import { Heatmap } from "./charts/heatmap";
import { IssueTrend } from "./charts/issue-trend";
import { LiftBars } from "./charts/lift-bars";
import { ShareBars } from "./charts/share-bars";
import { SplitBars } from "./charts/split-bars";

export function Dashboard({ briefing }: { briefing: Briefing }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = readFilters(params, briefing);
  const view = buildView(briefing, filters);
  const issues = [...new Set(briefing.records.map((record) => record.issue))];
  const channels = [...new Set(briefing.records.map((record) => record.channel))];

  function update(next: Partial<Filters>) {
    const merged = { ...filters, ...next };
    const query = new URLSearchParams();
    if (merged.week) query.set("week", merged.week);
    if (merged.issue) query.set("issue", merged.issue);
    if (merged.channel) query.set("channel", merged.channel);
    if (merged.dimension !== "warehouse") query.set("dimension", merged.dimension);
    if (merged.factor) query.set("factor", merged.factor);
    router.replace(query.size ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 print:hidden">
        <Select label="Week" value={filters.week} onChange={(week) => update({ week })}>
          {view.weeks.map((week) => (
            <option key={week} value={week}>
              {weekLabel(week)}
            </option>
          ))}
        </Select>
        <Select label="Issue" value={filters.issue} onChange={(issue) => update({ issue })}>
          <option value="">All issues</option>
          {issues.map((issue) => (
            <option key={issue} value={issue}>
              {issue}
            </option>
          ))}
        </Select>
        <Select label="Channel" value={filters.channel} onChange={(channel) => update({ channel })}>
          <option value="">All channels</option>
          {channels.map((channel) => (
            <option key={channel} value={channel}>
              {channel}
            </option>
          ))}
        </Select>
        <Select
          label="Split by"
          value={filters.dimension}
          onChange={(dimension) => update({ dimension: dimension as FactorDimension, factor: "" })}
        >
          {DIMENSIONS.map((dimension) => (
            <option key={dimension} value={dimension}>
              {dimension}
            </option>
          ))}
        </Select>
        {filters.factor ? (
          <button type="button" className="self-end rounded-full border border-stone-300 px-3 py-2 text-sm" onClick={() => update({ factor: "" })}>
            Clear {filters.factor}
          </button>
        ) : null}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Complaints this week" value={String(view.current)} detail={`Average ${view.baseline.toFixed(1)} over the previous four weeks`} />
        <Tile label="Issues that spiked" value={String(view.spikeCount)} detail="At least 1.5× the recent average and 8 complaints" />
        <Tile
          label="Strongest concentration"
          value={view.strongest ? view.strongest.value : "None"}
          detail={view.strongest ? `Lift ${view.strongest.lift.toFixed(1)}` : "No factor cleared the lift line"}
        />
        <Tile label="From Gmail" value={String(view.gmailCount)} detail="In the current filters" />
      </section>

      <Panel title="Issue trend">
        <IssueTrend
          series={view.trend}
          guide={view.guide}
          selectedWeek={filters.week}
          onSelect={(week, issue) => update({ week, issue })}
        />
      </Panel>

      <Panel title={`Complaint share versus order share${filters.issue ? "" : ` · ${view.focusIssue}`}`}>
        <ShareBars rows={view.shares} selected={filters.factor} onSelect={(factor) => update({ factor })} />
      </Panel>

      <Panel title={`Lift${filters.issue ? "" : ` · ${view.focusIssue}`}`}>
        <LiftBars rows={view.shares} selected={filters.factor} onSelect={(factor) => update({ factor })} />
      </Panel>

      <Panel title="Channel mix">
        <ChannelMix weeks={view.channels} />
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-600">
          {view.channelNames.map((channel) => (
            <span key={channel} className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: CHANNEL_COLORS[channel] ?? "#44403c" }} />
              {channel}
            </span>
          ))}
        </div>
      </Panel>

      <Panel title="Where each issue concentrates">
        <Heatmap
          columns={view.heatmapColumns}
          rows={view.heatmap}
          selectedIssue={filters.issue}
          selectedValue={filters.factor}
          onSelect={(issue, factor) => update({ issue, factor })}
        />
      </Panel>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <SplitBars
            title="Sentiment"
            rows={view.sentiment}
            keys={["negative", "neutral", "positive"]}
            colors={{ negative: "#9f1239", neutral: "#a8a29e", positive: "#0f766e" }}
          />
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <SplitBars
            title="Severity"
            rows={view.severity}
            keys={["high", "medium", "low"]}
            colors={{ high: "#9f1239", medium: "#b45309", low: "#0f766e" }}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">
          {filters.factor ? `Complaints concentrated at ${filters.factor}` : "Complaints in this view"}
        </h2>
        {view.complaints.map((complaint) => (
          <article key={complaint.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">
              {complaint.channel} · {complaint.issue} · {complaint.severity}
              {complaint.gmail ? " · Gmail" : ""}
              {complaint.orderId ? ` · Order ${complaint.orderId}` : ""}
            </p>
            <p className="mt-2 text-stone-800">{complaint.text}</p>
            <p className="mt-2 text-sm text-stone-500">{complaint.reason}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">{title}</h2>
      {children}
    </section>
  );
}

function Tile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold capitalize text-stone-950">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{detail}</p>
    </article>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="text-sm text-stone-600">
      {label}
      <select
        className="mt-1 block rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}
