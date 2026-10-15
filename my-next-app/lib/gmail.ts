import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { complaintFromMail, textFromGmailPayload } from "./mail-text";
import { readConnection, rebuildBriefing, upsertComplaints, writeConnection } from "./store";
import type { Complaint, InboxConnection } from "./types";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export function googleRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/gmail/callback";
}

export function googleAuthUrl(state: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function saveOauthConnection(code: string) {
  const token = await requestToken({
    code,
    grant_type: "authorization_code",
    redirect_uri: googleRedirectUri(),
  });
  if (!token.refresh_token) {
    throw new Error("Google did not return a refresh token. Disconnect the app in the Google account and connect again.");
  }
  const profile = await gmailGet<{ emailAddress?: string }>(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    token.access_token,
  );
  writeConnection({
    method: "oauth",
    email: profile.emailAddress ?? "",
    refreshToken: token.refresh_token,
    label: "complaints",
    connectedAt: new Date().toISOString(),
  });
}

export async function importInbox(): Promise<number> {
  const connection = readConnection();
  if (!connection) throw new Error("Connect a support inbox in Settings first.");
  const complaints = connection.method === "oauth" ? await readOauth(connection) : await readImap(connection);
  upsertComplaints(complaints);
  rebuildBriefing();
  return complaints.length;
}

async function readOauth(connection: InboxConnection): Promise<Complaint[]> {
  if (!connection.refreshToken) throw new Error("The Gmail connection is missing a refresh token.");
  const token = await requestToken({
    refresh_token: connection.refreshToken,
    grant_type: "refresh_token",
  });
  const ids: string[] = [];
  let pageToken = "";
  do {
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    url.searchParams.set("q", `label:${connection.label}`);
    url.searchParams.set("maxResults", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const page = await gmailGet<{ messages?: { id: string }[]; nextPageToken?: string }>(url.toString(), token.access_token);
    ids.push(...(page.messages ?? []).map((message) => message.id));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken && ids.length < 200);

  const complaints: Complaint[] = [];
  for (const id of ids) {
    const message = await gmailGet<{
      id: string;
      internalDate?: string;
      payload?: Parameters<typeof textFromGmailPayload>[0];
    }>(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, token.access_token);
    const { subject, body } = textFromGmailPayload(message.payload);
    const date = message.internalDate ? new Date(Number(message.internalDate)) : new Date();
    complaints.push(complaintFromMail(message.id, subject, body, date));
  }
  return complaints;
}

async function readImap(connection: InboxConnection): Promise<Complaint[]> {
  if (!connection.appPassword) throw new Error("The app password is missing. Save it again in Settings.");
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: connection.email,
      pass: connection.appPassword.replace(/\s+/g, ""),
    },
    logger: false,
  });
  await client.connect();
  try {
    const lock = await client.getMailboxLock(connection.label);
    try {
      if (!client.mailbox || client.mailbox.exists === 0) return [];
      const complaints: Complaint[] = [];
      for await (const message of client.fetch("1:*", { source: true, uid: true })) {
        if (!message.source) continue;
        const parsed = await simpleParser(message.source.toString("utf8"));
        complaints.push(
          complaintFromMail(
            String(message.uid),
            parsed.subject ?? "",
            parsed.text ?? "",
            parsed.date ?? new Date(),
          ),
        );
      }
      return complaints;
    } finally {
      lock.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read the inbox.";
    if (/mailbox|does not exist|not found/i.test(message)) {
      throw new Error(`Create a Gmail label named "${connection.label}" and put the support messages there.`);
    }
    throw new Error(message);
  } finally {
    await client.logout();
  }
}

async function requestToken(fields: Record<string, string>): Promise<{ access_token: string; refresh_token?: string }> {
  if (!googleConfigured()) {
    throw new Error("The server is missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
  }
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    ...fields,
  });
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body });
  const payload = (await response.json()) as { access_token?: string; refresh_token?: string; error_description?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Google refused the token request.");
  }
  return { access_token: payload.access_token, refresh_token: payload.refresh_token };
}

async function gmailGet<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Gmail could not be read.");
  }
  return payload;
}
