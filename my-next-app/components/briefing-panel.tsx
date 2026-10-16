"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
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
import { ChartFill, ChartTrack } from "./charts/chart-ui";
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
            label="Week"
            value={section === "complaints" ? params.get("week") || "" : filters.week}
            onChange={(week) => update({ week, factor: "" })}
          >
            {section === "complaints" ? <option value="">All weeks</option> : null}
            {complaintWeeks.map((week) => (
              <option key={week} value={week}>
                {weekLabel(week)}
              </option>
            ))}
          </Select>

          <Select
            label="Issue"
            value={filters.issue}
            onChange={(issue) => update({ issue, factor: "" })}
          >
            <option value="">All issues ({issues.length})</option>
            {issues.map((issue) => (
              <option key={issue} value={issue}>
                {issue}
              </option>
            ))}
          </Select>

          {section === "lift" || section === "concentration" || section === "complaints" ? (
            <Select
              label="Split by"
              value={filters.dimension}
              onChange={(dimension) => update({ dimension: dimension as FactorDimension, factor: "" })}
            >
              {DIMENSIONS.map((dimension) => (
                <option key={dimension} value={dimension}>
                  {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
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
          title="Trends"
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
            <EmptyState message="Need at least two weeks." />
          )}
        </Panel>
      ) : null}

      {/* View: Complaint Share */}
      {section === "share" ? (
        <Panel
          title="Share"
          takeaway={categoryShareTakeaway(categories.total, categories.rows[0])}
        >
          {categories.total === 0 ? (
            <EmptyState message="No complaints in this period." />
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
          title={filters.issue ? "Lift" : `Lift · ${view.focusIssue}`}
          takeaway={
            weekOrders.length === 0 || linkedFocus.length === 0
              ? "No linked orders this week."
              : liftTakeaway(shareRow, linkedFocus.length, weekOrders.length)
          }
        >
          {weekOrders.length === 0 || linkedFocus.length === 0 ? (
            <EmptyState message="No linked orders this week." />
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
          title="Concentration"
          takeaway={
            weekOrders.length === 0
              ? "No orders this week."
              : hotCell
                ? concentrationTakeaway(hotCell, weekOrders.length)
                : `Nothing with at least ${MIN_FACTOR_COUNT} complaints.`
          }
        >
          {weekOrders.length === 0 || briefing.records.length === 0 ? (
            <EmptyState message="No records for this view." />
          ) : (
            <Heatmap
                columns={view.heatmapColumns}
                rows={view.heatmap}
                selectedIssue={filters.issue}
                selectedValue={filters.factor}
                onSelect={(issue, factor) => openComplaints({ week: filters.week, issue, factor, dimension: filters.dimension })}
              />
          )}
        </Panel>
      ) : null}

      {/* View: Sentiment & Severity */}
      {section === "sentiment" ? (
        <Panel
          title="Sentiment and severity"
          takeaway={sentimentTakeaway(weekRecords)}
        >
          {weekRecords.length === 0 ? (
            <EmptyState message="No complaints this week." />
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              <SplitBars
                title="Sentiment"
                rows={view.sentiment}
                keys={["negative", "neutral", "positive"]}
                colors={{ negative: "#9f1239", neutral: "#78716c", positive: "#0f766e" }}
                onSelect={(issue) => openComplaints({ week: filters.week, issue })}
              />
              <SplitBars
                title="Severity"
                rows={view.severity}
                keys={["high", "medium", "low"]}
                colors={{ high: "#9f1239", medium: "#b45309", low: "#a8a29e" }}
                onSelect={(issue) => openComplaints({ week: filters.week, issue })}
              />
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
          <h2 className="text-2xl text-stone-950">
            {filters.factor ? filters.factor : "Complaints"}
          </h2>
          <p className="text-xs text-stone-500">
            {filtered.length} shown
          </p>
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-60">
            <label htmlFor="complaint-search" className="sr-only">
              Search complaints by keyword or order number
            </label>
            <input
              id="complaint-search"
              type="search"
              placeholder="Keyword or order id"
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 pl-8 text-base text-stone-900 focus:border-teal-800 focus:bg-white sm:text-sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <svg
              aria-hidden="true"
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
              Clear
            </button>
          ) : null}
        </div>
      </div>

        {/* Ticket Cards Stream */}
        {filtered.length === 0 ? (
          <EmptyState message="No matches." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-xs">
            <table className="w-full min-w-[48rem] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-600">
                  <th scope="col" className="p-3.5 font-semibold uppercase tracking-wider text-xs text-stone-500 w-24">Ticket ID</th>
                  <th scope="col" className="p-3.5 font-semibold text-stone-700 w-28">Category</th>
                  <th scope="col" className="p-3.5 font-semibold text-stone-700 w-24">Severity</th>
                  <th scope="col" className="p-3.5 font-semibold text-stone-700">Customer Message & Match Reason</th>
                  <th scope="col" className="p-3.5 font-semibold text-stone-700 w-28 text-center">Order ID</th>
                  <th scope="col" className="p-3.5 font-semibold text-stone-700 w-24 text-center">Period</th>
                  <th scope="col" className="p-3.5 font-semibold text-stone-700 w-24 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((complaint) => {
                  const slug = issueSlug(complaint.issue);
                  const isHigh = complaint.severity === "high";

                  return (
                    <tr key={complaint.id} className="transition-colors hover:bg-stone-50/60 align-top">
                      <td className="p-3.5 font-mono text-stone-900 font-semibold whitespace-nowrap tabular-nums">
                        {complaint.id}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold capitalize text-teal-800 ring-1 ring-inset ring-teal-600/20">
                          {complaint.issue}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-bold uppercase ${
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
                        <p className="mt-1 font-mono text-xs text-stone-400">
                          Rule trigger: {complaint.reason}
                        </p>
                      </td>
                      <td className="p-3.5 font-mono text-center whitespace-nowrap">
                        {complaint.orderId ? (
                          <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-semibold text-stone-700">
                            #{complaint.orderId}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-center text-stone-500 whitespace-nowrap text-xs">
                        {complaint.week ? weekLabel(complaint.week).replace("Week of ", "") : "—"}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {evidence.has(slug) ? (
                          <Link
                            className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:text-teal-950 hover:underline"
                            href={`/briefing/evidence/${slug}`}
                          >
                            <span>View</span>
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
        <span className="font-medium text-stone-700">{total} complaints</span>
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
              className="grid w-full grid-cols-[11rem_1fr_4.5rem] items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left hover:border-stone-300"
            >
              {/* Category label with rank */}
              <div className="flex items-center gap-2 truncate">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-stone-100 font-mono text-xs text-stone-500">
                  {idx + 1}
                </span>
                <span className="truncate text-sm font-medium capitalize text-stone-900">{row.issue}</span>
              </div>

              {/* Horizontal bar track */}
              <ChartTrack>
                <ChartFill width={`${barWidth}%`} />
              </ChartTrack>

              <div className="text-right font-mono text-xs tabular-nums">
                <span className="font-medium text-stone-900">{row.count}</span>
                <span className="ml-1 text-stone-400">{sharePct}%</span>
                {row.previous !== null ? (
                  <span className="block text-xs text-stone-400">
                    prev: {row.previous}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
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
        <h2 className="text-2xl text-stone-950">{title}</h2>
        {badge ? (
          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
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
    <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">
      <p className="text-pretty">{message}</p>
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
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-stone-400">
        {label}
      </label>
      <select
        id={id}
        className="rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 text-base font-medium text-stone-900 hover:bg-stone-50 focus:border-teal-800 sm:text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  );
}
