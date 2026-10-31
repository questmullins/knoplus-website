// Stand-ins for RoseWave, Square, Prodigi, Etsy, Cloudflare and Google Search Console, for testing Annex on this machine with `wrangler dev`.
// RoseWave's feed is the real RoseWave worker (its file passed as the first argument) over a stand-in bucket.
// Usage: node test/fakes.mjs <path to rosewave cloud/worker.js> [port]
import http from "node:http";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const rosewave = (await import(pathToFileURL(process.argv[2]).href)).default;
const port = Number(process.argv[3] || 8790);
const ago = (days, hours = 15) => new Date(Date.now() - days * 86400e3 - (hours - 12) * 3600e3).toISOString();
const day = (days) => ago(days).slice(0, 10);
export const KEY = "test-annex-key-0123456789abcdef";

// RoseWave's bucket: four real orders, one old sandbox order, two members
const order = (n, days, extra) => ({ n, u: "", f: "01-blush/02.jpg", h: "The Blush of Autumn · 02", m: false, t: "framed", s: "8x12", x: "black", o: "portrait", p: "", d: 0, k: 0, sm: "Standard", sc: 900, paid: ago(days), stage: "shipped", to: { first: "Ada", last: "Lovelace", email: "ada@example.com", line1: "1 Main St", city: "Austin", state: "TX", zip: "78701" }, live: true, test: false, ch: "app", ...extra });
const orders = [
  order("a0000000-0001", 10, { w: "Framed, 8 × 12 in, Black frame", c: 8550, m: true, square: "pay_A", lab: { id: "ord_A" } }),
  order("b0000000-0002", 3, { w: "Fine art paper, 12 × 18 in", t: "paper", s: "12x18", c: 6100, sc: 700, d: 600, p: "FALL10", square: "pay_B", stage: "printing", ch: "web", h: "Urban Thrill · 05", to: { first: "Grace", last: "Hopper", email: "grace@example.com", state: "NY" } }),
  order("c0000000-0003", 40, { w: "Metal, 16 × 24 in", t: "metal", s: "16x24", c: 17700, sc: 1200, square: "pay_C", h: "NYC550 · 03" }),
  order("e0000000-0005", 2, { w: "Canvas, 12 × 18 in", t: "canvas", s: "12x18", c: 10300, sc: 800, square: "pay_E", h: "Dreaming of a Wave · 01" }),
  { ...order("d0000000-0004", 5, { w: "Framed, 8 × 12 in, Black frame", c: 9400, square: "sandbox_pay" }), live: false, test: undefined },
];
const members = [
  { u: "phoneaaaaaaaaaaaaaaaa", plan: "y", how: "square", sub: "sub_1", customer: "cust_1", card: "card_secret", name: "Ada Lovelace", email: "ada@example.com", status: "ACTIVE", through: day(-345), ends: "", started: ago(20), credit: 1500 },
  { u: "phonebbbbbbbbbbbbbbbb", plan: "m", how: "square", sub: "sub_2", customer: "cust_2", card: "card_secret", name: "Alan Turing", email: "alan@example.com", status: "ACTIVE", through: day(-24), ends: "", started: ago(6), credit: 0 },
];
const files = new Map([...orders.map((o) => ["orders/" + o.n + ".json", o]), ...members.map((m) => ["members/" + m.u + ".json", m])]);
const PHOTOS = {
  async list({ prefix }) { return { objects: [...files.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key, uploaded: new Date() })), truncated: false }; },
  async get(key) { return files.has(key) ? { json: async () => structuredClone(files.get(key)) } : null; },
};

const money = (amount) => ({ amount, currency: "USD" });
const pay = (id, days, amount, fee, extra) => ({ id, created_at: ago(days), amount_money: money(amount), total_money: money(amount), processing_fee: [{ amount_money: money(fee) }], status: "COMPLETED", ...extra });
const square = {
  "locations": { locations: [{ id: "LOC1" }] },
  "invoices/search": { invoices: [{ id: "inv1", subscription_id: "sub_1", order_id: "om1" }, { id: "inv2", subscription_id: "sub_2", order_id: "om2" }] },
  "payments": { payments: [
    pay("pay_A", 10, 8550, 278, { reference_id: "a0000000-0001" }), pay("pay_B", 3, 6100, 207, { reference_id: "b0000000-0002" }),
    pay("pay_C", 40, 17700, 543, { reference_id: "c0000000-0003" }), pay("pay_E", 2, 10300, 329, { reference_id: "e0000000-0005", refunded_money: money(10300) }),
    pay("pay_M1", 20, 5000, 175, { order_id: "om1" }), pay("pay_M2", 6, 500, 45, { order_id: "om2" }),
    pay("pay_P", 4, 4320, 116, { order_id: "op1", card_details: { entry_method: "EMV" }, buyer_email_address: "walkin@example.com" }),
    pay("pay_FAIL", 4, 999, 0, { status: "FAILED" }),
  ] },
  "refunds": { refunds: [{ id: "ref_E", payment_id: "pay_E", created_at: ago(1), amount_money: money(10300), processing_fee: [], status: "COMPLETED" }] },
  "subscriptions/search": { subscriptions: [
    { id: "sub_1", plan_variation_id: "var_y", status: "ACTIVE", start_date: day(20), charged_through_date: day(-345) },
    { id: "sub_2", plan_variation_id: "var_m", status: "ACTIVE", start_date: day(6), charged_through_date: day(-24) },
    { id: "sub_3", plan_variation_id: "var_m", status: "CANCELED", start_date: day(50), canceled_date: day(2), charged_through_date: day(2) },
  ] },
  "disputes": { disputes: [{ id: "dp1", state: "WON", amount_money: money(8550), disputed_payment: { payment_id: "pay_A" }, reported_at: ago(5) }] },
  "orders/batch-retrieve": { orders: [{ id: "op1", total_money: money(4320), total_tax_money: money(320), total_discount_money: money(0), line_items: [{ name: "Art fair print", quantity: "1", gross_sales_money: money(4000) }] }] },
  "catalog/object/var_y": { object: { subscription_plan_variation_data: { name: "Yearly", phases: [{ cadence: "ANNUAL", pricing: { type: "STATIC", price_money: money(5000) } }] } } },
  "catalog/object/var_m": { object: { subscription_plan_variation_data: { name: "Monthly", phases: [{ cadence: "MONTHLY", pricing: { type: "STATIC", price_money: money(500) } }] } } },
};
const charge = (id, print, ship) => [{ id: "ch_" + id, totalCost: { amount: String(print + ship), currency: "USD" }, items: [{ id: "i1", itemSku: "GLOBAL-X", cost: { amount: print.toFixed(2), currency: "USD" } }, { id: "i2", description: "Shipping", cost: { amount: ship.toFixed(2), currency: "USD" } }] }];
const prodigi = { orders: [
  { id: "ord_A", merchantReference: "a0000000-0001", created: ago(10), status: { stage: "Complete" }, charges: charge("A", 31.5, 8.95) },
  { id: "ord_B", merchantReference: "b0000000-0002", created: ago(3), status: { stage: "InProgress" }, charges: charge("B", 9, 6.95) },
  { id: "ord_C", merchantReference: "c0000000-0003", created: ago(40), status: { stage: "Complete" }, charges: charge("C", 20, 11) },
  { id: "ord_E", merchantReference: "e0000000-0005", created: ago(2), status: { stage: "Cancelled" }, charges: charge("E", 25, 9) },
], hasMore: false };
const prodigiSandbox = { orders: [{ id: "ord_D", merchantReference: "d0000000-0004", created: ago(5), status: { stage: "Complete" }, charges: charge("D", 30, 9) }], hasMore: false };


// Cloudflare: two zones with a week of traffic. Google: a token for any signed JWT, and one Search Console property.
const week = [...Array(7)].map((_, i) => day(7 - i));
const cloudflare = (zone, scale) => ({ zoneTag: zone, httpRequests1dGroups: week.map((date, i) => ({ dimensions: { date }, sum: { requests: 1000 * scale + i * 10, pageViews: 100 * scale + i, bytes: 5e6 * scale, threats: i % 2, countryMap: [{ clientCountryName: "US", requests: 800 * scale }, { clientCountryName: "GB", requests: 200 * scale }] }, uniq: { uniques: 40 * scale + i } })) });
const searchRows = { date: week.map((d, i) => ({ keys: [d], clicks: 3 + i, impressions: 100 + i * 10, ctr: (3 + i) / (100 + i * 10), position: 8 })), query: [{ keys: ["kno plus"], clicks: 30, impressions: 120, ctr: 0.25, position: 1.2 }], page: [{ keys: ["https://kno.plus/store/"], clicks: 20, impressions: 300, ctr: 0.0667, position: 6.4 }] };
const body = (req) => new Promise((done) => { let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => done(s)); });

// Etsy: the code for a sign-in is "code-" + its PKCE challenge, so the verifier can be checked. The first token lasts a
// minute, so the first pull has to refresh it. Two paid receipts (one part refunded) and one not paid yet.
const etsyMoney = (cents) => ({ amount: cents, divisor: 100, currency_code: "USD" });
const etsyReceipts = [
  { receipt_id: 7001, created_timestamp: Math.floor(Date.parse(ago(4)) / 1000), status: "Completed", is_paid: true, is_shipped: true, name: "Ada Lovelace",
    total_price: etsyMoney(5000), discount_amt: etsyMoney(500), total_shipping_cost: etsyMoney(600), total_tax_cost: etsyMoney(410), total_vat_cost: etsyMoney(0),
    grandtotal: etsyMoney(5510), refunds: [], transactions: [
      { transaction_id: 1, title: "Golden Hour Print", quantity: 2, price: etsyMoney(1500), variations: [{ formatted_name: "Size", formatted_value: "8x10" }] },
      { transaction_id: 2, title: "Blue Wave Print", quantity: 1, price: etsyMoney(2000), variations: [] }] },
  { receipt_id: 7002, created_timestamp: Math.floor(Date.parse(ago(2)) / 1000), status: "Partially Refunded", is_paid: true, is_shipped: false, name: "Grace Hopper",
    total_price: etsyMoney(3000), discount_amt: etsyMoney(0), total_shipping_cost: etsyMoney(0), total_tax_cost: etsyMoney(0), total_vat_cost: etsyMoney(0),
    grandtotal: etsyMoney(3000), refunds: [{ amount: etsyMoney(1000) }], transactions: [{ transaction_id: 3, title: "Metal Print", quantity: 1, price: etsyMoney(3000), variations: [] }] },
  { receipt_id: 7003, created_timestamp: Math.floor(Date.parse(ago(1)) / 1000), status: "Open", is_paid: false, name: "Not Paid", total_price: etsyMoney(900), grandtotal: etsyMoney(900), transactions: [] },
];
let etsyTokens = 0;
const etsyB64 = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const seen = [];
let lastMail = null;
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const reply = (status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
  seen.push(req.method + " " + url.pathname);
  if (url.pathname.startsWith("/rosewave/")) {
    const r = await rosewave.fetch(new Request("https://rw.test" + url.pathname.slice(9) + url.search, { headers: req.headers }), { PHOTOS, ANNEX_KEY: KEY }, {});
    res.writeHead(r.status, { "Content-Type": "application/json" });
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  if (url.pathname.startsWith("/square/v2/")) {
    if (req.headers.authorization !== "Bearer sq-token") return reply(401, { errors: [{ detail: "bad token" }] });
    const key = url.pathname.slice(11).replace(/\/+$/, "");
    return square[key] ? reply(200, square[key]) : reply(404, { errors: [{ detail: "no " + key }] });
  }
  if (url.pathname.startsWith("/cloudflare/")) {
    if (req.headers.authorization !== "Bearer cf-token") return reply(403, { success: false, errors: [{ message: "bad token" }] });
    if (url.pathname === "/cloudflare/client/v4/zones") {
      // kno.plus and the client's site are active; new-site.art was just added and waits for its nameservers
      const zones = [{ id: "z1", name: "kno.plus", status: "active" }, { id: "z2", name: "example-client.com", status: "active" },
        { id: "z3", name: "new-site.art", status: "pending", name_servers: ["ada.ns.cloudflare.com", "bob.ns.cloudflare.com"] }];
      const named = url.searchParams.get("name");
      return reply(200, { success: true, result: zones.filter((z) => (named ? z.name === named : z.status === url.searchParams.get("status") || !url.searchParams.get("status"))) });
    }
    if (url.pathname === "/cloudflare/client/v4/graphql") {
      const { variables } = JSON.parse(await body(req));
      return reply(200, { data: { viewer: { zones: variables.zones.map((z) => cloudflare(z, z === "z1" ? 3 : 1)) } }, errors: null });
    }
  }
  // the open web, for the checklists: kno.plus loads and its www forwards; new-site.art doesn't load yet
  if (url.pathname.startsWith("/site/")) {
    const host = url.pathname.split("/")[2];
    if (host === "kno.plus" || host === "example-client.com") return reply(200, {});
    if (host === "www.kno.plus") { res.writeHead(301, { Location: "https://kno.plus/" }); return res.end(); }
    if (host === "www.example-client.com") return reply(200, {});
    return reply(522, {});
  }
  if (url.pathname === "/dns") {
    return reply(200, { Answer: url.searchParams.get("name") === "kno.plus" ? [{ data: "10 route1.mx.cloudflare.net." }] : [] });
  }
  if (url.pathname === "/google/token") {
    const form = new URLSearchParams(await body(req));
    return (form.get("assertion") || "").split(".").length === 3 ? reply(200, { access_token: "g-token", expires_in: 3600 }) : reply(400, {});
  }
  if (url.pathname.startsWith("/google/webmasters/v3/")) {
    if (req.headers.authorization !== "Bearer g-token") return reply(401, {});
    if (url.pathname === "/google/webmasters/v3/sites") return reply(200, { siteEntry: [{ siteUrl: "sc-domain:kno.plus", permissionLevel: "siteRestrictedUser" }, { siteUrl: "https://nope.example/", permissionLevel: "siteUnverifiedUser" }] });
    if (url.pathname.endsWith("/searchAnalytics/query")) {
      const { dimensions } = JSON.parse(await body(req));
      return reply(200, { rows: searchRows[dimensions[0]] || [] });
    }
  }
  if (url.pathname === "/etsy/v3/public/oauth/token" && req.method === "POST") {
    const form = new URLSearchParams(await body(req));
    if (form.get("client_id") !== "test-etsy-key") return reply(401, { error: "invalid_client" });
    if (form.get("grant_type") === "authorization_code") {
      const sent = etsyB64(createHash("sha256").update(form.get("code_verifier") || "").digest());
      if (form.get("code") !== "code-" + sent || !/\/annex\/etsy\/callback$/.test(form.get("redirect_uri") || "")) return reply(400, { error: "invalid_grant" });
      return reply(200, { access_token: "1234.access-" + ++etsyTokens, refresh_token: "1234.refresh-" + etsyTokens, expires_in: 60, token_type: "Bearer" });
    }
    if (form.get("grant_type") === "refresh_token" && form.get("refresh_token") === "1234.refresh-" + etsyTokens) {
      return reply(200, { access_token: "1234.access-" + ++etsyTokens, refresh_token: "1234.refresh-" + etsyTokens, expires_in: 3600, token_type: "Bearer" });
    }
    return reply(400, { error: "invalid_grant" });
  }
  if (url.pathname.startsWith("/etsy/v3/application/")) {
    if (req.headers["x-api-key"] !== "test-etsy-key:test-etsy-secret" || req.headers.authorization !== "Bearer 1234.access-" + etsyTokens) return reply(401, { error: "invalid_token" });
    const path = url.pathname.slice("/etsy/v3/application".length);
    if (path === "/users/me") return reply(200, { user_id: 1234, shop_id: 5678 });
    if (path === "/shops/5678/receipts") {
      seen.push("etsy receipts since " + (url.searchParams.get("min_last_modified") || "the start"));
      if (url.searchParams.has("min_last_modified") && !(Number(url.searchParams.get("min_last_modified")) > 946684800)) return reply(400, { error: "Expected a epoch value greater than 946684800 for 'min_last_modified'" });
      const offset = Number(url.searchParams.get("offset") || 0);
      return reply(200, { count: etsyReceipts.length, results: etsyReceipts.slice(offset, offset + Number(url.searchParams.get("limit") || 25)) });
    }
    if (path === "/shops/5678/listings" && url.searchParams.get("state") === "active") return reply(200, { count: 42, results: [] });
  }
  if (url.pathname === "/etsy/seen") return reply(200, seen.filter((s) => s.startsWith("etsy ")));
  if (url.pathname === "/prodigi/v4.0/orders") return req.headers["x-api-key"] === "pd-live" ? reply(200, prodigi) : reply(401, {});
  if (url.pathname === "/prodigi/sandbox/v4.0/orders") return req.headers["x-api-key"] === "pd-sandbox" ? reply(200, prodigiSandbox) : reply(401, {});
  // Resend: keeps the last email so the tests can read the link it carried
  if (url.pathname === "/resend/emails" && req.method === "POST") {
    if (req.headers.authorization !== "Bearer re-test") return reply(401, { message: "API key is invalid" });
    lastMail = JSON.parse(await body(req));
    return reply(200, { id: "mail-" + Date.now() });
  }
  if (url.pathname === "/resend/last") return reply(200, lastMail);
  reply(404, {});
}).listen(port, () => console.log("fakes on " + port));
