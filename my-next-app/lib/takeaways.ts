import type { Briefing, ComplaintRecord } from "./types";
import type { Filters, ShareRow } from "./analytics";
import { weekLabel } from "./weeks";

export function complaintWeeks(records: ComplaintRecord[]): string[] {
  return [...new Set(records.map((record) => record.week).filter(Boolean))].sort();
}

export function trendReady(records: ComplaintRecord[]): boolean {
  return complaintWeeks(records).length >= 2;
}

export function trendTakeaway(records: ComplaintRecord[], issue: string): string {
  const weeks = complaintWeeks(records);
  if (records.length === 0) return "No complaints to chart.";
  if (weeks.length < 2) return "Need at least two weeks to compare.";
  const chosen = issue || issueWithLargestChange(records);
  if (!chosen) return "No complaints to chart.";
  const present = weeks.filter((week) => countIssue(records, chosen, week) > 0);
  if (present.length < 2) {
    const only = present[0];
    const count = only ? countIssue(records, chosen, only) : 0;
    return `${titleIssue(chosen)} is in one week only${only ? ` (${count})` : ""}.`;
  }
  const currentWeek = present[present.length - 1];
  const previousWeek = present[present.length - 2];
  return changeSentence(chosen, countIssue(records, chosen, currentWeek), countIssue(records, chosen, previousWeek));
}

export type CategoryShare = { issue: string; count: number; previous: number | null };

export function categoryShares(records: ComplaintRecord[], week: string): { total: number; rows: CategoryShare[] } {
  const weeks = complaintWeeks(records);
  const index = weeks.indexOf(week);
  const previousWeek = index > 0 ? weeks[index - 1] : null;
  const current = records.filter((record) => record.week === week);
  const issues = [...new Set(records.map((record) => record.issue))];
  const rows = issues
    .map((issue) => ({
      issue,
      count: current.filter((record) => record.issue === issue).length,
      previous: previousWeek === null ? null : countIssue(records, issue, previousWeek),
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.issue.localeCompare(b.issue));
  return { total: current.length, rows };
}

export function categoryShareTakeaway(total: number, top: CategoryShare | undefined): string {
  if (total === 0 || !top) return "No complaints this week.";
  return `${titleIssue(top.issue)} is ${top.count} of ${total}.`;
}

export function shareTakeaway(row: ShareRow | undefined, complaintTotal: number, orderTotal: number): string {
  if (orderTotal === 0) return "No orders this week.";
  if (!row || complaintTotal === 0) return "No complaints this week.";
  return `${row.value}: ${whole(row.complaintCount, complaintTotal)} of complaints, ${whole(row.orderCount, orderTotal)} of orders.`;
}

export function liftTakeaway(row: ShareRow | undefined, complaintTotal: number, orderTotal: number): string {
  if (orderTotal === 0) return "No orders this week.";
  if (!row || complaintTotal === 0) return "No complaints this week.";
  return `${row.value}: lift ${row.lift.toFixed(1)} (${row.complaintCount} complaints, ${row.orderCount} orders).`;
}

export function concentrationTakeaway(cell: { issue: string; value: string; complaintCount: number; lift: number } | null, orderTotal: number): string {
  if (orderTotal === 0) return "No orders this week.";
  if (!cell) return "No complaint is linked to an order.";
  return `${titleIssue(cell.issue)} at ${cell.value}: ${cell.complaintCount} complaints, lift ${cell.lift.toFixed(1)}.`;
}

export function sentimentTakeaway(records: ComplaintRecord[]): string {
  if (records.length === 0) return "No complaints this week.";
  const negative = records.filter((record) => record.sentiment === "negative").length;
  const high = records.filter((record) => record.severity === "high").length;
  return `${negative} of ${records.length} negative. ${high} high severity.`;
}

export function alertTakeaway(records: ComplaintRecord[], issue: string, latestWeek: string, current: number): string {
  const weeks = complaintWeeks(records);
  const index = weeks.indexOf(latestWeek);
  if (index <= 0) {
    return `${titleIssue(issue)}: ${current} this week.`;
  }
  return changeSentence(issue, current, countIssue(records, issue, weeks[index - 1]));
}

export function complaintsHref(filters: { week?: string; issue?: string; dimension?: string; factor?: string }): string {
  const query = new URLSearchParams();
  if (filters.week) query.set("week", filters.week);
  if (filters.issue) query.set("issue", filters.issue);
  if (filters.dimension && filters.dimension !== "warehouse") query.set("dimension", filters.dimension);
  if (filters.factor) query.set("factor", filters.factor);
  const text = query.toString();
  return text ? `/briefing/complaints?${text}` : "/briefing/complaints";
}

export function recordsFor(records: ComplaintRecord[], filters: Filters): ComplaintRecord[] {
  return records.filter((record) => {
    if (filters.week && record.week !== filters.week) return false;
    if (filters.issue && record.issue !== filters.issue) return false;
    if (filters.factor && record[filters.dimension] !== filters.factor) return false;
    return true;
  });
}

function issueWithLargestChange(records: ComplaintRecord[]): string {
  const issues = [...new Set(records.map((record) => record.issue))];
  let best = issues[0] ?? "";
  let bestDelta = -1;
  for (const issue of issues) {
    const present = complaintWeeks(records).filter((week) => countIssue(records, issue, week) > 0);
    if (present.length < 2) continue;
    const delta = Math.abs(
      countIssue(records, issue, present[present.length - 1]) - countIssue(records, issue, present[present.length - 2]),
    );
    if (delta > bestDelta) {
      bestDelta = delta;
      best = issue;
    }
  }
  return best;
}

function changeSentence(issue: string, current: number, previous: number): string {
  const name = titleIssue(issue);
  if (previous === 0) return `${name}: ${current} this week, 0 last week.`;
  const pct = Math.round(((current - previous) / previous) * 100);
  const change = pct > 0 ? `+${pct}%` : `${pct}%`;
  return `${name}: ${current} this week, ${previous} last week (${change}).`;
}

function countIssue(records: ComplaintRecord[], issue: string, week: string): number {
  return records.filter((record) => record.issue === issue && record.week === week).length;
}

function titleIssue(issue: string): string {
  return issue.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function whole(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export function coveredWeekText(briefing: Briefing): string {
  const weeks = complaintWeeks(briefing.records);
  if (weeks.length === 0) return "The upload has no complaints to chart.";
  return weeks.map((week) => weekLabel(week)).join(", ");
}
