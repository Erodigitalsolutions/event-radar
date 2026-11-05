// Smoke test: runs every script command against the fictional examples. Node >= 18, no dependencies.
//   node tests/smoke.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const script = path.join(root, "skills/event-radar/scripts/event-radar.mjs");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "event-radar-"));
const ev = path.join(tmp, "events.json");
const people = path.join(root, "examples/people.example.json");
const incoming = path.join(root, "examples/incoming.example.json");
const TODAY = ["--today", "2026-10-29"];
let n = 0;

const run = (...a) => execFileSync(process.execPath, [script, ...a.map(String)], { encoding: "utf8" });
const ok = (name, fn) => { fn(); n++; console.log("ok  " + name); };
const events = () => JSON.parse(fs.readFileSync(ev, "utf8")).events;
const byName = (s) => events().find((e) => e.name.includes(s));

fs.writeFileSync(ev, JSON.stringify({ schema_version: 1, events: [] }));

ok("merge adds events", () => { assert.equal(JSON.parse(run("merge", "--events", ev, "--incoming", incoming, ...TODAY)).added, 3); });
ok("merge is idempotent (no duplicates)", () => { run("merge", "--events", ev, "--incoming", incoming, ...TODAY); assert.equal(events().length, 3); });
ok("same URL with different name is a different event", () => {
  const inc = path.join(tmp, "inc.json");
  fs.writeFileSync(inc, JSON.stringify({ events: [{ name: "Session A", url: "https://x.example/events" }, { name: "Session B", url: "https://x.example/events" }] }));
  run("merge", "--events", ev, "--incoming", inc, ...TODAY);
  assert.equal(events().length, 5);
});
ok("score skips the long list, filters past events", () => {
  run("status", "--events", ev, "--ids", events().map((e) => e.id).join(","), "--set", "shortlisted");
  const r = JSON.parse(run("score", "--events", ev, "--goal", "customers", ...TODAY));
  assert.ok(r.scored >= 2);
  assert.equal(byName("Old Meetup").status, "filtered");
  assert.equal(byName("Example Retail Expo").status, "candidate");
});
ok("budget never filters: expensive event still scored", () => {
  const e = byName("Example Retail Expo"); e.cost_estimate = { currency: "CAD", min: 99999, max: 99999, price_known: true };
  fs.writeFileSync(ev, JSON.stringify({ schema_version: 1, events: events() }));
  run("score", "--events", ev, "--goal", "customers", ...TODAY);
  assert.ok(byName("Example Retail Expo").score > 40);
});
ok("report md and csv", () => {
  const md = run("report", "--events", ev, "--lang", "en", "--caps", '{"1":150}', ...TODAY);
  assert.match(md, /Ranking/);
  assert.match(run("report", "--events", ev, "--format", "csv", ...TODAY), /^name,score/);
});
ok("longlist groups and numbers", () => { assert.match(run("longlist", "--events", ev, "--status", "candidate", "--lang", "en", ...TODAY), /\| 1 \|/); });
ok("dossier + contacts", () => {
  const id = byName("Example Retail Expo").id;
  assert.match(run("dossier", "--events", ev, "--id", id, "--people", people, "--lang", "en"), /Alex Example/);
  assert.match(run("contacts", "--people", people, "--events", ev), /Alex Example/);
});
ok("reminders respect status (attending only gets 14/7 days)", () => {
  const id = byName("Example Retail Expo").id;
  run("status", "--events", ev, "--ids", id, "--set", "attending");
  const r = run("reminders", "--events", ev, "--registered-days", "14,7", "--window-days", "400", ...TODAY);
  assert.match(r, /14|week/i);
});
ok("ics + digest", () => {
  const f = path.join(tmp, "r.ics");
  run("ics", "--events", ev, "--out", f, ...TODAY);
  assert.match(fs.readFileSync(f, "utf8"), /BEGIN:VCALENDAR/);
  assert.match(run("digest", "--events", ev, "--lang", "en", ...TODAY), /What's coming/);
});
ok("crm preserves the user's sheet edits", () => {
  const d1 = path.join(tmp, "o1"), d2 = path.join(tmp, "o2");
  run("crm", "--events", ev, "--people", people, "--out-dir", d1);
  const csv = fs.readFileSync(path.join(d1, "crm-contacts.csv"), "utf8").split("\n");
  csv[1] = csv[1].replace(/to-contact,[^\n]*$/, 'contacted,2026-11-01,2027-03-20,send deck,"Met, said ""call me"""');
  const edited = path.join(tmp, "edited.csv"); fs.writeFileSync(edited, csv.join("\n"));
  run("crm", "--events", ev, "--people", people, "--existing", edited, "--out-dir", d2);
  assert.match(fs.readFileSync(path.join(d2, "crm-contacts.csv"), "utf8"), /contacted,2026-11-01,2027-03-20,send deck,"Met, said ""call me"""/);
});
ok("export builds the delivery package (xlsx with 5 tabs, report, ics, digest)", () => {
  const d = path.join(tmp, "pkg");
  run("export", "--events", ev, "--people", people, "--out-dir", d, "--lang", "en", ...TODAY);
  for (const f of ["event-radar.xlsx", "report.md", "report.csv", "reminders.ics", "digest.md", "crm-sheet.json", "crm-prices.csv", "crm-timeline.csv"]) assert.ok(fs.existsSync(path.join(d, f)), f);
  const x = fs.readFileSync(path.join(d, "event-radar.xlsx"));
  assert.equal(x.slice(0, 2).toString(), "PK");
  const wb = JSON.parse(fs.readFileSync(path.join(d, "crm-sheet.json"), "utf8"));
  assert.deepEqual(Object.keys(wb.tabs), ["Events", "Prices", "Timeline", "Scores", "Contacts"]);
});
ok("outcome + post-event + learn", () => {
  const id = byName("Example Retail Expo").id;
  const o = JSON.parse(run("outcome", "--events", ev, "--id", id, "--decision", "attended", "--rating", 5, "--leads", 4, "--cost-actual", 800, "--currency", "CAD", "--today", "2027-03-13"));
  assert.equal(o.status, "attended");
  assert.match(run("post-event", "--events", ev, "--id", id, "--people", people, "--lang", "en"), /Contacts to follow up/);
  assert.equal(JSON.parse(run("learn", "--events", ev, "--goal", "customers")).attended, 1);
  run("score", "--events", ev, "--goal", "customers", "--today", "2027-03-14");
  assert.equal(byName("Example Retail Expo").status, "attended");
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${n} checks passed`);
