// Runs an account's connections and keeps their status. RoseWave goes first so Square finds its orders already filed.
import accountSchema from "../schema/account.sql";
import sharedSchema from "../schema/shared.sql";
import * as rosewave from "./connections/rosewave.js";
import * as square from "./connections/square.js";
import * as prodigi from "./connections/prodigi.js";
import * as etsy from "./connections/etsy.js";
import { SHOP } from "./connections/etsy.js";

export const CONNECTIONS = [rosewave, square, prodigi, etsy];

// The tables are made on first use, so a new database needs nothing run by hand.
const ready = new Set();
async function ensure(db, schema, name) {
  if (ready.has(name)) return;
  const statements = schema.replace(/--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);
  await db.batch(statements.map((s) => db.prepare(s)));
  ready.add(name);
}
export const ensureShared = (env) => ensure(env.ANNEX, sharedSchema, "ANNEX");

export async function accountDb(env, account) {
  const db = env[account.db];
  if (!db) throw new Error(`The ${account.db} database isn't bound to the Annex worker yet.`);
  await ensure(db, accountSchema, account.db);
  if (!ready.has("etsy-shop:" + account.db)) {
    // the Etsy shop's starting settings, only where they've never been saved (no opening day yet)
    await db.prepare(`UPDATE connections SET config = json_set(config, '$.opened', ?, '$.setupWaived', json('true'), '$.plus', json('true'))
      WHERE id = 'etsy' AND json_extract(config, '$.opened') IS NULL`).bind(SHOP.opened).run();
    ready.add("etsy-shop:" + account.db);
  }
  return db;
}

// a connection's secrets are Worker secrets named after the account: ROSEWAVE_SQUARE_TOKEN for account rosewave
export const secretName = (account, name) => account.id.toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_" + name;
// ...except an app's own keys shared by every account (Etsy's), which keep their plain names
export const secretFor = (c, account, name) => (c.about.plainSecrets ? name : secretName(account, name));

export async function connectionRows(db) {
  const rows = (await db.prepare("SELECT * FROM connections").all()).results;
  return new Map(rows.map((r) => [r.id, { ...r, config: JSON.parse(r.config || "{}") }]));
}

// full: everything there is (on connect, or when asked); days: how far back the usual pull looks
export async function syncAccount(env, account, { full = false, days, only } = {}) {
  const db = await accountDb(env, account);
  const rows = await connectionRows(db);
  const report = {};
  for (const c of CONNECTIONS) {
    if (only && !only.includes(c.about.id)) continue;
    const row = rows.get(c.about.id) || { config: {}, cursor: "", last_ok: "" };
    const started = new Date().toISOString();
    // stand-ins for testing on this machine only: never anything but a local address, so keys can't leave by it
    const fakes = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(env.ANNEX_FAKE_APIS || "") ? env.ANNEX_FAKE_APIS.replace(/\/+$/, "") + "/" + c.about.id : "";
    let result, message;
    try {
      result = await c.pull({
        db, env, config: row.config, cursor: row.cursor, days,
        full: full || !row.last_ok, // the first pull of a connection brings its history
        secret: (name) => env[secretFor(c, account, name)] || "",
        base: fakes,
      });
      message = result.skipped || result.counted || "";
    } catch (error) {
      message = "Problem: " + String(error && error.message ? error.message : error).slice(0, 300);
    }
    const ok = result && !result.skipped && !message.startsWith("Problem");
    await db.prepare(
      `INSERT INTO connections (id, config, cursor, last_run, last_ok, message) VALUES (?, '{}', ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET cursor = excluded.cursor, last_run = excluded.last_run, last_ok = CASE WHEN excluded.last_ok = '' THEN connections.last_ok ELSE excluded.last_ok END, message = excluded.message`,
    ).bind(c.about.id, ok && result.cursor ? result.cursor : row.cursor || "", started, ok ? started : "", message).run();
    report[c.about.id] = message;
  }
  return report;
}
