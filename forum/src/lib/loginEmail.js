/**
 * Builds the login-code email. Returns { subject, text, html }.
 * Kept framework-agnostic so it can be unit-tested or reused.
 */
import { CODE_TTL_MS } from './serverAuth.js';

const BRAND = "Dalton's Department of Truth";

export function buildLoginEmail(code) {
    const minutes = Math.round(CODE_TTL_MS / 60000);
    const subject = `${BRAND} Sign in Code`;

    const text =
        `Your ${BRAND} login code is: ${code}\n\n` +
        `Enter it in the forum to sign in. It expires in ${minutes} minutes.\n\n` +
        `If you didn't request this, you can safely ignore this email.`;

    const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px 16px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1d24;">
    <div style="max-width:480px;">
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#2a6f7a;">${BRAND}</p>
      <h1 style="margin:0 0 8px;font-size:20px;color:#1a1d24;">Your login code</h1>
      <p style="margin:0 0 16px;color:#4b5563;font-size:14px;">Enter this code in the forum to sign in.</p>
      <div style="display:inline-block;background:#f3f4f6;border:1px solid #d1d5db;border-radius:10px;padding:16px 28px;font-size:34px;letter-spacing:10px;font-weight:700;color:#1a1d24;font-family:'Courier New',monospace;">
        ${code}
      </div>
      <p style="margin:16px 0 0;color:#6b7280;font-size:12px;">
        This code expires in ${minutes} minutes. If you didn't request it, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>`;

    return { subject, text, html };
}
