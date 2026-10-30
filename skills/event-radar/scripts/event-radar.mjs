#!/usr/bin/env node
// Event Radar - utilidades deterministas (sin dependencias). Node >= 18.
//
//   node event-radar.mjs merge  --events events.json --incoming new.json
//   node event-radar.mjs score  --events events.json --goal customers [--weights '{"fit":30}'] [--liked "A,B"] [--today 2026-10-29]
//   node event-radar.mjs report --events events.json [--min-score 60] [--format md|csv] [--lang es|en] [--out file] [--today ...]
//
// El modelo asigna sub-puntajes con evidencia; este script hace la matematica,
// el dedupe y el reporte para que sean reproducibles.

import fs from "node:fs";

const KEYS = ["fit", "audience", "people", "credibility", "cost", "logistics", "timing"];
const BASE = { fit: 25, audience: 20, people: 15, credibility: 10, cost: 15, logistics: 10, timing: 5 };
const GOAL_ADJ = {
  customers: { audience: 10, people: 5, credibility: -5, timing: -5, cost: -5 },
  partners: { people: 10, audience: 5, cost: -5, logistics: -5, timing: -5 },
  suppliers: { people: 10, fit: 5, credibility: -5, audience: -5, timing: -5 },
  investors: { audience: 10, people: 10, cost: -10, logistics: -5, timing: -5 },
  learning: { fit: 10, credibility: 5, people: -5, audience: -5, timing: -5 },
  brand: { audience: 10, credibility: 5, cost: -5, people: -5, logistics: -5 },
  hiring: { audience: 10, fit: 5, credibility: -5, cost: -5, timing: -5 },
};
const LABELS = {
  es: { top: "Imperdible", high: "Muy recomendado", mid: "Vale la pena considerar" },
  en: { top: "Must-attend", high: "Highly recommended", mid: "Worth considering" },
};
const T = {
  es: {
    title: "Event Radar · Reporte", generated: "Generado", ranking: "Ranking", deadlines: "Próximos deadlines",
    none: "No hay eventos por encima del umbral.", when: "Fecha", where: "Lugar", tier: "Tier", cost: "Costo estimado",
    score: "Puntaje", breakdown: "Desglose", why: "Por qué", unverified: "No verificado", link: "Enlace",
    event: "Evento", label: "Etiqueta", reg: "Registro hasta", cfs: "Convocatoria de ponentes hasta",
    estimate: "estimado", priceUnknown: "precio no publicado", noDeadlines: "Sin deadlines próximos.",
    criteria: { fit: "Alineación", audience: "Audiencia", people: "Ponentes", credibility: "Credibilidad", cost: "Costo", logistics: "Logística", timing: "Timing" },
  },
  en: {
    title: "Event Radar · Report", generated: "Generated", ranking: "Ranking", deadlines: "Upcoming deadlines",
    none: "No events above the threshold.", when: "Date", where: "Location", tier: "Tier", cost: "Estimated cost",
    score: "Score", breakdown: "Breakdown", why: "Why", unverified: "Unverified", link: "Link",
    event: "Event", label: "Label", reg: "Register by", cfs: "Call for speakers until",
    estimate: "estimate", priceUnknown: "price not published", noDeadlines: "No upcoming deadlines.",
    criteria: { fit: "Fit", audience: "Audience", people: "Speakers", credibility: "Credibility", cost: "Cost", logistics: "Logistics", timing: "Timing" },
  },
};

// ---------- utilidades ----------
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      out[k] = v;
    } else out._.push(a);
  }
  return out;
}
const die = (m) => { console.error("Error: " + m); process.exit(1); };
const readJson = (p, fallback) => {
  if (!fs.existsSync(p)) { if (fallback !== undefined) return fallback; die(`no existe ${p}`); }
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { die(`JSON inválido en ${p}: ${e.message}`); }
};
const writeJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
const today = (a) => {
  const t = a.today || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) die("--today debe ser YYYY-MM-DD");
  return t;
};
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/\b(19|20)\d{2}\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const urlKey = (u) => {
  if (!u) return null;
  try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname).replace(/\/+$/, "").toLowerCase(); }
  catch { return null; }
};
const slug = (s) => norm(s).replace(/ /g, "-").slice(0, 60);
const eventsOf = (db) => (Array.isArray(db) ? db : db.events || []);
const isDate = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);

// ---------- merge ----------
const PROTECTED = new Set(["status", "scores", "evidence", "first_seen", "score", "label", "filtered_reason", "notes", "unverified"]);

function sameEvent(a, b) {
  const ua = urlKey(a.url), ub = urlKey(b.url);
  if (ua && ub && ua === ub) return true;
  const ya = (a.start_date || "").slice(0, 4), yb = (b.start_date || "").slice(0, 4);
  return norm(a.name) !== "" && norm(a.name) === norm(b.name) && (!ya || !yb || ya === yb);
}

function cmdMerge(a) {
  if (!a.events || !a.incoming) die("uso: merge --events <events.json> --incoming <nuevos.json>");
  const db = readJson(a.events, { schema_version: 1, events: [] });
  const list = eventsOf(db);
  const incoming = eventsOf(readJson(a.incoming));
  const t = today(a);
  let added = 0, updated = 0, changed = [];
  for (const inc of incoming) {
    if (!inc.name) continue;
    const match = list.find((e) => sameEvent(e, inc));
    if (!match) {
      list.push({ id: slug(inc.name) + "-" + (inc.start_date || "tbd").slice(0, 4), status: "new", first_seen: t, last_checked: t, ...inc });
      added++;
    } else {
      for (const [k, v] of Object.entries(inc)) {
        if (PROTECTED.has(k) || v === null || v === undefined || v === "") continue;
        if (JSON.stringify(match[k]) !== JSON.stringify(v)) {
          if (["start_date", "end_date", "city", "venue", "registration_deadline"].includes(k) && match[k]) changed.push(`${match.name}: ${k} ${match[k]} → ${v}`);
          match[k] = v;
        }
      }
      match.last_checked = t;
      updated++;
    }
  }
  const out = Array.isArray(db) ? { schema_version: 1, events: list } : { ...db, events: list };
  writeJson(a.events, out);
  console.log(JSON.stringify({ added, updated, total: list.length, changed_fields: changed }, null, 2));
}

// ---------- score ----------
function weightsFor(goal, custom) {
  const w = { ...BASE };
  if (goal && GOAL_ADJ[goal]) for (const [k, v] of Object.entries(GOAL_ADJ[goal])) w[k] += v;
  if (custom) for (const [k, v] of Object.entries(custom)) if (KEYS.includes(k) && Number.isFinite(v)) w[k] = v;
  for (const k of KEYS) w[k] = Math.max(0, w[k]);
  const sum = KEYS.reduce((s, k) => s + w[k], 0);
  if (sum === 0) die("los pesos suman 0");
  for (const k of KEYS) w[k] = w[k] / sum;
  return w;
}
function labelFor(score, lang) {
  const L = LABELS[lang] || LABELS.en;
  return score >= 85 ? L.top : score >= 70 ? L.high : score >= 60 ? L.mid : "";
}

function scoreEvent(e, w, liked, t) {
  const unverified = new Set(e.unverified || []);
  let total = 0;
  for (const k of KEYS) {
    let s = e.scores?.[k];
    if (typeof s !== "number" || s < 0 || s > 10) { s = 5; unverified.add(k); }
    total += w[k] * s;
  }
  let score = total * 10;
  const notes = [];
  if (e.registration_deadline && isDate(e.registration_deadline) && e.registration_deadline < t && (e.end_date || e.start_date || "9999") >= t) {
    score -= 5; notes.push("deadline de registro vencido (-5)");
  }
  const crit = [!e.start_date, !(e.city || e.venue), e.cost_estimate?.price_known === false || !e.prices?.length, !e.organizer].filter(Boolean).length;
  if (crit >= 3) { score -= 10; notes.push("campos críticos sin verificar (-10)"); }
  if (liked.some((l) => l && norm(e.name).includes(l))) { score += 5; notes.push("similar a uno que le gustó (+5)"); }
  return { score: Math.max(0, Math.min(100, Math.round(score * 10) / 10)), unverified: [...unverified], notes };
}

function cmdScore(a) {
  if (!a.events) die("uso: score --events <events.json> [--goal customers] [--weights JSON] [--liked 'A,B']");
  const db = readJson(a.events);
  const list = eventsOf(db);
  let custom = null;
  if (a.weights && a.weights !== true) { try { custom = JSON.parse(a.weights); } catch { die("--weights no es JSON válido"); } }
  if (a.goal && a.goal !== true && !GOAL_ADJ[a.goal]) console.error(`Aviso: goal "${a.goal}" sin ajuste; se usan pesos base.`);
  const w = weightsFor(a.goal === true ? null : a.goal, custom);
  const liked = a.liked && a.liked !== true ? a.liked.split(",").map(norm).filter(Boolean) : [];
  const lang = a.lang === "en" ? "en" : "es";
  const t = today(a);
  const out = { scored: 0, filtered_past: 0, skipped_no_scores: 0 };
  for (const e of list) {
    if (["cancelled", "skipped"].includes(e.status)) continue;
    const end = e.end_date || e.start_date;
    if (isDate(end) && end < t) { e.status = "filtered"; e.filtered_reason = "past"; out.filtered_past++; continue; }
    if (e.status === "filtered") continue;
    if (!e.scores) { out.skipped_no_scores++; continue; }
    const r = scoreEvent(e, w, liked, t);
    e.score = r.score; e.label = labelFor(r.score, lang); e.unverified = r.unverified; e.score_notes = r.notes;
    if (e.status === "new") e.status = "candidate";
    out.scored++;
  }
  writeJson(a.events, Array.isArray(db) ? { schema_version: 1, events: list } : db);
  console.log(JSON.stringify({ ...out, weights: Object.fromEntries(KEYS.map((k) => [k, Math.round(w[k] * 1000) / 10])) }, null, 2));
}

// ---------- report ----------
const money = (c) => {
  if (!c) return null;
  const cur = c.currency || "";
  if (c.min == null && c.max == null) return null;
  return c.min === c.max || c.max == null ? `${cur} ${c.min}` : `${cur} ${c.min}–${c.max}`;
};
const csvCell = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

function cmdReport(a) {
  if (!a.events) die("uso: report --events <events.json> [--min-score 60] [--format md|csv] [--lang es|en] [--out file]");
  const lang = a.lang === "en" ? "en" : "es";
  const tr = T[lang];
  const min = a["min-score"] ? Number(a["min-score"]) : 60;
  const t = today(a);
  const all = eventsOf(readJson(a.events));
  const rows = all.filter((e) => typeof e.score === "number" && e.score >= min && !["filtered", "cancelled", "skipped"].includes(e.status))
    .sort((x, y) => y.score - x.score);

  let text;
  if ((a.format || "md") === "csv") {
    const head = ["name", "score", "label", "start_date", "end_date", "city", "country", "tier", "format", "cost_min", "cost_max", "currency", "registration_deadline", "status", "url"];
    text = [head.join(","), ...rows.map((e) => [e.name, e.score, e.label, e.start_date, e.end_date, e.city, e.country, e.tier, e.format,
      e.cost_estimate?.min, e.cost_estimate?.max, e.cost_estimate?.currency, e.registration_deadline, e.status, e.url].map(csvCell).join(","))].join("\n") + "\n";
  } else {
    const L = [`# ${tr.title}`, `_${tr.generated}: ${t} · ${rows.length} ${lang === "es" ? "eventos" : "events"}_`, ""];
    if (!rows.length) L.push(tr.none);
    else {
      L.push(`## ${tr.ranking}`, "", `| # | ${tr.event} | ${tr.score} | ${tr.label} | ${tr.when} | ${tr.where} |`, "|---|---|---|---|---|---|");
      rows.forEach((e, i) => L.push(`| ${i + 1} | ${e.name} | ${e.score} | ${e.label || ""} | ${e.start_date || "TBD"} | ${[e.city, e.country].filter(Boolean).join(", ") || "TBD"} |`));
      L.push("");
      rows.forEach((e, i) => {
        L.push(`### ${i + 1}. ${e.name} — ${e.score}${e.label ? " · " + e.label : ""}`, "");
        L.push(`- **${tr.when}:** ${e.start_date || "TBD"}${e.end_date && e.end_date !== e.start_date ? " → " + e.end_date : ""}`);
        L.push(`- **${tr.where}:** ${[e.venue, e.city, e.country].filter(Boolean).join(", ") || "TBD"} · ${tr.tier} ${e.tier ?? "?"}`);
        const m = money(e.cost_estimate);
        L.push(`- **${tr.cost}:** ${m ? m + " (" + tr.estimate + ")" : tr.priceUnknown}`);
        if (e.registration_deadline) L.push(`- **${tr.reg}:** ${e.registration_deadline}`);
        if (e.call_for_speakers_deadline) L.push(`- **${tr.cfs}:** ${e.call_for_speakers_deadline}`);
        if (e.scores) L.push(`- **${tr.breakdown}:** ` + KEYS.map((k) => `${tr.criteria[k]} ${e.scores[k] ?? "?"}`).join(" · "));
        const why = Object.values(e.evidence || {}).map((v) => v.note).filter(Boolean);
        if (why.length) L.push(`- **${tr.why}:** ${why.join("; ")}`);
        if (e.unverified?.length) L.push(`- **${tr.unverified}:** ${e.unverified.map((k) => tr.criteria[k] || k).join(", ")}`);
        if (e.url) L.push(`- **${tr.link}:** ${e.url}`);
        L.push("");
      });
      const dl = [];
      for (const e of rows) {
        for (const [k, kind] of [["registration_deadline", tr.reg], ["call_for_speakers_deadline", tr.cfs]]) {
          if (isDate(e[k]) && e[k] >= t) dl.push({ d: e[k], text: `${e[k]} — ${e.name} (${kind})` });
        }
      }
      dl.sort((x, y) => x.d.localeCompare(y.d));
      L.push(`## ${tr.deadlines}`, "", ...(dl.length ? dl.map((x) => `- ${x.text}`) : [tr.noDeadlines]), "");
    }
    text = L.join("\n");
  }
  if (a.out && a.out !== true) { fs.writeFileSync(a.out, text, "utf8"); console.log(`Reporte escrito en ${a.out} (${rows.length} eventos)`); }
  else process.stdout.write(text);
}

// ---------- main ----------
const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
if (cmd === "merge") cmdMerge(args);
else if (cmd === "score") cmdScore(args);
else if (cmd === "report") cmdReport(args);
else die("comandos: merge | score | report");
