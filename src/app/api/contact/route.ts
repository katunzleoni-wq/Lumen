import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_CONTACT_ENABLED !== "true") {
    return NextResponse.json({ ok: false, error: "contact_disabled" }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "validation_error",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  if (parsed.data.company) {
    // Honeypot filled: acknowledge without storing.
    return NextResponse.json({ ok: true });
  }

  const record = {
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    locale: parsed.data.locale,
    receivedAt: new Date().toISOString(),
  };

  try {
    const directory = join(process.cwd(), ".data");
    await mkdir(directory, { recursive: true });
    await appendFile(join(directory, "contact.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[contact] could not persist message", error);
    return NextResponse.json({ ok: false, error: "storage_error" }, { status: 500 });
  }
}
