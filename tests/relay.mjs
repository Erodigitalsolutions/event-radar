// Relay tests with a fake Resend (no network). node tests/relay.mjs
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.RELAY_SECRET = "test-secret-" + "x".repeat(32);
process.env.RESEND_API_KEY = "re_test";
process.env.PUBLIC_BASE_URL = "https://relay.example";
process.env.FROM_ADDRESS = "Event Radar <radar@radar.example>";

const calls = [];
const contacts = new Map();
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url), method = init.method || "GET", data = init.body ? JSON.parse(init.body) : null;
  calls.push({ path: u.pathname, method, data, auth: init.headers?.Authorization });
  const reply = (status, json) => ({ ok: status < 300, status, json: async () => json });
  if (u.pathname === "/emails") return reply(200, { id: "em_1" });
  if (u.pathname === "/contacts" && method === "POST") { if (contacts.has(data.email)) return reply(409, {}); contacts.set(data.email, { unsubscribed: !!data.unsubscribed }); return reply(200, { id: "c_1" }); }
  const m = u.pathname.match(/^\/contacts\/(.+)$/);
  if (m) { const e = decodeURIComponent(m[1]); if (!contacts.has(e)) return reply(404, {}); if (method === "PATCH") Object.assign(contacts.get(e), { unsubscribed: data.unsubscribed }); return reply(200, { email: e, ...contacts.get(e) }); }
  return reply(404, {});
};

const load = (f) => import(pathToFileURL(path.join(root, "relay/api", f)).href).then((m) => m.default);
const [register, verify, send, unsubscribe] = await Promise.all(["register.js", "verify.js", "send.js", "unsubscribe.js"].map(load));
const call = async (h, { method = "POST", url = "/", json, headers = {} } = {}) => {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
  await h({ method, url, body: json, headers }, res);
  let parsed; try { parsed = JSON.parse(res.body); } catch { parsed = res.body; }
  return { code: res.statusCode, body: parsed };
};
let n = 0;
const ok = async (name, fn) => { await fn(); n++; console.log("ok  " + name); };
const EMAIL = "Person@Example.com";

await ok("register rejects bad emails and sends one confirmation link", async () => {
  assert.equal((await call(register, { json: { email: "nope" } })).code, 400);
  assert.equal((await call(register, { json: { email: EMAIL } })).code, 200);
  const sent = calls.filter((c) => c.path === "/emails").at(-1);
  assert.deepEqual(sent.data.to, ["person@example.com"]);
  assert.match(sent.data.text, /relay\.example\/api\/verify/);
  assert.equal(sent.auth, "Bearer re_test");
});

let link, key;
await ok("verify rejects a tampered link, accepts the real one and shows the key", async () => {
  link = calls.filter((c) => c.path === "/emails").at(-1).data.text.match(/https:\/\/relay\.example(\/api\/verify\?[^\s]+)/)[1];
  assert.equal((await call(verify, { method: "GET", url: link.replace("person%40", "other%40") })).code, 400);
  const r = await call(verify, { method: "GET", url: link });
  assert.equal(r.code, 200);
  key = r.body.match(/<code[^>]*>([^<]+)<\/code>/)[1];
  assert.ok(key.length > 20);
  assert.equal(contacts.get("person@example.com").unsubscribed, false);
});

await ok("send needs the personal key and only mails the owner", async () => {
  assert.equal((await call(send, { json: { email: EMAIL, key: "wrong", subject: "s", text: "t" } })).code, 401);
  // Someone with their own valid key cannot send to another address.
  assert.equal((await call(send, { json: { email: "victim@example.com", key, subject: "s", text: "t" } })).code, 401);
  const r = await call(send, { json: { email: EMAIL, key, subject: "Report\nInjected: x", text: "Hello <b>", attachments: [{ filename: "event-radar.xlsx", content: Buffer.from("PK").toString("base64") }] } });
  assert.equal(r.code, 200);
  const sent = calls.filter((c) => c.path === "/emails").at(-1).data;
  assert.deepEqual(sent.to, ["person@example.com"]);
  assert.ok(!sent.subject.includes("\n"));
  assert.match(sent.headers["List-Unsubscribe"], /api\/unsubscribe/);
  assert.match(sent.html, /&lt;b&gt;/);
  assert.equal(sent.attachments[0].filename, "event-radar.xlsx");
});

await ok("send blocks dangerous attachments and oversized payloads", async () => {
  assert.equal((await call(send, { json: { email: EMAIL, key, subject: "s", text: "t", attachments: [{ filename: "run.exe", content: "AA==" }] } })).code, 400);
  assert.equal((await call(send, { json: { email: EMAIL, key, subject: "s", text: "x".repeat(200_001) } })).code, 413);
});

await ok("unsubscribe stops sending; registering again restores it", async () => {
  const unsub = calls.filter((c) => c.path === "/emails").at(-1).data.headers["List-Unsubscribe"].slice(1, -1).replace("https://relay.example", "");
  assert.equal((await call(unsubscribe, { method: "GET", url: unsub.replace("t=", "t=bad") })).code, 400);
  assert.equal((await call(unsubscribe, { method: "POST", url: unsub })).code, 200);
  assert.equal((await call(send, { json: { email: EMAIL, key, subject: "s", text: "t" } })).code, 403);
  assert.equal((await call(verify, { method: "GET", url: link })).code, 200);
  assert.equal((await call(send, { json: { email: EMAIL, key, subject: "s", text: "t" } })).code, 200);
});

await ok("expired confirmation links are refused", async () => {
  const { mac } = await import(pathToFileURL(path.join(root, "relay/lib/common.js")).href);
  const exp = Date.now() - 1000;
  const r = await call(verify, { method: "GET", url: `/api/verify?e=person%40example.com&x=${exp}&t=${mac(["verify", "person@example.com", exp])}` });
  assert.equal(r.code, 400);
});

await ok("register is rate limited per address", async () => {
  const r = [];
  for (let i = 0; i < 4; i++) r.push((await call(register, { json: { email: "spam@example.com" }, headers: { "x-forwarded-for": "1.2.3." + i } })).code);
  assert.deepEqual(r, [200, 200, 200, 429]);
});

console.log(`\n${n} relay checks passed`);
