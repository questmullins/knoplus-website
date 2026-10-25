// Annex: a sales dashboard for small photo and print sellers. Each seller is an account at <account>.kno.plus/annex,
// with its own database; the shared ANNEX database holds only sign-ins and accounts. Nothing here assumes a seller.
//
// Routes (all under /annex):
//   /annex/...                 the dashboard itself (static files in public/annex)
//   /annex/api/...             the dashboard's data, for a signed-in person with access to this account
//   POST /annex/hooks/square   Square's webhook: checked with the account's signature key, then a quick pull
// A cron runs every account's connections nightly.
import { checkPassword, endSession, hashPassword, passwordProblem, roleIn, startSession, whoIs } from "./auth.js";
import { CONNECTIONS, accountDb, connectionRows, ensureShared, secretName, syncAccount } from "./sync.js";
import { bestSellers, costSummary, home, memberSummary, orderList, trends } from "./report.js";
import { verify } from "./connections/square.js";
import { addDays, dayOf, daysBetween, fail, json, randomId, readJson, same } from "./util.js";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9][a-z0-9-]{0,30}$/;

// rosewave.kno.plus → rosewave; any other host (workers.dev, a local test) uses ANNEX_DEFAULT_ACCOUNT
function accountId(request, env) {
  const host = new URL(request.url).hostname;
  const domain = (env.ANNEX_DOMAIN || "kno.plus").toLowerCase();
  if (host.endsWith("." + domain)) return host.slice(0, -domain.length - 1);
  return env.ANNEX_DEFAULT_ACCOUNT || "";
}

async function findAccount(env, id) {
  if (!ID.test(id)) return null;
  const row = await env.ANNEX.prepare("SELECT * FROM accounts WHERE id = ?").bind(id).first();
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/annex")) return new Response("Not found", { status: 404 });
    if (url.pathname === "/annex") return Response.redirect(url.origin + "/annex/", 301);
    try {
      if (url.pathname.startsWith("/annex/api/")) return await api(request, env, ctx, url);
      if (url.pathname === "/annex/hooks/square" && request.method === "POST") return await squareHook(request, env, ctx);
    } catch (error) {
      console.error(JSON.stringify({ event: "annex_error", path: url.pathname, message: String(error && error.message) }));
      return fail(String((error && error.message) || "Something went wrong"), 500);
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    await ensureShared(env);
    const accounts = (await env.ANNEX.prepare("SELECT * FROM accounts").all()).results;
    for (const a of accounts) ctx.waitUntil(syncAccount(env, { ...a, brand: JSON.parse(a.brand || "{}") }).catch((e) => console.error("annex nightly", a.id, e.message)));
  },
};

async function api(request, env, ctx, url) {
  await ensureShared(env);
  const route = url.pathname.slice("/annex/api/".length);
  const method = request.method;
  if (method !== "GET") {
    // only this page may change things: a JSON body, from this site
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) return fail("Not allowed", 403);
    if (!(request.headers.get("Content-Type") || "").startsWith("application/json")) return fail("Send JSON", 415);
  }
  const id = accountId(request, env);
  const account = await findAccount(env, id);

  if (route === "setup" && method === "POST") return setup(request, env, id, account);
  if (route === "login" && method === "POST") {
    const ask = await readJson(request);
    const { user, error } = await checkPassword(env, ask.email, ask.password);
    if (error) return fail(error, 401);
    if (!account || !(await roleIn(env, account.id, user.id))) return fail("That email and password don't match.", 401);
    return json({ ok: true }, 200, { "Set-Cookie": await startSession(env, user.id) });
  }
  if (route === "logout" && method === "POST") return json({ ok: true }, 200, { "Set-Cookie": await endSession(env, request) });

  const user = await whoIs(env, request);
  const role = user && account ? await roleIn(env, account.id, user.id) : "";
  if (route === "me") {
    if (!account) return json({ setup: true, account: { id } });
    const owners = await env.ANNEX.prepare("SELECT COUNT(*) AS n FROM access WHERE account = ?").bind(account.id).first();
    return json({
      setup: !owners.n,
      account: { id: account.id, name: account.name, tz: account.tz, brand: account.brand },
      user: role ? { email: user.email, name: user.name, role } : null,
    });
  }
  if (!account) return fail("No such account", 404);
  if (!role) return fail("Sign in first", 401);
  const owner = role === "owner";
  const db = await accountDb(env, account);
  const { from, to } = range(url, account.tz);

  if (method === "GET") {
    if (route === "home") return json({ ...(await home(db, account.tz, from, to)), updated: await updated(db) });
    if (route === "orders") return json(await orderList(db, account.tz, from, to));
    if (route === "best") return json(await bestSellers(db, account.tz, from, to));
    if (route === "members") return json(await memberSummary(db, account.tz, from, to));
    if (route === "costs") return json(await costSummary(db, account.tz, from, to));
    if (route === "trends") return json(await trends(db, account.tz, from, to, ["day", "week", "month"].includes(url.searchParams.get("by")) ? url.searchParams.get("by") : "day"));
    if (route === "connections" && owner) return json(await connectionStatus(env, account, db));
  }
  if (!owner) return fail("Only the account's owner can change that", 403);
  if (method === "POST" && route === "costs") return addCost(request, db);
  if (method === "DELETE" && route.startsWith("costs/")) {
    await db.prepare("DELETE FROM costs WHERE id = ? AND source = 'manual'").bind(route.slice(6)).run();
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

// The first person to open a new account's /annex sets it up, with the setup code from the Worker's secrets.
async function setup(request, env, id, account) {
  const ask = await readJson(request);
  if (!env.ANNEX_SETUP_CODE || env.ANNEX_SETUP_CODE.length < 12 || !same(String(ask.code || ""), env.ANNEX_SETUP_CODE)) return fail("That setup code isn't right.", 403);
  if (!ID.test(id)) return fail("This address isn't an account name Annex can use.");
  if (account && (await env.ANNEX.prepare("SELECT COUNT(*) AS n FROM access WHERE account = ?").bind(id).first()).n) return fail("This account is already set up. Sign in instead.", 409);
  const email = String(ask.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Add a valid email.");
  const problem = passwordProblem(ask.password);
  if (problem) return fail(problem);
  const tz = validZone(ask.tz) ? ask.tz : "America/New_York";
  const now = new Date().toISOString();
  const name = String(ask.accountName || id).trim().slice(0, 60) || id;
  const db = "DB_" + id.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  if (!env[db]) return fail(`Bind a D1 database named ${db} to the Annex worker first.`, 409);
  let user = await env.ANNEX.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  const writes = [];
  if (!account) writes.push(env.ANNEX.prepare("INSERT INTO accounts (id, name, tz, db, brand, created) VALUES (?, ?, ?, ?, '{}', ?)").bind(id, name, tz, db, now));
  if (!user) {
    user = { id: randomId(12) };
    const { hash, salt } = await hashPassword(ask.password);
    writes.push(env.ANNEX.prepare("INSERT INTO users (id, email, name, hash, salt, created) VALUES (?, ?, ?, ?, ?, ?)").bind(user.id, email, String(ask.name || "").slice(0, 60), hash, salt, now));
  }
  writes.push(env.ANNEX.prepare("INSERT INTO access (account, user, role) VALUES (?, ?, 'owner')").bind(id, user.id));
  await env.ANNEX.batch(writes);
  return json({ ok: true }, 200, { "Set-Cookie": await startSession(env, user.id) });
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
    .bind("manual:" + randomId(9), kind, ask.at, kind === "monthly" ? ask.until || "" : "", amount, String(ask.note || "").trim().slice(0, 80) || "Cost").run();
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

async function connectionStatus(env, account, db) {
  const rows = await connectionRows(db);
  return {
    hook: "https://" + account.id + "." + (env.ANNEX_DOMAIN || "kno.plus") + "/annex/hooks/square",
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

async function squareHook(request, env, ctx) {
  const account = await findAccount(env, accountId(request, env));
  if (!account) return new Response("Not found", { status: 404 });
  const body = await request.text();
  if (body.length > 256 * 1024 || !(await verify(request, body, env[secretName(account, "SQUARE_SIGNATURE")]))) return new Response("Not found", { status: 404 });
  ctx.waitUntil(syncAccount(env, account, { days: 3, only: ["rosewave", "square", "prodigi"] }).catch((e) => console.error("annex hook", e.message)));
  return new Response("OK");
}
