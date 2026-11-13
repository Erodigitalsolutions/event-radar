// GET ?e&x&t: proves the person controls the address, registers it and shows their personal key.
import { send, page, mac, safeEq, normEmail, validEmail, esc, unsubscribeUrl } from "../lib/common.js";
import { subscribe } from "../lib/db.js";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const email = normEmail(url.searchParams.get("e")), exp = Number(url.searchParams.get("x")), t = url.searchParams.get("t") || "";
  if (!validEmail(email) || !Number.isFinite(exp) || exp < Date.now() || !safeEq(t, mac(["verify", email, exp])))
    return page(res, 400, "Link expired", "<h1>This link is invalid or expired</h1><p>Ask Claude to register your email again to get a new link.</p>");

  try { await subscribe(email); } catch { return page(res, 502, "Error", "<h1>Something went wrong</h1><p>Please try again in a few minutes.</p>"); }

  const key = mac(["key", email]);
  return page(res, 200, "Email confirmed", `<h1>Email confirmed</h1>
<p>Your personal key (copy it and paste it to Claude when it asks):</p>
<p><code style="word-break:break-all;background:#eee;padding:8px;display:block">${esc(key)}</code></p>
<p>Event Radar can now email reports to <b>${esc(email)}</b> only, never to anyone else. The reports are not stored on our server.</p>
<p><a href="${esc(unsubscribeUrl(email))}">Stop receiving these emails</a></p>`);
}
