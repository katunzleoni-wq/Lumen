import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/contact/route";

const validPayload = {
  name: "Leitora",
  email: "leitora@lumen.test",
  message: "Uma mensagem suficientemente longa para o teste.",
  locale: "pt",
  company: "",
};

function request() {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validPayload),
  });
}

describe("contact route", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_ENABLED", "false");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CONTACT_TO_EMAIL", "");
    vi.stubEnv("CONTACT_FROM_EMAIL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("stays disabled until a provider is configured", async () => {
    const response = await POST(request());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: "contact_not_configured" });
  });

  it("delivers through Resend when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_ENABLED", "true");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_TO_EMAIL", "contato@lumen.test");
    vi.stubEnv("CONTACT_FROM_EMAIL", "Lumen <no-reply@lumen.test>");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledOnce();

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.to).toEqual(["contato@lumen.test"]);
    expect(body.from).toBe("Lumen <no-reply@lumen.test>");
    expect(body.reply_to).toBe("leitora@lumen.test");
  });
});
