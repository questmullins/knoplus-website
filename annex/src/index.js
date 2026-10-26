// Annex: Quest's dashboard at kno.plus/annex, inside the kno.plus Worker. It shows the website's own numbers and the
// sales of every connected seller account (RoseWave first), and keeps those sales fresh by itself.
//
// Routes (all under /annex):
//   /annex/...                 the dashboard itself (static files in nextjs-elements/public/annex)
//   /annex/api/...             the dashboard's data, for a signed-in kno.plus administrator
//   POST /annex/hooks/square   Square's webhook: checked with the account's signature key, then a quick pull
// The Worker's cron runs every account's connections nightly.
//
// Sign-in is the kno.plus administrator account (the same one /clients uses), so there is one password for everything.
// Annex keeps its account list and each account's sales in the kno.plus database (CLIENT_DB) unless an account names
// a database of its own (a binding DB_<ACCOUNT>).
import { sessionUser } from "../../server/client-auth.js";
import { siteReport } from "../../server/analytics.js";
import { CONNECTIONS, accountDb, connectionRows, ensureShared, secretName, syncAccount } from "./sync.js";
import { bestSellers, costSummary, home, memberSummary, orderList, trends } from "./report.js";
import { verify } from "./connections/square.js";
import { addDays, dayOf, daysBetween, fail, json, readJson } from "./util.js";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9][a-z0-9-]{0,30}$/;
const HEADERS = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

// The account a request is about: ?account=<id>, else ANNEX_ACCOUNT (rosewave).
const accountId = (url, env) => url.searchParams.get("account") || env.ANNEX_ACCOUNT || "rosewave";

// Annex's tables live in the kno.plus database; an account's data in its own database when one is bound.
const withDb = (env) => ({ ...env, ANNEX: env.ANNEX || env.CLIENT_DB });

async function findAccount(env, id, create = false) {
  if (!ID.test(id)) return null;
  let row = await env.ANNEX.prepare("SELECT * FROM accounts WHERE id = ?").bind(id).first();
  if (!row && create) {
    // the first visit makes the account; its sales go in DB_<ACCOUNT> when bound, else the kno.plus database
    const own = "DB_" + id.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    const name = id === "rosewave" ? "RoseWave" : id;
    await env.ANNEX.prepare("INSERT OR IGNORE INTO accounts (id, name, tz, db, brand, created) VALUES (?, ?, 'America/New_York', ?, '{}', ?)")
      .bind(id, name, env[own] ? own : "CLIENT_DB", new Date().toISOString()).run();
    row = await env.ANNEX.prepare("SELECT * FROM accounts WHERE id = ?").bind(id).first();
  }
  return row ? { ...row, brand: JSON.parse(row.brand || "{}") } : null;
}

// the range asked for, in the account's own days: from and to (inclusive), else the last 30 days
function range(url, tz) {
  const today = dayOf(new Date().toISOString(), tz);
  let to = url.searchParams.get("to"), from = url.searchParams.get("from");
  if (!DAY.test(to || "")) to = today;
  if (!DAY.test(from || "")) from = addDays(to, -29);
  if (from > to) [from, to] = [to, from];
  if (daysBetween(from, to) > 3 * 366) from = addDays(to, -3 * 366);
  return { from, to };
}

// Answers /annex and everything under it, or null for any other path.
export async function handleAnnex(request, env, ctx) {
  const url = new URL(request.url);
  if (url.pathname !== "/annex" && !url.pathname.startsWith("/annex/")) return null;
  if (url.pathname === "/annex") return Response.redirect(url.origin + "/annex/" + url.search, 301);
  env = withDb(env);
  try {
    if (url.pathname.startsWith("/annex/api/")) return guard(await api(request, env, ctx, url));
    if (url.pathname === "/annex/hooks/square" && request.method === "POST") return await squareHook(request, env, ctx, url);
  } catch (error) {
    console.error(JSON.stringify({ event: "annex_error", path: url.pathname, message: String(error && error.message) }));
    return guard(fail("Something went wrong. Try again in a minute.", 500));
  }
  return guard(await env.ASSETS.fetch(request));
}

function guard(response) {
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(HEADERS)) out.headers.set(k, v);
  if (out.headers.get("Content-Type")?.includes("text/html")) out.headers.set("Cache-Control", "no-store");
  return out;
}

export async function scheduledAnnex(env, ctx) {
  env = withDb(env);
  await ensureShared(env);
  await findAccount(env, env.ANNEX_ACCOUNT || "rosewave", true);
  const accounts = (await env.ANNEX.prepare("SELECT * FROM accounts").all()).results;
  for (const a of accounts) ctx.waitUntil(syncAccount(env, { ...a, brand: JSON.parse(a.brand || "{}") }).catch((e) => console.error("annex nightly", a.id, e.message)));
}

async function api(request, env, ctx, url) {
  if (!env.CLIENT_DB) return fail("Annex's database isn't connected yet.", 503);
  const route = url.pathname.slice("/annex/api/".length);
  const method = request.method;
  if (method !== "GET") {
    // only this page may change things: a JSON body, from this site
    if (request.headers.get("Origin") !== url.origin) return fail("Not allowed", 403);
    if (!(request.headers.get("Content-Type") || "").startsWith("application/json")) return fail("Send JSON", 415);
  }
  const user = await sessionUser(request, env.CLIENT_DB);
  if (route === "me") {
    if (!user) return json({ user: null, signIn: "/clients/?next=/annex/" });
    if (user.role !== "admin") return json({ user: { email: user.email, role: "" } });
  }
  if (!user) return fail("Sign in first", 401);
  if (user.role !== "admin") return fail("Annex is for the kno.plus administrator.", 403);

  await ensureShared(env);
  const account = await findAccount(env, accountId(url, env), true);
  if (!account) return fail("No such account", 404);
  if (route === "me") {
    const accounts = (await env.ANNEX.prepare("SELECT id, name FROM accounts ORDER BY name").all()).results;
    return json({ account: { id: account.id, name: account.name, tz: account.tz, brand: account.brand }, accounts, user: { email: user.email, role: "owner" } });
  }
  if (route === "site" && method === "GET") {
    const days = Number(url.searchParams.get("days") || 28);
    if (![7, 28, 90].includes(days)) return fail("Choose 7, 28, or 90 days.");
    return json(await siteReport(env.CLIENT_DB, days));
  }
  const db = await accountDb(env, account);
  const { from, to } = range(url, account.tz);

  if (method === "GET") {
    if (route === "home") return json({ ...(await home(db, account.tz, from, to)), updated: await updated(db) });
    if (route === "orders") return json(await orderList(db, account.tz, from, to));
    if (route === "best") return json(await bestSellers(db, account.tz, from, to));
    if (route === "members") return json(await memberSummary(db, account.tz, from, to));
    if (route === "costs") return json(await costSummary(db, account.tz, from, to));
    if (route === "trends") return json(await trends(db, account.tz, from, to, ["day", "week", "month"].includes(url.searchParams.get("by")) ? url.searchParams.get("by") : "day"));
    if (route === "connections") return json(await connectionStatus(env, account, db, url));
  }
  if (method === "POST" && route === "costs") return addCost(request, db);
  if (method === "DELETE" && route.startsWith("costs/")) {
    await db.prepare("DELETE FROM costs WHERE id = ? AND source = 'manual'").bind(decodeURIComponent(route.slice(6))).run();
    return json({ ok: true });
  }
  if (method === "POST" && route === "sync") {
    const ask = await readJson(request).catch(() => ({}));
    return json({ report: await syncAccount(env, account, { full: !!ask.full }), updated: await updated(db) });
  }
  if (method === "POST" && route.startsWith("connections/")) return configure(request, db, route.slice(12));
  if (method === "POST" && route === "settings") return settings(request, env, account);
  return fail("Not found", 404);
}

const validZone = (tz) => {
  try {
    return typeof tz === "string" && !!new Intl.DateTimeFormat("en", { timeZone: tz });
  } catch {
    return false;
  }
};

async function settings(request, env, account) {
  const ask = await readJson(request);
  const name = String(ask.name || account.name).trim().slice(0, 60) || account.name;
  const tz = validZone(ask.tz) ? ask.tz : account.tz;
  const colors = {};
  for (const k of ["ink", "accent", "surface", "page"]) if (/^#[0-9a-fA-F]{6}$/.test((ask.colors || {})[k] || "")) colors[k] = ask.colors[k];
  const brand = { ...account.brand, colors };
  await env.ANNEX.prepare("UPDATE accounts SET name = ?, tz = ?, brand = ? WHERE id = ?").bind(name, tz, JSON.stringify(brand), account.id).run();
  return json({ ok: true });
}

async function addCost(request, db) {
  const ask = await readJson(request);
  const amount = Math.round(Number(ask.dollars) * 100);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9) return fail("Add the amount in dollars.");
  if (!DAY.test(ask.at || "")) return fail("Add the date it started.");
  if (ask.until && !DAY.test(ask.until)) return fail("The end date isn't a date.");
  const kind = ask.kind === "once" ? "once" : "monthly";
  await db.prepare("INSERT INTO costs (id, source, kind, ref, at, until, cents, note) VALUES (?, 'manual', ?, '', ?, ?, ?, ?)")
    .bind("manual:" + crypto.randomUUID().slice(0, 12), kind, ask.at, kind === "monthly" ? ask.until || "" : "", amount, String(ask.note || "").trim().slice(0, 80) || "Cost").run();
  return json({ ok: true });
}

// What can be set on a connection is only what isn't secret: the RoseWave worker's address, Square's sandbox switch.
async function configure(request, db, id) {
  if (!CONNECTIONS.some((c) => c.about.id === id)) return fail("No such connection", 404);
  const ask = await readJson(request);
  const config = {};
  if (id === "rosewave") {
    const address = String(ask.url || "").trim();
    if (address && !/^https:\/\/[a-z0-9.-]+(\/[^\s]*)?$/i.test(address)) return fail("The address should start with https://");
    config.url = address.replace(/\/+$/, "");
  }
  if (id === "square") config.sandbox = !!ask.sandbox;
  await db.prepare(`INSERT INTO connections (id, config) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET config = excluded.config, cursor = '', last_ok = ''`)
    .bind(id, JSON.stringify(config)).run();
  return json({ ok: true });
}

async function connectionStatus(env, account, db, url) {
  const rows = await connectionRows(db);
  return {
    hook: url.origin + "/annex/hooks/square" + (account.id === (env.ANNEX_ACCOUNT || "rosewave") ? "" : "?account=" + account.id),
    connections: CONNECTIONS.map((c) => {
      const row = rows.get(c.about.id) || { config: {} };
      return {
        id: c.about.id, name: c.about.name, config: row.config, lastRun: row.last_run || "", lastOk: row.last_ok || "", message: row.message || "",
        secrets: c.about.secrets.map((s) => ({ name: secretName(account, s), set: !!env[secretName(account, s)] })),
      };
    }),
  };
}

async function updated(db) {
  const row = await db.prepare("SELECT MAX(last_ok) AS at FROM connections").first();
  return (row && row.at) || "";
}

async function squareHook(request, env, ctx, url) {
  if (!env.CLIENT_DB) return new Response("Not found", { status: 404 });
  await ensureShared(env);
  const account = await findAccount(env, accountId(url, env));
  if (!account) return new Response("Not found", { status: 404 });
  const body = await request.text();
  if (body.length > 256 * 1024 || !(await verify(request, body, env[secretName(account, "SQUARE_SIGNATURE")]))) return new Response("Not found", { status: 404 });
  ctx.waitUntil(syncAccount(env, account, { days: 3, only: ["rosewave", "square", "prodigi"] }).catch((e) => console.error("annex hook", e.message)));
  return new Response("OK");
}
