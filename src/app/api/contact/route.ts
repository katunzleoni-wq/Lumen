import { NextResponse } from "next/server";
import { isContactConfigured } from "@/lib/contact";
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

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

export async function POST(request: Request) {
  if (!isContactConfigured()) {
    return NextResponse.json({ ok: false, error: "contact_not_configured" }, { status: 503 });
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
    // Honeypot filled: acknowledge without sending.
    return NextResponse.json({ ok: true });
  }

  const { name, email, message, locale } = parsed.data;
  const recipients = (process.env.CONTACT_TO_EMAIL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return NextResponse.json({ ok: false, error: "contact_not_configured" }, { status: 503 });
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL,
        to: recipients,
        reply_to: email,
        subject: `[Lumen] Contato — ${name}`,
        html: `
          <div style="font-family: Georgia, serif; color: #1f2937; line-height: 1.7;">
            <h2 style="font-size: 20px;">Nova mensagem pelo Lumen</h2>
            <p><strong>Nome:</strong> ${safeName}<br />
            <strong>E-mail:</strong> ${safeEmail}<br />
            <strong>Idioma:</strong> ${escapeHtml(locale)}</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb;" />
            <p>${safeMessage}</p>
          </div>
        `,
        text: `Nova mensagem pelo Lumen\n\nNome: ${name}\nE-mail: ${email}\nIdioma: ${locale}\n\n${message}`,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("[contact] Resend rejected the message", response.status);
      return NextResponse.json({ ok: false, error: "delivery_error" }, { status: 502 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[contact] could not deliver message", error);
    return NextResponse.json({ ok: false, error: "delivery_error" }, { status: 502 });
  }
}
