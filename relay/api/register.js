// POST {email}: sends a confirmation link. Nothing is stored until the person clicks it.
import { body, send, mac, baseUrl, fromAddress, normEmail, validEmail, esc, resend, limited, clientIp } from "../lib/common.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  const email = normEmail((await body(req)).email);
  if (!validEmail(email)) return send(res, 400, { error: "invalid email" });
  if (limited("ip:" + clientIp(req), 20, 3600_000) || limited("reg:" + email, 3, 3600_000)) return send(res, 429, { error: "too many requests, try again later" });

  const exp = Date.now() + 24 * 3600_000;
  const link = `${baseUrl()}/api/verify?e=${encodeURIComponent(email)}&x=${exp}&t=${mac(["verify", email, exp])}`;
  const r = await resend("/emails", {
    method: "POST",
    data: {
      from: fromAddress(), to: [email], subject: "Confirm your email for Event Radar",
      text: `Someone (hopefully you) asked to receive Event Radar reports at this address.\n\nConfirm here (valid 24 hours): ${link}\n\nIf it wasn't you, ignore this email and nothing will be sent.`,
      html: `<p>Someone (hopefully you) asked to receive Event Radar reports at this address.</p><p><a href="${esc(link)}">Confirm my email</a> (valid 24 hours)</p><p>If it wasn't you, ignore this email and nothing will be sent.</p>`,
    },
  });
  if (!r.ok) return send(res, 502, { error: "could not send confirmation email" });
  // Same answer whether or not the address was already registered.
  return send(res, 200, { ok: true, message: "Check your inbox and click the confirmation link." });
}
