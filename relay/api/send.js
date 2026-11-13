// POST {email, key, subject, text, html?, attachments?}: emails a report to the verified person themselves.
// The recipient is always `email`; the personal key proves who is asking. Content is never stored here.
import { body, send, mac, safeEq, fromAddress, normEmail, validEmail, esc, resend, limited, unsubscribeUrl } from "../lib/common.js";

const ALLOWED_EXT = /\.(xlsx|csv|md|txt|ics|pdf|json)$/i;
const MAX_TEXT = 200_000, MAX_ATTACH_BYTES = 3_000_000;

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  const b = await body(req);
  const email = normEmail(b.email);
  if (!validEmail(email)) return send(res, 400, { error: "invalid email" });
  if (!b.key || !safeEq(b.key, mac(["key", email]))) return send(res, 401, { error: "invalid key" });
  if (limited("send:" + email, 30, 24 * 3600_000)) return send(res, 429, { error: "daily limit reached" });

  const subject = String(b.subject || "").replace(/[\r\n]+/g, " ").slice(0, 200);
  const text = String(b.text || "");
  if (!subject || !text) return send(res, 400, { error: "subject and text are required" });
  if (text.length > MAX_TEXT || String(b.html || "").length > MAX_TEXT) return send(res, 413, { error: "message too large" });

  const attachments = [];
  let bytes = 0;
  for (const a of Array.isArray(b.attachments) ? b.attachments.slice(0, 4) : []) {
    const filename = String(a.filename || "").replace(/[^\w.\- ]/g, "_").slice(0, 80);
    if (!ALLOWED_EXT.test(filename) || typeof a.content !== "string") return send(res, 400, { error: "attachment type not allowed" });
    bytes += Math.floor(a.content.length * 0.75);
    attachments.push({ filename, content: a.content });
  }
  if (bytes > MAX_ATTACH_BYTES) return send(res, 413, { error: "attachments too large" });

  // The person must still be registered and not unsubscribed.
  const c = await resend(`/contacts/${encodeURIComponent(email)}`);
  if (!c.ok || c.data?.unsubscribed) return send(res, 403, { error: "address not registered or unsubscribed" });

  const unsub = unsubscribeUrl(email);
  const html = b.html ? String(b.html) : `<div style="font-family:system-ui,sans-serif;line-height:1.5;white-space:pre-wrap">${esc(text)}</div>`;
  const r = await resend("/emails", {
    method: "POST",
    data: {
      from: fromAddress(), to: [email], subject,
      text: `${text}\n\n--\nYou get this because you registered for Event Radar. Stop receiving: ${unsub}`,
      html: `${html}<hr><p style="font-size:12px;color:#666">You get this because you registered for Event Radar. <a href="${esc(unsub)}">Stop receiving these emails</a></p>`,
      headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      attachments: attachments.length ? attachments : undefined,
    },
  });
  if (!r.ok) return send(res, 502, { error: "email provider rejected the message" });
  return send(res, 200, { ok: true, id: r.data?.id });
}
