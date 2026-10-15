import { writeConnection } from "@/lib/store";

export async function POST(request: Request) {
  let body: { email?: string; appPassword?: string };
  try {
    body = (await request.json()) as { email?: string; appPassword?: string };
  } catch {
    return Response.json({ error: "Send the support address and app password as JSON." }, { status: 400 });
  }
  const email = (body.email ?? "").trim();
  const appPassword = (body.appPassword ?? "").replace(/\s+/g, "");
  if (!email.includes("@") || appPassword.length < 8) {
    return Response.json(
      { error: "Enter the support address and the app password from the Google account security page." },
      { status: 400 },
    );
  }
  writeConnection({
    method: "app-password",
    email,
    appPassword,
    label: "complaints",
    connectedAt: new Date().toISOString(),
  });
  return Response.json({ ok: true, email });
}
