// GET (link in the email) or POST (one-click, RFC 8058) ?e&t: stops all emails to this address.
import { send, page, mac, safeEq, normEmail, validEmail, esc } from "../lib/common.js";
import { unsubscribe } from "../lib/db.js";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const email = normEmail(url.searchParams.get("e")), t = url.searchParams.get("t") || "";
  if (!validEmail(email) || !safeEq(t, mac(["unsub", email])))
    return page(res, 400, "Invalid link", "<h1>This link is not valid</h1>");
  let ok = true;
  try { await unsubscribe(email); } catch { ok = false; }
  if (req.method === "POST") return send(res, ok ? 200 : 502, { ok });
  if (!ok) return page(res, 502, "Error", "<h1>Something went wrong</h1><p>Please try again later.</p>");
  return page(res, 200, "Unsubscribed", `<h1>Done</h1><p><b>${esc(email)}</b> will not receive more Event Radar emails.</p><p>To receive them again, ask Claude to register your email.</p>`);
}
