# Event Radar email relay

A tiny serverless service (Vercel functions, no dependencies) that lets people with **no email connector** receive their Event Radar reports by email. It holds the Resend API key so the key never ships in the public plugin.

## What it does

| Endpoint | Purpose |
|---|---|
| `POST /api/register` `{email}` | Sends a confirmation link (valid 24 h). Nothing is stored until the link is clicked. |
| `GET /api/verify` | Proves the person controls the address, registers it and shows their **personal key** (HMAC of the address). |
| `POST /api/send` `{email, key, subject, text, attachments?}` | Emails the report **only to `email`**, and only if `key` matches. Checks the address is still subscribed in the `subscribers` table. Message content is not stored here. |
| `GET/POST /api/unsubscribe` | One-click unsubscribe (also sent as the `List-Unsubscribe` header). |

Guard rails: the recipient is always the verified address (no open relay); attachments limited to `xlsx csv md txt ics pdf json`, 3 MB; 30 emails/day per address and basic per-IP limits (best effort per instance); every email carries an unsubscribe link; registering again re-subscribes.

## Setup (once, by the plugin's author)

1. Resend: verify your sending domain (or a subdomain such as `radar.example.com` if you want to keep your main domain's email reputation separate) with the DNS records Resend shows (DKIM TXT, SPF MX/TXT, return-path CNAME).
2. Resend: create an API key with **sending access restricted to that domain** (the relay only sends; it does not need the contacts API).
3. Database: any Postgres reachable over Neon's SQL-over-HTTP endpoint. Create a database and a read/write role limited to it, then once run: `create table subscribers (email text primary key, unsubscribed boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());`
4. Deploy this folder as a Vercel project (root directory `relay`) with these environment variables:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | the key from step 2 |
| `RELAY_SECRET` | a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`). Changing it invalidates every user key. |
| `DATABASE_URL` | the Postgres connection string of the role from step 3 (pooled host) |
| `PUBLIC_BASE_URL` | the deployed URL, e.g. `https://event-radar-relay.vercel.app` |
| `FROM_ADDRESS` | e.g. `Event Radar <radar@radar.example.com>` |

5. Put the deployed URL in `DEFAULT_RELAY` in `skills/event-radar/scripts/event-radar.mjs`, rebuild the skill zip (`node tools/build-skill-zip.mjs`) and release.

## Privacy and compliance notes

- The relay never stores report content. Resend keeps a log of sent emails per its own policy; say so to users (the skill does).
- Only transactional emails the person asked for are sent. Do not use the contact list for marketing without separate, explicit opt-in (Canada's CASL, GDPR and CAN-SPAM require consent and an unsubscribe).
- To delete a person: `delete from subscribers where email = '…'`; their key stops working immediately because `send` requires an active subscriber.

## Tests

`node tests/relay.mjs` runs every endpoint against a fake Resend (no network).
