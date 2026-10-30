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
  const ask = () => fetch(BASE + path, {
    method: method || (body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", Origin: ORIGIN, Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  // wrangler dev can drop an idle kept-alive socket while the tests write to the database directly: ask again once
  const r = await ask().catch(ask);
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const check = (name, ok) => { assert.ok(ok, name); console.log("ok  " + name); };

// a fresh start: no account, no sales (the local database only; d1 never touches the real one with --local)
for (const file of ["annex/schema/shared.sql", "annex/schema/account.sql"]) execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "knoplus-clients", "--local", "--file", file], { stdio: "pipe" });
d1(["accounts", "assets", "guides", "connections", "orders", "lines", "payments", "refunds", "costs", "customers", "subscriptions"].map((t) => `DELETE FROM ${t};`).join(" "));

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
check("connections never show keys", !JSON.stringify(conns).includes("sq-token") && conns.connections.filter((c) => c.id !== "etsy").every((c) => c.lastOk));

// the workspace around the sales: assets, websites (Cloudflare and Search Console stand-ins), clients, overview
const assets = (await api("assets")).body;
check("assets start with RoseWave, UpDate and client websites", ["rosewave", "update", "websites"].every((id) => assets.assets.some((a) => a.id === id)));
check("RoseWave's asset carries its 30-day sales", assets.assets.find((a) => a.id === "rosewave").numbers.sales === home.sales.value);
check("client websites carry client numbers", assets.assets.find((a) => a.id === "websites").numbers.kind === "clients");
check("asset id checked", (await api("assets", { id: "Bad Id!", name: "x" })).status === 400);
check("asset link checked", (await api("assets", { id: "shop", name: "Shop", link: "javascript:alert(1)" })).status === 400);
check("asset added", (await api("assets", { id: "shop", name: "Shop", kind: "store", link: "/store", sort: 5 })).status === 200 && (await api("assets")).body.assets.some((a) => a.id === "shop"));
check("asset removed", (await api("assets/shop", {}, "DELETE")).status === 200 && !(await api("assets")).body.assets.some((a) => a.id === "shop"));
const web = (await api("websites?days=7")).body;
check("Cloudflare: both zones, busiest first", web.connected && web.zones.map((z) => z.name).join() === "kno.plus,example-client.com");
const kp = web.zones[0];
check("Cloudflare totals add up: " + JSON.stringify(kp.totals), kp.days.length === 7 && kp.totals.visitors === 7 * 120 + 21 && kp.totals.pageViews === 7 * 300 + 21 && kp.countries[0].name === "US");
check("websites range checked", (await api("websites?days=5")).status === 400);
const sc = (await api("search?days=7")).body;
check("Search Console: the verified property only", sc.connected && sc.sites.length === 1 && sc.sites[0].site === "sc-domain:kno.plus");
const t = sc.sites[0].totals;
check("Search Console click-through rate: " + JSON.stringify(t), t.clicks === 7 * 3 + 21 && t.impressions === 700 + 210 && Math.abs(t.ctr - 42 / 910) < 1e-9 && sc.sites[0].queries[0].name === "kno plus");
check("clients list", Array.isArray((await api("clients")).body.projects));

// clients, managed from Annex: projects with a domain and status, clients on them, and password links by email
const FAKES = "http://127.0.0.1:8790";
const lastMail = async () => (await fetch(FAKES + "/resend/last")).json();
const proj = run.toLowerCase().slice(0, 40);
check("a project needs a good id", (await api("clients/project", { id: "Bad Id", name: "x" })).status === 400);
check("a project's domain is checked", (await api("clients/project", { id: proj, name: "Test site", domain: "not a domain" })).status === 400);
check("project saved with domain and status", (await api("clients/project", { id: proj, name: "Test site", domain: "https://Example-Client.com/about", status: "Payment needed" })).status === 200);
let table = (await api("clients")).body;
let row = table.projects.find((p) => p.id === proj);
check("the table shows the domain and status", row.domain === "example-client.com" && row.status === "Payment needed" && table.statuses.includes("Ongoing") && table.email === true);
const newClient = await api("clients/client", { name: "Ada Test", email: `${run}-ada@example.test`, projectId: proj });
let mail = await lastMail();
check("a new client is emailed an invite from info@kno.plus", newClient.body.emailed === true && mail.to[0] === `${run}-ada@example.test` && /info@kno\.plus/.test(mail.from) && mail.text.includes(newClient.body.link));
row = (await api("clients")).body.projects.find((p) => p.id === proj);
const ada = row.clients[0];
check("the client shows on their project", ada && ada.name === "Ada Test" && !ada.disabled);
check("a client can't be added twice by email", (await api("clients/client", { email: `${run}-ada@example.test`, projectId: proj })).body.existing === true);
const reset = await api("clients/reset", { userId: ada.id });
mail = await lastMail();
check("reset email sent with a one-hour link", reset.body.emailed === true && reset.body.expiresHours === 1 && mail.subject.includes("Reset") && mail.text.includes(reset.body.link));
const copied = await api("clients/reset", { userId: ada.id, send: false });
check("a reset link can be copied instead", copied.body.emailed === false && copied.body.link !== reset.body.link && (await lastMail()).text.includes(reset.body.link));
const used = await fetch(ORIGIN + "/api/clients/reset", { method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGIN }, body: JSON.stringify({ token: copied.body.link.split("#reset=")[1], password: "a brand new password" }) });
check("the client sets a password with the link", used.status === 200);
const stale = await fetch(ORIGIN + "/api/clients/reset", { method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGIN }, body: JSON.stringify({ token: reset.body.link.split("#reset=")[1], password: "a brand new password" }) });
check("the older link stopped working", stale.status === 400);
check("name and email edited", (await api("clients/person", { userId: ada.id, name: "Ada L", email: `${run}-ada2@example.test` })).status === 200);
check("an update posted", (await api("clients/update", { projectId: proj, title: "Week one", body: "Pages are up." })).status === 200);
row = (await api("clients")).body.projects.find((p) => p.id === proj);
check("the table shows the edit and the update", row.clients[0].email === `${run}-ada2@example.test` && row.updates === 1 && row.latest.title === "Week one");
check("access turned off", (await api("clients/disable", { userId: ada.id, disabled: true })).status === 200 && (await api("clients")).body.projects.find((p) => p.id === proj).clients[0].disabled);
check("no reset link while access is off", (await api("clients/reset", { userId: ada.id })).status === 400);
check("removed from the project", (await api("clients/access", { userId: ada.id, projectId: proj, allow: false })).status === 200 && (await api("clients")).body.projects.find((p) => p.id === proj).clients.length === 0);
check("an unknown action is refused", (await api("clients/nope", {})).status >= 400);
process.on("exit", () => d1(`DELETE FROM updates WHERE project_id = '${proj}'; DELETE FROM grants WHERE project_id = '${proj}'; DELETE FROM projects WHERE id = '${proj}'; DELETE FROM resets WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${run}%'); DELETE FROM users WHERE email LIKE '${run}%';`));
const overview = (await api("overview")).body;
check("overview adds up the assets and the web", overview.sales === home.sales.value && overview.web.connected && overview.web.zones === 2 && overview.assets.length >= 3);
const firstGuides = (await api("guides")).body;
check("guides start empty, with the built-in SOPs", firstGuides.guides.length === 0 && firstGuides.sops.some((g) => g.items.some((i) => i.id === "client-password")));
check("a guide needs a title", (await api("guides", { title: "", body: "x" })).status === 400);
check("guides import section by section", (await api("guides", { guides: [{ title: "Quick answers", body: "### Reset a password\n\n1. Go" }, { title: "Words you'll see", body: "| a | b |" }] })).body.saved === 2);
const guides = (await api("guides")).body.guides;
check("guides listed in order with ids from titles", guides.map((g) => g.id).join() === "quick-answers,words-you-ll-see");
check("one guide opens", (await api("guides/quick-answers")).body.body.includes("Reset a password"));
check("guide saved again replaces it", (await api("guides", { id: "quick-answers", title: "Quick answers", body: "new" })).status === 200 && (await api("guides/quick-answers")).body.body === "new");
check("guide deleted", (await api("guides/words-you-ll-see", {}, "DELETE")).status === 200 && (await api("guides/words-you-ll-see")).status === 404);
cookie = client;
check("a client can't see the workspace or the guides", (await api("overview")).status === 403 && (await api("websites")).status === 403 && (await api("assets")).status === 403 && (await api("guides")).status === 403);
check("a client can't manage clients", (await api("clients")).status === 403 && (await api("clients/reset", { userId: "x" })).status === 403);
cookie = admin;

// webhook: refused without the right signature
check("unsigned webhook refused", (await fetch(BASE.replace("api/", "hooks/square"), { method: "POST", body: "{}" })).status === 404);
const hook = BASE.replace("api/", "hooks/square");
// Square signs the address it posts to; under wrangler dev the worker sees the route's host instead of 127.0.0.1
const signed = process.env.ANNEX_HOOK_AS || "http://kno.plus/annex/hooks/square";
const body = JSON.stringify({ type: "payment.updated" });
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("sig-key"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
const sig = Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed + body))).toString("base64");
check("signed webhook accepted", (await fetch(hook, { method: "POST", body, headers: { "x-square-hmacsha256-signature": sig } })).status === 200);
// Etsy: sales by file, and Etsy's fees worked out from its rates
const D = "2025-01-15";
const etsyOrders = [
  "Sale Date,Order ID,Buyer User ID,Full Name,Number of Items,Currency,Order Value,Coupon Code,Discount Amount,Shipping Discount,Shipping,Sales Tax,Order Total,Status,Card Processing Fees,Order Net,Adjusted Order Total",
  `01/15/25,9001,b1,"Lovelace, Ada",2,USD,40.00,,0,0,5.00,3.00,48.00,Completed,,,48.00`,
  `01/15/25,9002,b2,Grace Hopper,1,USD,20.00,,0,0,0,0,20.00,Completed,0.85,,10.00`,
].join("\n");
check("Etsy settings saved", (await api("connections/etsy", { opened: D, listings: 10, conversion: false, offsiteRate: 15 })).status === 200);
check("a file that isn't Etsy's is refused", (await api("etsy/import", { csv: "a,b\n1,2" })).status === 400);
const imported = (await api("etsy/import", { csv: etsyOrders })).body;
check("Etsy orders imported", imported.kind === "orders" && imported.count === 2);
check("importing again doesn't double them", (await api("etsy/import", { csv: etsyOrders })).body.count === 2);
let ec = (await api(`costs?from=${D}&to=${D}`)).body.total;
// order 1: 6.5% of 45.00 = 2.93, 3% of 48.00 + 0.25 = 1.69, 2 items renew = 0.40. Order 2: 1.30, Etsy's own 0.85, 0.20,
// half refunded gives back 0.65. Plus $29 to open the shop and 10 listings at $0.20 every 4 months (1.64 a day).
check("Etsy fees part by part: " + JSON.stringify(ec), ec.etsyTransaction === 293 + 130 - 65 && ec.etsyProcessing === 169 + 85 && ec.etsyListing === 60 + 2 && ec.etsySetup === 2900 && ec.etsy === 3574);
let eh = (await api(`home?from=${D}&to=${D}`)).body.now;
check("gross and net after fees: " + JSON.stringify({ gross: eh.gross, net: eh.net }), eh.sales === 5000 && eh.gross === 5500 && eh.net === 5500 - 3574 && eh.profit === eh.net - eh.other);
check("offsite ad marked", (await api("etsy/offsite", { orderId: "etsy:9001", on: true })).status === 200);
ec = (await api(`costs?from=${D}&to=${D}`)).body.total;
check("Offsite Ads fee, 15% of 45.00", ec.etsyOffsite === 675 && ec.etsy === 3574 + 675);
check("currency conversion on", (await api("connections/etsy", { opened: D, listings: 10, conversion: true, offsiteRate: 12 })).status === 200);
ec = (await api(`costs?from=${D}&to=${D}`)).body.total;
check("settings work every order out again: " + JSON.stringify(ec), ec.etsyConversion === 108 + 45 && ec.etsyOffsite === 540);
const items = "Sale Date,Item Name,Buyer,Quantity,Price,Coupon Code,Order ID,Transaction ID,Variations,Item Total\n01/15/25,Golden Hour Print,Ada,2,20.00,,9001,t1,Size: 8x10,40.00";
check("Etsy items filled in", (await api("etsy/import", { csv: items })).body.kind === "items");
const eo = (await api(`orders?from=${D}&to=${D}`)).body.orders;
const e1 = eo.find((o) => o.id === "etsy:9001");
check("an Etsy order shows what sold and its fees", e1 && e1.items[0] === "Golden Hour Print · Size: 8x10" && e1.channel === "Etsy" && e1.customer === "Lovelace, Ada" && e1.fee === 293 + 169 + 40 + 108 + 540);
check("Etsy shows as connected", /2 Etsy orders/.test((await api("connections")).body.connections.find((c) => c.id === "etsy").message));
// Etsy Plus: $10 a month, the setup fee waived, and 15 listing credits ($3.00) a month off listing fees
check("Etsy Plus on", (await api("connections/etsy", { opened: "2025-03-01", listings: 30, plus: true, setupWaived: true })).status === 200);
ec = (await api("costs?from=2025-03-01&to=2025-03-31")).body.total;
check("Plus: $10 a month, no setup fee, credits cover the listings: " + JSON.stringify(ec), ec.etsyPlus === 1019 && ec.etsySetup === 0 && ec.etsyListing === 153 && ec.etsyCredits === -153 && ec.etsy === 1019);
check("lots of listings", (await api("connections/etsy", { opened: "2025-03-01", listings: 300, plus: true, setupWaived: true })).status === 200);
ec = (await api("costs?from=2025-03-01&to=2025-04-30")).body.total;
check("credits stop at $3.00 a month: " + JSON.stringify(ec), ec.etsyCredits === -600);
process.on("exit", () => d1("DELETE FROM lines WHERE order_id LIKE 'etsy:%'; DELETE FROM orders WHERE source = 'etsy'; DELETE FROM payments WHERE source = 'etsy'; DELETE FROM refunds WHERE id LIKE 'etsy-refund:%'; DELETE FROM connections WHERE id = 'etsy';"));
console.log("all good");
