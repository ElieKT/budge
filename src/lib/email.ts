/**
 * Transactional email. Real delivery requires RESEND_API_KEY (see
 * .env.example) — without it, this logs the message to the server console
 * instead of sending it. That console fallback is a development-only
 * stand-in, not a working delivery mechanism: it is not visible to real
 * users, so password reset in a production deployment without RESEND_API_KEY
 * configured is effectively non-functional and should be treated as an
 * outstanding setup dependency, not a completed feature.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Budge <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      `[email:dev-fallback] RESEND_API_KEY is not set. Password reset link for ${to}:\n${resetUrl}`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Reset your Budge password",
      html: `<p>Someone requested a password reset for this email address.</p>
<p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send password reset email (${res.status}): ${body}`);
  }
}
