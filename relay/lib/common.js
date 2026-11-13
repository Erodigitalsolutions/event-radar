// Shared helpers for the Event Radar email relay. No dependencies (Node >= 18, Vercel serverless).
import crypto from "node:crypto";

export const env = (k) => process.env[k] || "";
export const baseUrl = () => env("PUBLIC_BASE_URL").replace(/\/$/, "");
export const fromAddress = () => env("FROM_ADDRESS") || "Event Radar <radar@erodigitalsolutions.com>";

// Signed tokens: nothing is stored on the server to verify an address or a user key.
export const mac = (parts) => crypto.createHmac("sha256", env("RELAY_SECRET")).update(parts.join("|")).digest("base64url");
export function safeEq(a, b) {
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export const normEmail = (e) => String(e || "").trim().toLowerCase();
export const validEmail = (e) => typeof e === "string" && e.length <= 254 && /^[^\s@<>"',;()\\]+@[^\s@<>"',;()\\]+\.[^\s@<>"',;()\\]+$/.test(e);
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function send(res, code, body, type = "application/json; charset=utf-8") {
  res.statusCode = code;
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", "no-store");
  res.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}
export const page = (res, code, title, html) => send(res, code, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><body style="font-family:system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 16px;line-height:1.5">${html}</body>`, "text/html; charset=utf-8");

export async function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = typeof req.body === "string" ? req.body : "";
  if (!raw) { for await (const c of req) { raw += c; if (raw.length > 4_000_000) break; } }
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

export async function resend(path, { method = "GET", data } = {}) {
  const r = await fetch("https://api.resend.com" + path, {
    method,
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
  let json = null; try { json = await r.json(); } catch { /* empty body */ }
  return { ok: r.ok, status: r.status, data: json };
}

// Best-effort limiter (per warm instance). Resend's own account limits and the signed-key requirement are the real guard rails.
const hits = new Map();
export function limited(key, max, windowMs) {
  const now = Date.now(), list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return true; }
  list.push(now); hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return false;
}
export const clientIp = (req) => String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";

export const unsubscribeUrl = (email) => `${baseUrl()}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${mac(["unsub", email])}`;
