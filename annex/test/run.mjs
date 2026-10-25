// End-to-end check against `wrangler dev` (port 8787) and test/fakes.mjs (port 8790): set up, connect, pull, and
// compare the dashboard's numbers with the sums worked out by hand from the fakes.
import assert from "node:assert/strict";

const BASE = process.env.ANNEX_URL || "http://127.0.0.1:8787/annex/api/";
let cookie = "";
async function api(path, body, method) {
  const r = await fetch(BASE + path, {
    method: method || (body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = r.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const check = (name, ok) => { assert.ok(ok, name); console.log("ok  " + name); };

check("needs setup", (await api("me")).body.setup === true);
check("wrong setup code refused", (await api("setup", { code: "nope", email: "q@example.com", password: "long enough pw" })).status === 403);
check("short password refused", (await api("setup", { code: "test-setup-code-123", email: "q@example.com", password: "short" })).status === 400);
check("set up", (await api("setup", { code: "test-setup-code-123", accountName: "Rose Wave", name: "Quest", email: "Q@example.com", password: "a long password", tz: "America/Chicago" })).status === 200);
check("second setup refused", (await api("setup", { code: "test-setup-code-123", email: "x@example.com", password: "a long password" })).status === 409);
const saved = cookie;
cookie = "";
check("data needs sign-in", (await api("home")).status === 401);
check("wrong password refused", (await api("login", { email: "q@example.com", password: "wrong password" })).status === 401);
check("signs in", (await api("login", { email: "q@example.com", password: "a long password" })).status === 200);
check("other site can't post", (await fetch(BASE + "sync", { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie, Origin: "https://evil.example" }, body: "{}" })).status === 403);

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
check("signs out", (await api("logout", {})).status === 200 && (await api("home")).status === 401);
cookie = saved;
console.log("all good");
