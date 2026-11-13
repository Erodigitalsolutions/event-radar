// GET (link in the email) or POST (one-click, RFC 8058) ?e&t: stops all emails to this address.
import { send, page, mac, safeEq, normEmail, validEmail, esc, resend } from "../lib/common.js";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const email = normEmail(url.searchParams.get("e")), t = url.searchParams.get("t") || "";
  if (!validEmail(email) || !safeEq(t, mac(["unsub", email])))
    return page(res, 400, "Invalid link", "<h1>This link is not valid</h1>");
  const r = await resend(`/contacts/${encodeURIComponent(email)}`, { method: "PATCH", data: { unsubscribed: true } });
  if (req.method === "POST") return send(res, r.ok || r.status === 404 ? 200 : 502, { ok: r.ok });
  if (!r.ok && r.status !== 404) return page(res, 502, "Error", "<h1>Something went wrong</h1><p>Please try again later.</p>");
  return page(res, 200, "Unsubscribed", `<h1>Done</h1><p><b>${esc(email)}</b> will not receive more Event Radar emails.</p><p>To receive them again, ask Claude to register your email.</p>`);
}
