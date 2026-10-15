import type { Complaint } from "./types";

export function complaintFromMail(id: string, subject: string, body: string, date: Date): Complaint {
  const cleaned = stripQuotes(body);
  const text = `${subject}\n${cleaned}`.replace(/\s+\n/g, "\n").trim().slice(0, 4000);
  const order = text.match(/\bOrder\s+#?(\d+)\b/i);
  return {
    id: `gmail-${id}`,
    text,
    createdAt: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
    channel: "email",
    orderId: order?.[1] ?? "",
  };
}

export function stripQuotes(body: string): string {
  const kept: string[] = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^On .+ wrote:\s*$/i.test(line.trim())) break;
    if (line.trim().startsWith(">")) continue;
    kept.push(line);
  }
  return kept.join("\n").trim();
}

export function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
  headers?: { name: string; value: string }[];
};

export function textFromGmailPayload(payload: GmailPart | undefined): { subject: string; body: string } {
  const headers = payload?.headers ?? [];
  const subject = headerValue(headers, "subject");
  const plain = findPart(payload, "text/plain");
  const html = findPart(payload, "text/html");
  const body = plain || html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
  return { subject, body };
}

function headerValue(headers: { name: string; value: string }[], name: string): string {
  return headers.find((header) => header.name.toLowerCase() === name)?.value ?? "";
}

function findPart(part: GmailPart | undefined, mimeType: string): string {
  if (!part) return "";
  if (part.mimeType === mimeType && part.body?.data) return decodeBase64Url(part.body.data);
  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType);
    if (found) return found;
  }
  return "";
}
