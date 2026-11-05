# Event Radar

A [Claude Code](https://claude.com/claude-code) plugin (it ships one skill) that finds events worth your time — conferences, expos, talks, **and webinars/online events** — scores them against your business, prepares you to attend, reminds you of deadlines and keeps a simple CRM of the people you meet.

> Public sources only. It never pays for or registers you for anything. Works without connectors; with them it can use your calendar, email and sheets.

> **Not technical?** Start with [GETTING-STARTED.md](GETTING-STARTED.md) (English and Spanish, no jargon). Claude checks your computer, installs what's missing with your permission, or runs in a no-install manual mode.

## Install

In Claude Code:

```
/plugin marketplace add Erodigitalsolutions/event-radar
/plugin install event-radar@event-radar
```

Or copy `skills/event-radar` into your own skills folder. Requirements: Claude Code. Node.js ≥ 18 runs the helper script; if it's missing, Claude offers to install it or continues in manual mode ([setup-check.md](skills/event-radar/references/setup-check.md)).

## First run

1. Say **"set up my Event Radar"**. A short questionnaire learns your business, markets, goals, geography tiers, budget, how you want results delivered (language, email, Excel…), reminders and tools. You can answer in another assistant with [this prompt](skills/event-radar/references/external-llm-prompt.md) and paste the result.
2. Say **"find events"**. The scan runs in four steps and waits for you between them.

Your data (profile, event database, reports, dossiers) lives in `~/.event-radar/`, never in this repo.

## How a scan works

| Phase | What happens | You |
|---|---|---|
| 1. Long list | Everything that could match, by tier (local → rest of country → neighbouring country → international) plus a webinars/online group. Includes expensive and far-away events. | read it |
| 2. Shortlist | | pick the ones that interest you |
| 3. Valuation | Official pages checked: dates, venue, prices and deadlines, organizer, attendance, speakers, exhibitors. Seven scores with evidence and links; unknowns are flagged, not invented. | read the ranked table |
| 4. Final selection | Follow (`watching`) or analyse in depth (`deep-dive`): dossier with exhibitors, speakers and attendee research from public pages, briefing "as if you knew everyone". | decide |

**Budget is only a nudge.** It has a small weight in the score and the report adds a "stretch" note when an event is above your per-tier cap — it never hides or drops an event. If an event fits 100% you can still choose to make the effort.

After you follow events: reminders (6/3/1 months before; 2 weeks and 1 week only for events you registered for; registration, early-bird and call-for-speakers deadlines), a calendar file or Google Calendar sync, and a monthly "what's coming" digest. After an event: follow-up checklist, ROI (cost per lead/meeting), and scoring suggestions learned from your ratings — proposals you approve, never silent changes.

## Delivery (automatic)

At the end of each phase the plugin delivers everything, using what you authorised during onboarding: an Excel workbook (**Events**, **Prices** with deadlines, **Timeline**, **Scores**, **Contacts**), a Google Sheet kept up to date (created in your Drive the first time, your edits to Contacts preserved), calendar reminders and deadline alerts for the events you follow, and a short email with attachments to yourself. Without connectors it leaves the files in a folder and tells you how to import them. See [delivery-and-sync.md](skills/event-radar/references/delivery-and-sync.md).

## Script commands

Deterministic helper (`skills/event-radar/scripts/event-radar.mjs`) so scoring, dedupe, reminders and exports are reproducible. Claude assigns the sub-scores with evidence; the script does the math.

```bash
S=skills/event-radar/scripts/event-radar.mjs
node $S merge     --events events.json --incoming new.json [--refresh]
node $S longlist  --events events.json --lang en
node $S status    --events events.json --ids id1,id2 --set shortlisted
node $S score     --events events.json --goal customers
node $S report    --events events.json --lang en --caps '{"1":150,"2":600}'
node $S dossier   --events events.json --id <event-id> --people people.json
node $S contacts  --people people.json --events events.json
node $S reminders --events events.json --registered-days 14,7 --window-days 60
node $S ics       --events events.json --out reminders.ics
node $S digest    --events events.json --window-days 60
node $S export    --events events.json --people people.json --out-dir out/   # xlsx + csv + report + ics + digest
node $S crm       --events events.json --people people.json --out-dir crm/
node $S outcome   --events events.json --id <event-id> --decision attended --rating 4 --leads 3
node $S post-event --events events.json --id <event-id> --people people.json
node $S learn     --events events.json --goal customers
```

Fictional sample data is in [`examples/`](examples/). Details: [events-schema.md](skills/event-radar/references/events-schema.md), [scoring-rubric.md](skills/event-radar/references/scoring-rubric.md), [scan-workflow.md](skills/event-radar/references/scan-workflow.md).

## Connectors (optional)

Calendar (Google/Outlook), email (Gmail or your own mail MCP), Google Sheets/Drive, Slack, Notion, Monday, HubSpot… The onboarding asks what you use and [connectors.md](skills/event-radar/references/connectors.md) maps each to a fallback (`.ics` file, CSV/Excel, local folder), so nothing depends on them. Anything that sends or creates something outside your machine asks first, except what you authorised during onboarding (for example, emailing the report to yourself).

## Principles

- **Public, not private:** no logged-in scraping; LinkedIn only through public pages that show up in search.
- **No payments, no registration:** it gives you the link, price and deadline; you do it.
- **No invention:** anything unverified is marked as such, with source URL and date checked.
- **Neutral:** no assumed city, industry, language or tools — everything comes from your profile. Results are shown in the language you choose for reports.
- **Privacy:** people research follows [people-research-rules.md](skills/event-radar/references/people-research-rules.md) (professional public information only, confirmed vs. candidate attendees, deletion on request).

## Development

```bash
node tests/smoke.mjs
```

Runs every command against the fictional examples (also in CI on Linux and Windows, Node 18 and 22). See [CHANGELOG.md](CHANGELOG.md).

## Español

Plugin de Claude Code que encuentra, puntúa y prepara eventos (incluye webinars y eventos online) para tu negocio. Instálalo con `/plugin marketplace add Erodigitalsolutions/event-radar`, luego `/plugin install event-radar@event-radar` y di **"configura mi Event Radar"**. Las instrucciones internas del skill están en español y el skill conversa en tu idioma; los resultados salen en el idioma que elijas para los reportes. El presupuesto nunca descarta eventos: solo suma o resta un poco al puntaje y se marca como "estiramiento".

## License

MIT
