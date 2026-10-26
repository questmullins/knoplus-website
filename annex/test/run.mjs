// End-to-end check against `wrangler dev` (port 8787, from the repository root) and test/fakes.mjs (port 8790): sign in
// as a kno.plus administrator, connect, pull, and compare the dashboard's numbers with the sums worked out by hand.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";

const BASE = process.env.ANNEX_URL || "http://127.0.0.1:8787/annex/api/";
const ORIGIN = new URL(BASE).origin;
const d1 = (sql) => execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "knoplus-clients", "--local", "--command", sql], { stdio: "pipe" });
let cookie = "";
async function api(path, body, method) {
  const r = await fetch(BASE + path, {
    method: method || (body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", Origin: ORIGIN, Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const check = (name, ok) => { assert.ok(ok, name); console.log("ok  " + name); };

// a fresh start: no account, no sales (the local database only; d1 never touches the real one with --local)
for (const file of ["annex/schema/shared.sql", "annex/schema/account.sql"]) execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "knoplus-clients", "--local", "--file", file], { stdio: "pipe" });
d1(["accounts", "connections", "orders", "lines", "payments", "refunds", "costs", "customers", "subscriptions"].map((t) => `DELETE FROM ${t};`).join(" "));

const run = "annex-test-" + Date.now();

// the first administrator: only with the setup code, and only once
d1("DELETE FROM sessions; DELETE FROM users WHERE role = 'admin'; DELETE FROM limits;");
check("no administrator yet: setup offered", (await api("me")).body.setup === true);
check("wrong setup code refused", (await api("setup", { code: "nope", email: "q@example.test", password: "a long password" })).status === 403);
check("short password refused", (await api("setup", { code: "test-setup-code-123", email: "q@example.test", password: "short" })).status === 400);
const made = await fetch(BASE + "setup", { method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGIN }, body: JSON.stringify({ code: "test-setup-code-123", email: `${run}-first@example.test`, password: "a long password" }) });
check("setup makes the administrator and signs in", made.status === 200 && /__Host-kno_client=[a-f0-9]{64}/.test(made.headers.get("set-cookie")));
cookie = made.headers.get("set-cookie").split(";")[0];
const cookieFirst = cookie;
check("the new administrator sees Annex", (await api("me")).body.user.role === "owner");
cookie = "";
check("with an administrator, setup is no longer the first screen", (await api("me")).body.firstAdmin === false);
const again = await fetch(BASE + "setup", { method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGIN }, body: JSON.stringify({ code: "test-setup-code-123", email: `${run}-first@example.test`, password: "another long password" }) });
check("the setup code resets the administrator's password", again.status === 200);
check("the old session is signed out by the reset", (await fetch(BASE + "home", { headers: { Cookie: cookieFirst } })).status === 401);
check("wrong code still refused with an administrator", (await api("setup", { code: "nope", email: "x@example.test", password: "a long password" })).status === 403);
d1(`DELETE FROM sessions; DELETE FROM users WHERE email = '${run}-first@example.test';`);

// a kno.plus administrator and a client, signed in by writing their sessions straight into the local database
const token = (role) => {
  const t = randomBytes(32).toString("hex");
  d1(`INSERT INTO users(id,email,password,role,disabled) VALUES('${run}-${role}','${run}-${role}@example.test','unused','${role}',0);
      INSERT INTO sessions(token,user_id,expires) VALUES('${createHash("sha256").update(t).digest("hex")}','${run}-${role}',${Date.now() + 600000});`);
  return "__Host-kno_client=" + t;
};
const admin = token("admin"), client = token("client");
process.on("exit", () => d1(`DELETE FROM sessions WHERE user_id LIKE '${run}%'; DELETE FROM users WHERE id LIKE '${run}%';`));

check("signed out: sent to the kno.plus sign-in", (await api("me")).body.signIn === "/clients/?next=/annex/");
check("data needs sign-in", (await api("home")).status === 401);
cookie = client;
check("a client can't see Annex", (await api("home")).status === 403 && (await api("site")).status === 403);
cookie = admin;
check("the administrator is the owner", (await api("me")).body.user.role === "owner");
check("other site can't post", (await fetch(BASE + "sync", { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie, Origin: "https://evil.example" }, body: "{}" })).status === 403);
const site = (await api("site?days=7")).body;
check("website numbers: 7 days", site.site === "kno.plus" && site.series.length === 7);
check("website range checked", (await api("site?days=999")).status === 400);

// Square first, before RoseWave is connected: its payments for RoseWave orders become orders of their own for now
let r = await api("sync", {});
check("Square and Prodigi pull, RoseWave waits for its address", /payments/.test(r.body.report.square) && /lab orders/.test(r.body.report.prodigi) && /address/.test(r.body.report.rosewave));
check("RoseWave address must be https", (await api("connections/rosewave", { url: "http://x" })).status === 400);
check("RoseWave address saved", (await api("connections/rosewave", { url: "https://rosewave-worker.example" })).status === 200);
r = await api("sync", {});
check("RoseWave pulls " + r.body.report.rosewave, /5 orders, 2 members/.test(r.body.report.rosewave));

const home = (await api("home")).body;
// worked out by hand from fakes.mjs (see the comments there)
const sales = 7650 + 5400 + 0 + 5000 + 500 + 4000;
const fees = 278 + 207 + 329 + 175 + 45 + 116;
const print = 3150 + 900, shipCost = 895 + 695, shipCharged = 900 + 700;
console.log(JSON.stringify(home.now));
check("sales " + home.sales.value, home.sales.value === sales);
check("fees " + home.now.fees, home.now.fees === fees);
check("print cost " + home.now.print, home.now.print === print);
check("shipping cost " + home.now.shipping, home.now.shipping === shipCost);
check("shipping charged, less the refund's share " + home.now.shippingCharged, home.now.shippingCharged === shipCharged);
check("profit " + home.profit.value, home.profit.value === sales - fees - print - (shipCost - shipCharged));
check("orders: no sandbox order, no double counting " + home.cards.orders, home.cards.orders === 6);
check("active members " + home.cards.members, home.cards.members === 2);
check("previous period has order C", home.before.sales === 16500);

// a monthly cost: $30 a month counts 30 days' share
check("add a monthly cost", (await api("costs", { note: "Hosting", dollars: "30", kind: "monthly", at: "2020-01-01" })).status === 200);
const withCost = (await api("home")).body;
check("profit less 30 days of $30 a month " + withCost.profit.value, withCost.profit.value === home.profit.value - Math.round((3000 * 12 / 365) * 30));

const orders = (await api("orders")).body.orders;
const a = orders.find((o) => o.id === "rw:a0000000-0001");
check("order A: fee, print and shipping matched " + JSON.stringify([a.fee, a.print, a.shipping, a.profit]), a.fee === 278 && a.print === 3150 && a.shipping === 895 && a.profit === 7650 + 900 - 278 - 3150 - 895);
check("order E refunded", orders.find((o) => o.id === "rw:e0000000-0005").status === "refunded");
check("walk-in sale is in person, tax left out", orders.some((o) => o.channel === "in person" && o.sales === 4000));
check("website order tagged", orders.find((o) => o.id === "rw:b0000000-0002").channel === "website");
check("no Square copies of RoseWave orders left", !orders.some((o) => o.id === "sq:pay_A"));

const best = (await api("best")).body;
const canvas = best.types.find((t) => t.name === "Canvas");
check("best sellers by type; the refunded canvas sold none and lost its fee: " + JSON.stringify(canvas), best.types.some((t) => t.name === "Framed") && best.types.some((t) => t.name === "Memberships") && canvas.units === 0 && canvas.sales === 0 && canvas.profit === -329);
const members = (await api("members")).body;
check("members: MRR " + members.mrr + ", cancelled " + members.cancelled, members.mrr === Math.round(5000 / 12) + 500 && members.cancelled === 1 && members.active === 2);
const trends = (await api("trends?by=week")).body;
check("trends by week", trends.now.length >= 4 && trends.now.reduce((s, p) => s + p.sales, 0) === withCost.now.sales);
const conns = (await api("connections")).body;
check("connections never show keys", !JSON.stringify(conns).includes("sq-token") && conns.connections.every((c) => c.lastOk));

// webhook: refused without the right signature
check("unsigned webhook refused", (await fetch(BASE.replace("api/", "hooks/square"), { method: "POST", body: "{}" })).status === 404);
const hook = BASE.replace("api/", "hooks/square");
// Square signs the address it posts to; under wrangler dev the worker sees the route's host instead of 127.0.0.1
const signed = process.env.ANNEX_HOOK_AS || "http://kno.plus/annex/hooks/square";
const body = JSON.stringify({ type: "payment.updated" });
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("sig-key"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
const sig = Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed + body))).toString("base64");
check("signed webhook accepted", (await fetch(hook, { method: "POST", body, headers: { "x-square-hmacsha256-signature": sig } })).status === 200);
console.log("all good");
