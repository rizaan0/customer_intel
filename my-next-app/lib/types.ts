export type Order = {
  orderId: string;
  orderedAt: string;
  product: string;
  warehouse: string;
  partner: string;
  region: string;
};

export type Complaint = {
  id: string;
  text: string;
  createdAt: string;
  channel: string;
  orderId: string;
};

export type Sentiment = "negative" | "neutral" | "positive";
export type Severity = "low" | "medium" | "high";

export type IssueLabel = {
  issue: string;
  sentiment: Sentiment;
  severity: Severity;
  reason: string;
};

export type FactorDimension = "warehouse" | "product" | "partner" | "region";

export type Factor = {
  dimension: FactorDimension;
  value: string;
  complaintShare: number;
  orderShare: number;
  lift: number;
  complaintCount: number;
  qualifies: boolean;
};

export type Example = {
  id: string;
  text: string;
  channel: string;
  createdAt: string;
  orderId: string;
  issue: string;
  sentiment: Sentiment;
  severity: Severity;
  reason: string;
};

export type TrendPoint = {
  week: string;
  count: number;
};

export type Investigation = {
  issue: string;
  slug: string;
  current: number;
  baseline: number;
  ratio: number;
  gmailCount: number;
  trend: TrendPoint[];
  factors: Factor[];
  examples: Example[];
};

export type Alert = {
  issue: string;
  slug: string;
  current: number;
  baseline: number;
  ratio: number;
  gmailCount: number;
  sentiment: Record<Sentiment, number>;
  severity: Record<Severity, number>;
  factor: Factor | null;
  examples: Example[];
};

export type ComplaintRecord = {
  id: string;
  text: string;
  week: string;
  issue: string;
  sentiment: Sentiment;
  severity: Severity;
  channel: string;
  reason: string;
  orderId: string;
  warehouse: string;
  product: string;
  partner: string;
  region: string;
  gmail: boolean;
};

export type OrderFact = {
  week: string;
  warehouse: string;
  product: string;
  partner: string;
  region: string;
};

export type Briefing = {
  generatedAt: string;
  latestWeek: string;
  weeks: string[];
  complaintCount: number;
  orderCount: number;
  gmailCount: number;
  alerts: Alert[];
  investigations: Investigation[];
  records: ComplaintRecord[];
  orderFacts: OrderFact[];
};

export type InboxConnection = {
  method: "oauth" | "app-password";
  email: string;
  refreshToken?: string;
  appPassword?: string;
  label: string;
  connectedAt: string;
};

export type ConnectionStatus = {
  connected: boolean;
  method?: InboxConnection["method"];
  email?: string;
  label?: string;
  googleConfigured: boolean;
};
