// Tiny subscriber store on Neon Postgres over HTTPS (SQL over HTTP): no driver, no dependencies.
// Table (created once by the owner role):
//   create table subscribers (email text primary key, unsubscribed boolean not null default false,
//                             created_at timestamptz not null default now(), updated_at timestamptz not null default now());
import { env } from "./common.js";

export async function sql(query, params = []) {
  const cs = env("DATABASE_URL");
  if (!cs) throw new Error("DATABASE_URL is not set");
  const r = await fetch(`https://${new URL(cs).host}/sql`, {
    method: "POST",
    headers: { "Neon-Connection-String": cs, "Content-Type": "application/json" },
    body: JSON.stringify({ query, params }),
  });
  let j = {}; try { j = await r.json(); } catch { /* sin cuerpo */ }
  if (!r.ok) throw new Error(j.message || `database error ${r.status}`);
  return j.rows || [];
}

/** Register (or re-activate) an address after it was confirmed. */
export const subscribe = (email) =>
  sql("insert into subscribers (email) values ($1) on conflict (email) do update set unsubscribed = false, updated_at = now()", [email]);

/** True only for a confirmed address that has not unsubscribed. */
export const isActive = async (email) => (await sql("select unsubscribed from subscribers where email = $1", [email]))[0]?.unsubscribed === false;

export const unsubscribe = (email) =>
  sql("update subscribers set unsubscribed = true, updated_at = now() where email = $1", [email]);
