import { MIN_FACTOR_COUNT, MIN_LIFT, MIN_SPIKE_COUNT, SPIKE_RATIO } from "./pipeline";
import type { Briefing, ComplaintRecord, FactorDimension, OrderFact } from "./types";

export const DIMENSIONS: FactorDimension[] = ["warehouse", "product", "partner", "region"];

export const ISSUE_COLORS: Record<string, string> = {
  "late delivery": "#0f766e",
  "damaged item": "#b45309",
  "refund delay": "#9f1239",
  "wrong item": "#44403c",
  "support experience": "#0369a1",
  other: "#a8a29e",
};

export type Filters = {
  week: string;
  issue: string;
  channel: string;
  dimension: FactorDimension;
  factor: string;
};

export type ShareRow = {
  value: string;
  complaintCount: number;
  complaintShare: number;
  orderCount: number;
  orderShare: number;
  lift: number;
  qualifies: boolean;
};

export type DashboardView = {
  weeks: string[];
  focusIssue: string;
  current: number;
  baseline: number;
  spikeCount: number;
  strongest: ShareRow | null;
  gmailCount: number;
  trend: { issue: string; points: { week: string; count: number }[] }[];
  guide: number | null;
  shares: ShareRow[];
  heatmap: { issue: string; cells: { value: string; lift: number; complaintCount: number }[] }[];
  heatmapColumns: string[];
  sentiment: { issue: string; negative: number; neutral: number; positive: number }[];
  severity: { issue: string; low: number; medium: number; high: number }[];
  complaints: ComplaintRecord[];
};

export function readFilters(params: URLSearchParams, briefing: Briefing): Filters {
  const dimension = params.get("dimension");
  return {
    week: params.get("week") || briefing.latestWeek,
    issue: params.get("issue") || "",
    channel: "",
    dimension: DIMENSIONS.includes(dimension as FactorDimension) ? (dimension as FactorDimension) : "warehouse",
    factor: params.get("factor") || "",
  };
}

export function buildView(briefing: Briefing, filters: Filters): DashboardView {
  const weeks = [...new Set([...briefing.weeks, ...briefing.orderFacts.map((order) => order.week)])].sort();
  const orderWeeks = [...new Set(briefing.orderFacts.map((order) => order.week))].sort();
  const previous = previousWeeks(orderWeeks, filters.week);
  const narrowed = briefing.records.filter((record) => inScope(record, filters, true));
  const currentRows = narrowed.filter((record) => record.week === filters.week);
  const baseline = average(previous.map((week) => narrowed.filter((record) => record.week === week).length));
  const issues = unique(briefing.records.map((record) => record.issue));
  const trendIssues = filters.issue ? [filters.issue] : issues;
  const trend = trendIssues.map((issue) => ({
    issue,
    points: weeks.map((week) => ({
      week,
      count: briefing.records.filter(
        (record) => record.week === week && record.issue === issue && inScope(record, filters, false),
      ).length,
    })),
  }));
  const guide = filters.issue
    ? average(
        previous.map(
          (week) =>
            briefing.records.filter((record) => record.week === week && record.issue === filters.issue && inScope(record, filters, false))
              .length,
        ),
      ) * SPIKE_RATIO
    : null;

  const weekOrders = briefing.orderFacts.filter((order) => order.week === filters.week);
  const focusIssue = filters.issue || strongestIssue(briefing.records, weekOrders, filters);
  const shareSource = briefing.records.filter(
    (record) =>
      record.week === filters.week &&
      record.issue === focusIssue &&
      (!filters.channel || record.channel === filters.channel),
  );
  const shares = shareRows(shareSource, weekOrders, filters.dimension);

  return {
    weeks,
    focusIssue,
    current: currentRows.length,
    baseline,
    spikeCount: countSpikes(briefing.records, filters, previous),
    strongest: shares.filter((row) => row.qualifies).sort((a, b) => b.lift - a.lift)[0] ?? null,
    gmailCount: currentRows.filter((record) => record.gmail).length,
    trend,
    guide: guide && guide > 0 ? guide : null,
    shares,
    heatmap: heatRows(briefing.records, briefing.orderFacts, filters),
    heatmapColumns: unique(briefing.orderFacts.filter((order) => order.week === filters.week).map((order) => order[filters.dimension])),
    sentiment: byIssue(currentRows, "sentiment"),
    severity: byIssue(currentRows, "severity"),
    complaints: [...currentRows].sort((a, b) => Number(b.gmail) - Number(a.gmail)).slice(0, 8),
  };
}

function inScope(record: ComplaintRecord, filters: Filters, includeIssue: boolean): boolean {
  if (filters.channel && record.channel !== filters.channel) return false;
  if (filters.factor && record[filters.dimension] !== filters.factor) return false;
  if (includeIssue && filters.issue && record.issue !== filters.issue) return false;
  return true;
}

function previousWeeks(weeks: string[], week: string): string[] {
  const index = weeks.indexOf(week);
  if (index <= 0) return [];
  return weeks.slice(Math.max(0, index - 4), index);
}

function countSpikes(records: ComplaintRecord[], filters: Filters, previous: string[]): number {
  const issues = unique(records.filter((record) => inScope(record, filters, false)).map((record) => record.issue)).filter(
    (issue) => !filters.issue || issue === filters.issue,
  );
  return issues.filter((issue) => {
    const current = records.filter((record) => record.week === filters.week && record.issue === issue && inScope(record, filters, false)).length;
    const baseline = average(
      previous.map(
        (week) => records.filter((record) => record.week === week && record.issue === issue && inScope(record, filters, false)).length,
      ),
    );
    const ratio = baseline === 0 ? (current > 0 ? Infinity : 0) : current / baseline;
    return current >= MIN_SPIKE_COUNT && ratio >= SPIKE_RATIO;
  }).length;
}

function strongestIssue(records: ComplaintRecord[], orders: OrderFact[], filters: Filters): string {
  const issues = unique(records.map((record) => record.issue));
  let bestIssue = issues[0] ?? "";
  let bestLift = -1;
  for (const issue of issues) {
    const rows = shareRows(
      records.filter(
        (record) =>
          record.week === filters.week &&
          record.issue === issue &&
          (!filters.channel || record.channel === filters.channel),
      ),
      orders,
      filters.dimension,
    );
    const top = rows.filter((row) => row.qualifies).sort((a, b) => b.lift - a.lift)[0];
    if (top && top.lift > bestLift) {
      bestLift = top.lift;
      bestIssue = issue;
    }
  }
  return bestIssue;
}

function shareRows(records: ComplaintRecord[], orders: OrderFact[], dimension: FactorDimension): ShareRow[] {
  const matched = records.filter((record) => record[dimension]);
  const values = unique([...orders.map((order) => order[dimension]), ...matched.map((record) => record[dimension])]);
  return values
    .map((value) => {
      const complaintCount = matched.filter((record) => record[dimension] === value).length;
      const complaintShare = matched.length === 0 ? 0 : complaintCount / matched.length;
      const orderCount = orders.filter((order) => order[dimension] === value).length;
      const orderShare = orders.length === 0 ? 0 : orderCount / orders.length;
      const lift = orderShare === 0 ? 0 : complaintShare / orderShare;
      return {
        value,
        complaintCount,
        complaintShare,
        orderCount,
        orderShare,
        lift,
        qualifies: complaintCount >= MIN_FACTOR_COUNT && lift >= MIN_LIFT,
      };
    })
    .filter((row) => row.complaintCount > 0)
    .sort((a, b) => b.lift - a.lift || b.complaintCount - a.complaintCount);
}

function heatRows(records: ComplaintRecord[], orders: OrderFact[], filters: Filters) {
  const weekOrders = orders.filter((order) => order.week === filters.week);
  const weekRecords = records.filter((record) => record.week === filters.week && (!filters.channel || record.channel === filters.channel));
  const columns = unique(weekOrders.map((order) => order[filters.dimension]));
  return unique(records.map((record) => record.issue)).map((issue) => {
    const issueRows = weekRecords.filter((record) => record.issue === issue && record[filters.dimension]);
    return {
      issue,
      cells: columns.map((value) => {
        const complaintCount = issueRows.filter((record) => record[filters.dimension] === value).length;
        const complaintShare = issueRows.length === 0 ? 0 : complaintCount / issueRows.length;
        const orderShare = weekOrders.length === 0 ? 0 : weekOrders.filter((order) => order[filters.dimension] === value).length / weekOrders.length;
        return { value, complaintCount, lift: orderShare === 0 ? 0 : complaintShare / orderShare };
      }),
    };
  });
}

function byIssue(
  records: ComplaintRecord[],
  kind: "sentiment",
): { issue: string; negative: number; neutral: number; positive: number }[];
function byIssue(
  records: ComplaintRecord[],
  kind: "severity",
): { issue: string; low: number; medium: number; high: number }[];
function byIssue(records: ComplaintRecord[], kind: "sentiment" | "severity") {
  return unique(records.map((record) => record.issue)).map((issue) => {
    const rows = records.filter((record) => record.issue === issue);
    if (kind === "sentiment") {
      return {
        issue,
        negative: rows.filter((row) => row.sentiment === "negative").length,
        neutral: rows.filter((row) => row.sentiment === "neutral").length,
        positive: rows.filter((row) => row.sentiment === "positive").length,
      };
    }
    return {
      issue,
      low: rows.filter((row) => row.severity === "low").length,
      medium: rows.filter((row) => row.severity === "medium").length,
      high: rows.filter((row) => row.severity === "high").length,
    };
  });
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
