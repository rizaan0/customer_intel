import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import path from "path";
import { parseCsv, toCsv } from "./csv";
import { buildBriefing } from "./pipeline";
import { generateDataset } from "./generate";
import type { Briefing, Complaint, ConnectionStatus, InboxConnection, Order } from "./types";

const dataDir = path.join(process.cwd(), "data");
const complaintsPath = path.join(dataDir, "complaints.csv");
const ordersPath = path.join(dataDir, "orders.csv");
const briefingPath = path.join(dataDir, "briefing.json");
const connectionPath = path.join(dataDir, "connection.json");

const COMPLAINT_HEADERS = ["id", "text", "created_at", "channel", "order_id"];
const ORDER_HEADERS = ["order_id", "ordered_at", "product", "warehouse", "partner", "region"];

export function readComplaints(): Complaint[] {
  return parseCsv(readFileSync(complaintsPath, "utf8")).map((row) => ({
    id: row.id ?? "",
    text: row.text ?? "",
    createdAt: row.created_at ?? "",
    channel: row.channel ?? "",
    orderId: row.order_id ?? "",
  }));
}

export function readOrders(): Order[] {
  return parseCsv(readFileSync(ordersPath, "utf8")).map((row) => ({
    orderId: row.order_id ?? "",
    orderedAt: row.ordered_at ?? "",
    product: row.product ?? "",
    warehouse: row.warehouse ?? "",
    partner: row.partner ?? "",
    region: row.region ?? "",
  }));
}

export function readBriefing(): Briefing {
  return JSON.parse(readFileSync(briefingPath, "utf8")) as Briefing;
}

export function writeDataset(complaints: Complaint[], orders: Order[]) {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(complaintsPath, toCsv(COMPLAINT_HEADERS, complaints.map(complaintToRow)));
  writeFileSync(ordersPath, toCsv(ORDER_HEADERS, orders.map(orderToRow)));
}

export function writeComplaints(complaints: Complaint[]) {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(complaintsPath, toCsv(COMPLAINT_HEADERS, complaints.map(complaintToRow)));
}

export function upsertComplaints(incoming: Complaint[]) {
  const current = readComplaints();
  const incomingById = new Map(incoming.map((complaint) => [complaint.id, complaint]));
  const seen = new Set<string>();
  const merged = current.map((complaint) => {
    seen.add(complaint.id);
    return incomingById.get(complaint.id) ?? complaint;
  });
  for (const complaint of incoming) {
    if (!seen.has(complaint.id)) merged.push(complaint);
  }
  writeComplaints(merged);
}

export function rebuildBriefing(): Briefing {
  const briefing = buildBriefing(readComplaints(), readOrders());
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(briefingPath, JSON.stringify(briefing, null, 2));
  return briefing;
}

export function restoreSample(): Briefing {
  const { complaints, orders } = generateDataset();
  writeDataset(complaints, orders);
  return rebuildBriefing();
}

export function complaintsFromCsv(text: string): Complaint[] {
  const rows = parseCsv(text);
  assertHeaders(rows, ["id", "text", "created_at", "channel", "order_id"], "complaints");
  return rows.map((row) => ({
    id: row.id.trim(),
    text: row.text.trim(),
    createdAt: row.created_at.trim(),
    channel: row.channel.trim(),
    orderId: row.order_id.trim(),
  }));
}

export function ordersFromCsv(text: string): Order[] {
  const rows = parseCsv(text);
  assertHeaders(rows, ORDER_HEADERS, "orders");
  return rows.map((row) => ({
    orderId: row.order_id.trim(),
    orderedAt: row.ordered_at.trim(),
    product: row.product.trim(),
    warehouse: row.warehouse.trim(),
    partner: row.partner.trim(),
    region: row.region.trim(),
  }));
}

export function readConnection(): InboxConnection | null {
  if (!existsSync(connectionPath)) return null;
  return JSON.parse(readFileSync(connectionPath, "utf8")) as InboxConnection;
}

export function writeConnection(connection: InboxConnection) {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(connectionPath, JSON.stringify(connection, null, 2));
}

export function clearConnection() {
  if (existsSync(connectionPath)) unlinkSync(connectionPath);
}

export function connectionStatus(): ConnectionStatus {
  const connection = readConnection();
  return {
    connected: connection !== null,
    method: connection?.method,
    email: connection?.email,
    label: connection?.label,
    googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  };
}

function assertHeaders(rows: Record<string, string>[], headers: string[], name: string) {
  if (rows.length === 0) {
    throw new Error(`The ${name} file has no rows.`);
  }
  const present = Object.keys(rows[0]);
  const missing = headers.filter((header) => !present.includes(header));
  if (missing.length > 0) {
    throw new Error(`The ${name} file is missing columns: ${missing.join(", ")}.`);
  }
}

function complaintToRow(complaint: Complaint): Record<string, string> {
  return {
    id: complaint.id,
    text: complaint.text,
    created_at: complaint.createdAt,
    channel: complaint.channel,
    order_id: complaint.orderId,
  };
}

function orderToRow(order: Order): Record<string, string> {
  return {
    order_id: order.orderId,
    ordered_at: order.orderedAt,
    product: order.product,
    warehouse: order.warehouse,
    partner: order.partner,
    region: order.region,
  };
}
