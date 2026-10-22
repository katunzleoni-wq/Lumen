import { describe, expect, it } from "vitest";
import { contactSchema, newsletterSchema } from "@/lib/schemas";

describe("newsletterSchema", () => {
  it("normalizes and accepts a valid email", () => {
    const result = newsletterSchema.safeParse({ email: "  leitora@lumen.test  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("leitora@lumen.test");
  });

  it("rejects invalid addresses", () => {
    expect(newsletterSchema.safeParse({ email: "não-é-email" }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  const valid = {
    name: "Maria",
    email: "maria@example.com",
    message: "Gostaria de sugerir uma nova edição para o acervo.",
    locale: "pt",
  };

  it("accepts a complete message", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects short messages and malformed email", () => {
    expect(contactSchema.safeParse({ ...valid, message: "curta" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, email: "invalido" }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, company: "bot" }).success).toBe(false);
  });
});
