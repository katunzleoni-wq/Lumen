export function isContactConfigured() {
  return (
    process.env.NEXT_PUBLIC_CONTACT_ENABLED === "true" &&
    Boolean(process.env.RESEND_API_KEY) &&
    Boolean(process.env.CONTACT_TO_EMAIL) &&
    Boolean(process.env.CONTACT_FROM_EMAIL)
  );
}
