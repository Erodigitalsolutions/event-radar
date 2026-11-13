# Changelog

## 1.4.0
- Report email service live (`relay/`): people with no email connector can have their reports emailed to themselves. Confirmation link, personal key, one-click unsubscribe; subscribers stored on Neon, sending-only Resend key.
- New commands `relay-register` and `relay-send`; the service address is built in.

## 1.3.0
- Install without git, terminal or admin rights: ready-made `dist/event-radar-skill.zip` and a one-message install prompt in README and GETTING-STARTED; a smoke test keeps the zip in sync with the skill.

## 1.2.0
- Non-technical onboarding: environment check that installs Node with the user's permission or falls back to a manual mode with the same flow; plain-language GETTING-STARTED guide in English and Spanish.

## 1.1.0
- Automatic delivery at the end of each phase: new `export` command builds an Excel workbook (Events, Prices, Timeline, Scores, Contacts) plus CSV/JSON, report, `.ics` and digest, with a dependency-free xlsx writer.
- Delivery guide: create or update the Google Sheet (preserving user edits), sync calendar reminders and deadlines, email the report to yourself — driven by new `automation` settings asked once in onboarding (block 11).

## 1.0.0
First public release.
- Onboarding questionnaire (incl. a prompt you can paste into another LLM), saved as a profile in `~/.event-radar/`.
- Scan in 4 phases: long list of everything that could match (webinars and online events always included) → your shortlist → deep valuation with evidence → your final selection. Budget is a nudge, never a filter.
- Deterministic scoring (7 criteria, goal-based weights), reports (md/csv), numbered long-list tables.
- Deep dives: dossiers with exhibitors, speakers and attendee research from public sources only.
- Reminders (6/3/1 months, 2 weeks and 1 week for registered events, deadline alerts), `.ics`, monthly digest.
- CRM sheet export that preserves your edits, post-event follow-up, ROI and feedback learning (proposals only).
- Smoke tests and CI on Linux and Windows (Node 18 and 22).
