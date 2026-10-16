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
  if (records.length === 0) return "The upload has no complaints to chart.";
  if (weeks.length < 2) {
    const covered = weeks.length === 0 ? "no dated week" : weeks.map((week) => weekLabel(week)).join(", ");
    return `A week-to-week change needs at least two weeks in the file. Complaints are only in ${covered}.`;
  }
  const chosen = issue || issueWithLargestChange(records);
  if (!chosen) return "The upload has no complaints to chart.";
  const present = weeks.filter((week) => countIssue(records, chosen, week) > 0);
  if (present.length < 2) {
    const only = present[0];
    const count = only ? countIssue(records, chosen, only) : 0;
    return `${titleIssue(chosen)} appears in only one week (${count} complaints${only ? ` in ${weekLabel(only)}` : ""}). A change needs another week.`;
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
  if (total === 0 || !top) return "This week has no complaints to split by issue.";
  const share = `${titleIssue(top.issue)} is the largest share this week: ${top.count} of ${total} complaints (${whole(top.count, total)}).`;
  if (top.previous === null) return `${share} There is no earlier week to compare.`;
  if (top.previous === 0) return `${share} The previous week had 0, so a percentage change is not shown.`;
  return `${share} ${changeSentence(top.issue, top.count, top.previous)}`;
}

export function shareTakeaway(row: ShareRow | undefined, complaintTotal: number, orderTotal: number): string {
  if (orderTotal === 0) return "Complaint share cannot be compared with orders because this upload has no orders for the selected week.";
  if (!row || complaintTotal === 0) return "The upload has no complaints in this week to compare with orders.";
  return `${row.value} accounts for ${whole(row.complaintCount, complaintTotal)} of these complaints (${row.complaintCount} of ${complaintTotal}) and ${whole(row.orderCount, orderTotal)} of orders (${row.orderCount} of ${orderTotal}).`;
}

export function liftTakeaway(row: ShareRow | undefined, complaintTotal: number, orderTotal: number): string {
  if (orderTotal === 0) return "Lift cannot be calculated because this upload has no orders for the selected week.";
  if (!row || complaintTotal === 0) return "The upload has no complaints in this week to compare with orders.";
  return `${row.value} has ${row.lift.toFixed(1)}× as many of these complaints as its share of orders (${row.complaintCount} complaints, ${row.orderCount} orders).`;
}

export function concentrationTakeaway(cell: { issue: string; value: string; complaintCount: number; lift: number } | null, orderTotal: number): string {
  if (orderTotal === 0) return "Concentration cannot be calculated because this upload has no orders for the selected week.";
  if (!cell) return "No complaint in this week is tied to an order factor.";
  return `${titleIssue(cell.issue)} complaints concentrate at ${cell.value}: ${cell.complaintCount} complaints, compared with that entity's share of the ${orderTotal} orders in the same week. Lift ${cell.lift.toFixed(1)}. This is an association, not proof of cause.`;
}

export function sentimentTakeaway(records: ComplaintRecord[]): string {
  if (records.length === 0) return "The upload has no complaints in this week to split by sentiment or severity.";
  const negative = records.filter((record) => record.sentiment === "negative").length;
  const high = records.filter((record) => record.severity === "high").length;
  return `${negative} of ${records.length} complaints this week are negative (${whole(negative, records.length)}). ${high} are high severity (${whole(high, records.length)}).`;
}

export function alertTakeaway(records: ComplaintRecord[], issue: string, latestWeek: string, current: number): string {
  const weeks = complaintWeeks(records);
  const index = weeks.indexOf(latestWeek);
  if (index <= 0) {
    return `${titleIssue(issue)} has ${current} complaints this week. The file has no earlier week to compare.`;
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
  if (previous === 0) {
    return `${name} complaints have none in the previous week (${current} this week, 0 the week before).`;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) {
    return `${name} complaints stayed the same compared with the previous week (${current} this week, ${previous} the week before).`;
  }
  const direction = pct > 0 ? "increased" : "decreased";
  return `${name} complaints ${direction} ${Math.abs(pct)}% compared with the previous week (${current} this week, ${previous} the week before).`;
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
