import { issueSlug, labelComplaint } from "./label";
import type {
  Alert,
  Briefing,
  Complaint,
  Example,
  Factor,
  FactorDimension,
  Investigation,
  Order,
  Sentiment,
  Severity,
} from "./types";
import { weekStart } from "./weeks";

export const SPIKE_RATIO = 1.5;
export const MIN_SPIKE_COUNT = 8;
export const MIN_LIFT = 2;
export const MIN_FACTOR_COUNT = 5;
const DIMENSIONS: FactorDimension[] = ["warehouse", "product", "partner", "region"];

function complaintWeek(complaint: Complaint, ordersById: Map<string, Order>): string {
  const order = ordersById.get(complaint.orderId);
  if (order) return weekStart(order.orderedAt);
  return weekStart(complaint.createdAt);
}

export function buildBriefing(complaints: Complaint[], orders: Order[]): Briefing {
  const ordersById = new Map(orders.map((order) => [order.orderId, order]));
  const labeled = complaints.map((complaint) => ({
    complaint,
    label: labelComplaint(complaint.text),
    week: complaintWeek(complaint, ordersById),
  }));
  const orderWeeks = [...new Set(orders.map((order) => weekStart(order.orderedAt)))].sort();
  const latestWeek = orderWeeks[orderWeeks.length - 1] ?? "";
  const latestIndex = orderWeeks.indexOf(latestWeek);
  const previousWeeks = orderWeeks.slice(Math.max(0, latestIndex - 4), latestIndex);
  const weeks = [...new Set([...orderWeeks, ...labeled.map((row) => row.week)])].sort();
  const issues = [...new Set(labeled.map((row) => row.label.issue))];

  const investigations = issues
    .map((issue) =>
      investigate(issue, labeled, orders, ordersById, weeks, latestWeek, previousWeeks),
    )
    .sort((a, b) => b.ratio - a.ratio || b.current - a.current);

  const alerts: Alert[] = investigations
    .filter((item) => item.current >= MIN_SPIKE_COUNT && item.ratio >= SPIKE_RATIO)
    .slice(0, 3)
    .map((item) => ({
      issue: item.issue,
      slug: item.slug,
      current: item.current,
      baseline: item.baseline,
      ratio: item.ratio,
      gmailCount: item.gmailCount,
      sentiment: countSentiment(labeled, item.issue, latestWeek),
      severity: countSeverity(labeled, item.issue, latestWeek),
      factor: item.factors.find((factor) => factor.qualifies) ?? null,
      examples: item.examples,
    }));

  return {
    generatedAt: new Date().toISOString(),
    latestWeek,
    weeks,
    complaintCount: complaints.length,
    orderCount: orders.length,
    gmailCount: complaints.filter((complaint) => complaint.id.startsWith("gmail-")).length,
    alerts,
    investigations,
    records: labeled.map((row) => {
      const order = ordersById.get(row.complaint.orderId);
      return {
        id: row.complaint.id,
        text: row.complaint.text,
        week: row.week,
        issue: row.label.issue,
        sentiment: row.label.sentiment,
        severity: row.label.severity,
        channel: row.complaint.channel,
        reason: row.label.reason,
        orderId: row.complaint.orderId,
        warehouse: order?.warehouse ?? "",
        product: order?.product ?? "",
        partner: order?.partner ?? "",
        region: order?.region ?? "",
        gmail: row.complaint.id.startsWith("gmail-"),
      };
    }),
    orderFacts: orders.map((order) => ({
      week: weekStart(order.orderedAt),
      warehouse: order.warehouse,
      product: order.product,
      partner: order.partner,
      region: order.region,
    })),
  };
}

type Labeled = {
  complaint: Complaint;
  label: ReturnType<typeof labelComplaint>;
  week: string;
};

function investigate(
  issue: string,
  labeled: Labeled[],
  orders: Order[],
  ordersById: Map<string, Order>,
  weeks: string[],
  latestWeek: string,
  previousWeeks: string[],
): Investigation {
  const rows = labeled.filter((row) => row.label.issue === issue);
  const trend = weeks.map((week) => ({
    week,
    count: rows.filter((row) => row.week === week).length,
  }));
  const currentRows = rows.filter((row) => row.week === latestWeek);
  const current = currentRows.length;
  const baselineTotal = previousWeeks.reduce(
    (sum, week) => sum + rows.filter((row) => row.week === week).length,
    0,
  );
  const baseline = previousWeeks.length === 0 ? 0 : baselineTotal / previousWeeks.length;
  const ratio = baseline === 0 ? (current > 0 ? Number.POSITIVE_INFINITY : 0) : current / baseline;
  const weekOrders = orders.filter((order) => weekStart(order.orderedAt) === latestWeek);
  const factors = DIMENSIONS.flatMap((dimension) =>
    factorsFor(dimension, currentRows, weekOrders, ordersById),
  )
    .filter((factor) => factor.complaintCount > 0)
    .sort((a, b) => b.lift - a.lift || b.complaintCount - a.complaintCount);
  const top = factors.find((factor) => factor.qualifies) ?? null;

  return {
    issue,
    slug: issueSlug(issue),
    current,
    baseline,
    ratio,
    gmailCount: currentRows.filter((row) => row.complaint.id.startsWith("gmail-")).length,
    trend,
    factors,
    examples: examplesFor(currentRows, ordersById, top),
  };
}

function factorsFor(
  dimension: FactorDimension,
  rows: Labeled[],
  weekOrders: Order[],
  ordersById: Map<string, Order>,
): Factor[] {
  const matched = rows.flatMap((row) => {
    const order = ordersById.get(row.complaint.orderId);
    return order ? [order] : [];
  });
  const values = [...new Set(weekOrders.map((order) => order[dimension]))];
  return values.map((value) => {
    const complaintCount = matched.filter((order) => order[dimension] === value).length;
    const complaintShare = matched.length === 0 ? 0 : complaintCount / matched.length;
    const orderCount = weekOrders.filter((order) => order[dimension] === value).length;
    const orderShare = weekOrders.length === 0 ? 0 : orderCount / weekOrders.length;
    const lift = orderShare === 0 ? 0 : complaintShare / orderShare;
    return {
      dimension,
      value,
      complaintShare,
      orderShare,
      lift,
      complaintCount,
      qualifies: complaintCount >= MIN_FACTOR_COUNT && lift >= MIN_LIFT,
    };
  });
}

function examplesFor(rows: Labeled[], ordersById: Map<string, Order>, factor: Factor | null): Example[] {
  const matching = factor
    ? rows.filter((row) => ordersById.get(row.complaint.orderId)?.[factor.dimension] === factor.value)
    : rows;
  return [...matching]
    .sort((a, b) => Number(b.complaint.id.startsWith("gmail-")) - Number(a.complaint.id.startsWith("gmail-")))
    .slice(0, 5)
    .map((row) => ({
      id: row.complaint.id,
      text: row.complaint.text,
      channel: row.complaint.channel,
      createdAt: row.complaint.createdAt,
      orderId: row.complaint.orderId,
      issue: row.label.issue,
      sentiment: row.label.sentiment,
      severity: row.label.severity,
      reason: row.label.reason,
    }));
}

function countSentiment(rows: Labeled[], issue: string, week: string): Record<Sentiment, number> {
  const counts: Record<Sentiment, number> = { negative: 0, neutral: 0, positive: 0 };
  for (const row of rows) {
    if (row.label.issue === issue && row.week === week) counts[row.label.sentiment] += 1;
  }
  return counts;
}

function countSeverity(rows: Labeled[], issue: string, week: string): Record<Severity, number> {
  const counts: Record<Severity, number> = { low: 0, medium: 0, high: 0 };
  for (const row of rows) {
    if (row.label.issue === issue && row.week === week) counts[row.label.severity] += 1;
  }
  return counts;
}
