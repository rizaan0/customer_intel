import { cookies } from "next/headers";
import { googleAuthUrl, googleConfigured } from "@/lib/gmail";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!googleConfigured()) {
    return Response.redirect(new URL("/settings?error=missing-google-config", origin));
  }
  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("gmail_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return Response.redirect(googleAuthUrl(state));
}
