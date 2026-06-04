/**
 * Builds the login-code email. Returns { subject, text, html }.
 * Kept framework-agnostic so it can be unit-tested or reused.
 */
import { CODE_TTL_MS } from './serverAuth.js';

const BRAND = "Dalton's Department of Truth";

export function buildLoginEmail(code) {
    const minutes = Math.round(CODE_TTL_MS / 60000);
    const subject = `${code} is your ${BRAND} login code`;

    const text =
        `Your ${BRAND} login code is: ${code}\n\n` +
        `Enter it in the forum to sign in. It expires in ${minutes} minutes.\n\n` +
        `If you didn't request this, you can safely ignore this email.`;

    const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b0c10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0c10;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#15171c;border:1px solid #2a2d34;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px;text-align:center;">
                <span style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#7fd4e0;">${BRAND}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 4px;text-align:center;">
                <h1 style="margin:0;font-size:20px;color:#f5f7fa;">Your login code</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px;text-align:center;">
                <p style="margin:0;color:#aab1bd;font-size:14px;">Enter this code in the forum to sign in.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;text-align:center;">
                <div style="display:inline-block;background:#0b0c10;border:1px solid #2a2d34;border-radius:10px;padding:16px 28px;font-size:34px;letter-spacing:10px;font-weight:700;color:#7fd4e0;font-family:'Courier New',monospace;">
                  ${code}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 32px 28px;text-align:center;">
                <p style="margin:0;color:#6b7280;font-size:12px;">
                  This code expires in ${minutes} minutes. If you didn't request it, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    return { subject, text, html };
}
