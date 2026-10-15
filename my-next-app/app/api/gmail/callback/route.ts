import { cookies } from "next/headers";
import { saveOauthConnection } from "@/lib/gmail";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  if (oauthError || !code) {
    return Response.redirect(new URL("/settings?error=oauth-denied", origin));
  }
  const jar = await cookies();
  if (!state || jar.get("gmail_oauth_state")?.value !== state) {
    return Response.redirect(new URL("/settings?error=oauth-state", origin));
  }
  jar.delete("gmail_oauth_state");
  try {
    await saveOauthConnection(code);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const key = message.includes("refresh token") ? "no-refresh" : "oauth-denied";
    return Response.redirect(new URL(`/settings?error=${key}`, origin));
  }
  return Response.redirect(new URL("/settings?connected=1", origin));
}
