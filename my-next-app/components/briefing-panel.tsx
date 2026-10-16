"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { DIMENSIONS, buildView, readFilters, type Filters } from "@/lib/analytics";
import { MIN_FACTOR_COUNT } from "@/lib/pipeline";
import { issueSlug } from "@/lib/label";
import {
  categoryShareTakeaway,
  categoryShares,
  complaintsHref,
  concentrationTakeaway,
  liftTakeaway,
  recordsFor,
  sentimentTakeaway,
  trendReady,
  trendTakeaway,
} from "@/lib/takeaways";
import type { Briefing, FactorDimension } from "@/lib/types";
import { weekLabel } from "@/lib/weeks";
import { Heatmap } from "./charts/heatmap";
import { IssueTrend } from "./charts/issue-trend";
import { LiftBars } from "./charts/lift-bars";
import { SplitBars } from "./charts/split-bars";

type Section = "trend" | "share" | "lift" | "concentration" | "sentiment" | "complaints";

export function BriefingPanel({ briefing, section }: { briefing: Briefing; section: Section }) {
  const params = useSearchParams();
  const router = useRouter();
  const filters = readFilters(params, briefing);
  const view = buildView(briefing, filters);
  const issues = [...new Set(briefing.records.map((record) => record.issue))];
  const complaintWeeks = [...new Set(briefing.records.map((record) => record.week).filter(Boolean))].sort();
  const weekOrders = briefing.orderFacts.filter((order) => order.week === filters.week);
  const weekRecords = briefing.records.filter((record) => record.week === filters.week && (!filters.issue || record.issue === filters.issue));
  const focusRecords = briefing.records.filter((record) => record.week === filters.week && record.issue === view.focusIssue);
  const linkedFocus = focusRecords.filter((record) => record[filters.dimension]);
  const shareRow = filters.factor ? view.shares.find((row) => row.value === filters.factor) : [...view.shares].sort((a, b) => b.lift - a.lift)[0];
  const categories = categoryShares(briefing.records, filters.week);
  const hotCell = hottestCell(view.heatmap);

  function update(next: Partial<Filters>) {
    const merged = { ...filters, ...next, channel: "" };
    const query = new URLSearchParams();
    if (merged.week) query.set("week", merged.week);
    if (merged.issue) query.set("issue", merged.issue);
    if (merged.dimension !== "warehouse") query.set("dimension", merged.dimension);
    if (merged.factor) query.set("factor", merged.factor);
    const path = sectionPath(section);
    router.replace(query.size ? `${path}?${query}` : path, { scroll: false });
  }

  function openComplaints(next: { week: string; issue: string; dimension?: string; factor?: string }) {
    router.push(complaintsHref(next));
  }

  return (
    <div className="space-y-6">
      {/* Workbench Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            label="Analysis Period"
            value={section === "complaints" ? params.get("week") || "" : filters.week}
            onChange={(week) => update({ week, factor: "" })}
          >
            {section === "complaints" ? <option value="">All Available Weeks</option> : null}
            {complaintWeeks.map((week) => (
              <option key={week} value={week}>
                {weekLabel(week)}
              </option>
            ))}
          </Select>

          <Select
            label="Filter Issue"
            value={filters.issue}
            onChange={(issue) => update({ issue, factor: "" })}
          >
            <option value="">All Categories ({issues.length})</option>
            {issues.map((issue) => (
              <option key={issue} value={issue}>
                {issue}
              </option>
            ))}
          </Select>

          {section === "lift" || section === "concentration" || section === "complaints" ? (
            <Select
              label="Operational Dimension"
              value={filters.dimension}
              onChange={(dimension) => update({ dimension: dimension as FactorDimension, factor: "" })}
            >
              {DIMENSIONS.map((dimension) => (
                <option key={dimension} value={dimension}>
                  By {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
                </option>
              ))}
            </Select>
          ) : null}
        </div>

        {filters.factor ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900 ring-1 ring-inset ring-teal-600/20">
              <span>{filters.factor}</span>
              <button
                type="button"
                onClick={() => update({ factor: "" })}
                className="hover:text-teal-950 font-bold"
                aria-label={`Clear ${filters.factor} filter`}
              >
                ×
              </button>
            </span>
            <button
              type="button"
              onClick={() => update({ factor: "" })}
              className="text-xs text-stone-500 hover:text-stone-900 underline"
            >
              Reset
            </button>
          </div>
        ) : null}
      </div>

      {/* View: Issue Trends */}
      {section === "trend" ? (
        <Panel
          title="Historical Issue Trends"
          badge="Line Series"
          takeaway={trendTakeaway(briefing.records, filters.issue)}
        >
          {trendReady(briefing.records) ? (
            <div className="rounded-xl border border-stone-100 bg-stone-50/40 p-4">
              <IssueTrend
                series={view.trend.map((series) => ({
                  ...series,
                  points: series.points.filter((point) => complaintWeeks.includes(point.week)),
                }))}
                guide={view.guide}
                selectedWeek={filters.week}
                onSelect={(week, issue) => openComplaints({ week, issue })}
              />
            </div>
          ) : (
            <EmptyState message="Insufficient data points to render weekly trendline. At least 2 weeks required." />
          )}
        </Panel>
      ) : null}

      {/* View: Complaint Share */}
      {section === "share" ? (
        <Panel
          title="Complaint Volume Distribution"
          badge="Horizontal Ranking"
          takeaway={`Which issue categories dominate current volume? ${categoryShareTakeaway(categories.total, categories.rows[0])}`}
        >
          {categories.total === 0 ? (
            <EmptyState message="No complaint records found for the selected period." />
          ) : (
            <CategoryBars
              total={categories.total}
              rows={categories.rows}
              onSelect={(issue) => openComplaints({ week: filters.week, issue })}
            />
          )}
        </Panel>
      ) : null}

      {/* View: Lift Analysis */}
      {section === "lift" ? (
        <Panel
          title={`Operational Lift Analysis${filters.issue ? "" : ` • ${view.focusIssue}`}`}
          badge="Disproportionality"
          takeaway={
            weekOrders.length === 0
              ? "Lift calculation unavailable: No matched order records exist for the selected week."
              : linkedFocus.length === 0
                ? "Lift calculation unavailable: These complaints lack order linkage; denominators cannot be aligned."
                : `Complaint share based on ${linkedFocus.length} ${view.focusIssue} complaints linked to orders this week. Order share benchmark based on all ${weekOrders.length} orders placed that week. ${liftTakeaway(shareRow, linkedFocus.length, weekOrders.length)} Note: Lift > 1.0 denotes overrepresentation, not proven causality.`
          }
        >
          {weekOrders.length === 0 || linkedFocus.length === 0 ? (
            <EmptyState message="Order denominator is unavailable to compute statistical lift." />
          ) : (
            <div className="rounded-xl border border-stone-100 bg-stone-50/40 p-5">
              <LiftBars
                rows={view.shares}
                selected={filters.factor}
                onSelect={(factor) => openComplaints({ week: filters.week, issue: view.focusIssue, factor, dimension: filters.dimension })}
              />
            </div>
          )}
        </Panel>
      ) : null}

      {/* View: Concentration Matrix */}
      {section === "concentration" ? (
        <Panel
          title="Concentration Matrix"
          badge="Heatmap"
          takeaway={
            weekOrders.length === 0
              ? concentrationTakeaway(null, 0)
              : hotCell
                ? concentrationTakeaway(hotCell, weekOrders.length)
                : `No entity meets the minimum threshold of ${MIN_FACTOR_COUNT} complaints this week to be classified as a concentrated failure.`
          }
        >
          {weekOrders.length === 0 || briefing.records.length === 0 ? (
            <EmptyState message="No operational records to compute cross-dimensional concentration." />
          ) : (
            <div className="rounded-xl border border-stone-100 bg-white p-3">
              <Heatmap
                columns={view.heatmapColumns}
                rows={view.heatmap}
                selectedIssue={filters.issue}
                selectedValue={filters.factor}
                onSelect={(issue, factor) => openComplaints({ week: filters.week, issue, factor, dimension: filters.dimension })}
              />
            </div>
          )}
        </Panel>
      ) : null}

      {/* View: Sentiment & Severity */}
      {section === "sentiment" ? (
        <Panel
          title="Sentiment & Severity Breakdown"
          badge="Rule-Based"
          takeaway={`Methodology Note: Classifications are derived using deterministic keyword heuristics (not opaque ML predictions). Damaged items and refund delays default to High Severity. ${sentimentTakeaway(weekRecords)}`}
        >
          {weekRecords.length === 0 ? (
            <EmptyState message="No records in scope to calculate sentiment and severity distributions." />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs">
                <SplitBars
                  title="Customer Sentiment Distribution"
                  icon={
                    <svg className="h-4 w-4 text-teal-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  }
                  rows={view.sentiment}
                  keys={["negative", "neutral", "positive"]}
                  colors={{ negative: "#e11d48", neutral: "#eab308", positive: "#0f766e" }}
                  onSelect={(issue) => openComplaints({ week: filters.week, issue })}
                />
              </div>
              <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs">
                <SplitBars
                  title="Severity Rating Distribution"
                  icon={
                    <svg className="h-4 w-4 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  }
                  rows={view.severity}
                  keys={["high", "medium", "low"]}
                  colors={{ high: "#e11d48", medium: "#f59e0b", low: "#0f766e" }}
                  onSelect={(issue) => openComplaints({ week: filters.week, issue })}
                />
              </div>
            </div>
          )}
        </Panel>
      ) : null}

      {/* View: Complaints Explorer */}
      {section === "complaints" ? (
        <ComplaintList
          briefing={briefing}
          filters={{
            ...filters,
            week: params.get("week") || "",
            issue: params.get("issue") || "",
            factor: params.get("factor") || "",
          }}
          onClear={() => router.push("/briefing/complaints")}
        />
      ) : null}
    </div>
  );
}

function ComplaintList({
  briefing,
  filters,
  onClear,
}: {
  briefing: Briefing;
  filters: Filters;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = recordsFor(briefing.records, filters).filter((complaint) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return complaint.text.toLowerCase().includes(needle) || complaint.orderId.toLowerCase().includes(needle);
  });
  const evidence = new Set(briefing.investigations.map((item) => item.slug));
  const hasActiveFilters = Boolean(filters.week || filters.issue || filters.factor || query.trim());

  return (
    <section className="space-y-4">
      {/* Explorer Controls Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-stone-950">
            {filters.factor ? `Filtered Complaints: ${filters.factor}` : "Complaints Ledger Explorer"}
          </h2>
          <p className="text-xs text-stone-500">
            {filtered.length} matching message{filtered.length === 1 ? "" : "s"} across active filters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Search keyword or order #..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-1.5 pl-8 text-xs text-stone-900 transition-colors focus:border-stone-400 focus:bg-white focus:outline-hidden"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <svg
              className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs transition-colors hover:bg-stone-50"
              onClick={() => {
                setQuery("");
                onClear();
              }}
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      </div>

        {/* Ticket Cards Stream */}
        {filtered.length === 0 ? (
          <EmptyState message="No complaint records match your active search and filter parameters." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-xs">
            <table className="w-full min-w-[48rem] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-600">
                  <th className="p-3.5 font-semibold uppercase tracking-wider text-[11px] text-stone-500 w-24">Ticket ID</th>
                  <th className="p-3.5 font-semibold text-stone-700 w-28">Category</th>
                  <th className="p-3.5 font-semibold text-stone-700 w-24">Severity</th>
                  <th className="p-3.5 font-semibold text-stone-700">Customer Message & Match Reason</th>
                  <th className="p-3.5 font-semibold text-stone-700 w-28 text-center">Order ID</th>
                  <th className="p-3.5 font-semibold text-stone-700 w-24 text-center">Period</th>
                  <th className="p-3.5 font-semibold text-stone-700 w-24 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((complaint) => {
                  const slug = issueSlug(complaint.issue);
                  const isHigh = complaint.severity === "high";

                  return (
                    <tr key={complaint.id} className="transition-colors hover:bg-stone-50/60 align-top">
                      <td className="p-3.5 font-mono text-stone-900 font-semibold whitespace-nowrap">
                        {complaint.id}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-teal-800 ring-1 ring-inset ring-teal-600/20">
                          {complaint.issue}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                            isHigh
                              ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                              : complaint.severity === "medium"
                                ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                                : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {complaint.severity}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="text-stone-800 leading-relaxed font-normal">{complaint.text}</p>
                        <p className="mt-1 font-mono text-[10px] text-stone-400">
                          Rule trigger: {complaint.reason}
                        </p>
                      </td>
                      <td className="p-3.5 font-mono text-center whitespace-nowrap">
                        {complaint.orderId ? (
                          <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold text-stone-700">
                            #{complaint.orderId}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-center text-stone-500 whitespace-nowrap text-[11px]">
                        {complaint.week ? weekLabel(complaint.week).replace("Week of ", "") : "—"}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {evidence.has(slug) ? (
                          <Link
                            className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:text-teal-950 hover:underline"
                            href={`/briefing/evidence/${slug}`}
                          >
                            <span>Dossier</span>
                            <span>→</span>
                          </Link>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}

function CategoryBars({
  total,
  rows,
  onSelect,
}: {
  total: number;
  rows: { issue: string; count: number; previous: number | null }[];
  onSelect: (issue: string) => void;
}) {
  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-2 text-xs text-stone-500">
        <span className="font-semibold uppercase tracking-wider text-[10px]">Ranked Issue Categories</span>
        <span className="font-mono text-[11px]">{total} Total Complaints This Period</span>
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => {
          const sharePct = total === 0 ? 0 : Math.round((row.count / total) * 100);
          const barWidth = Math.max(3, (row.count / maxCount) * 100);

          return (
            <button
              key={row.issue}
              type="button"
              onClick={() => onSelect(row.issue)}
              className="group grid w-full grid-cols-[11rem_1fr_6rem] items-center gap-4 rounded-xl border border-stone-200/80 bg-white p-3 text-left transition-all hover:border-stone-300 hover:bg-stone-50/50 shadow-2xs"
            >
              {/* Category label with rank */}
              <div className="flex items-center gap-2 truncate">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-stone-100 font-mono text-[11px] font-bold text-stone-500">
                  {idx + 1}
                </span>
                <span className="truncate text-xs font-semibold capitalize text-stone-900 group-hover:text-teal-950">
                  {row.issue}
                </span>
              </div>

              {/* Horizontal bar track */}
              <div className="relative h-6 w-full rounded-md bg-stone-100/70 p-0.5">
                <div
                  className="flex h-full items-center justify-end rounded-sm bg-teal-700/85 px-2 text-[11px] font-bold text-white transition-all duration-300 group-hover:bg-teal-700"
                  style={{ width: `${barWidth}%` }}
                >
                  <span className="font-mono">{sharePct}%</span>
                </div>
              </div>

              {/* Count and delta */}
              <div className="text-right font-mono text-xs">
                <span className="font-bold text-stone-900">{row.count} msgs</span>
                {row.previous !== null ? (
                  <span className="block text-[10px] text-stone-400">
                    prev: {row.previous}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500">
        <span>Click any row to drill into complaints for this category</span>
        <span className="font-mono text-[11px]">Ranked in descending volume order</span>
      </div>
    </div>
  );
}

function hottestCell(rows: { issue: string; cells: { value: string; lift: number; complaintCount: number }[] }[]) {
  let best: { issue: string; value: string; lift: number; complaintCount: number } | null = null;
  for (const row of rows) {
    for (const cell of row.cells) {
      if (cell.complaintCount < MIN_FACTOR_COUNT) continue;
      if (!best || cell.complaintCount > best.complaintCount || (cell.complaintCount === best.complaintCount && cell.lift > best.lift)) {
        best = { issue: row.issue, value: cell.value, lift: cell.lift, complaintCount: cell.complaintCount };
      }
    }
  }
  return best;
}

function sectionPath(section: Section): string {
  return `/briefing/${section}`;
}

function Panel({
  title,
  badge,
  takeaway,
  children,
}: {
  title: string;
  badge?: string;
  takeaway: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <h2 className="text-base font-bold tracking-tight text-stone-950">{title}</h2>
        {badge ? (
          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-3.5 text-xs leading-relaxed text-stone-600 sm:text-sm">{takeaway}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-500">
      {message}
    </div>
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
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        {label}
      </label>
      <select
        className="rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-1.5 text-xs font-semibold text-stone-900 transition-colors hover:bg-stone-50 focus:border-stone-400 focus:outline-hidden"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  );
}
