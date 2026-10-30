// Etsy: sales come in from the files Etsy lets you download (Shop Manager › Settings › Options › Download Data):
// "Orders" for each order's money and "Order Items" for what was in it. Etsy's own fees are worked out here from
// its published rates, since the files don't list most of them:
//
//   transaction     6.5% of the order total, sales tax left out (goods after discounts, plus shipping)
//   processing      3% of the order total with tax and shipping, plus $0.25; Etsy's own figure from the file when given
//   listing         $0.20 each time an item sells (the listing renews), plus $0.20 per active listing every 4 months
//   setup           $29 once, on the day the shop opened (waived by some Etsy Plus deals: a setting)
//   Etsy Plus       $10 a month, with 15 listing credits a month ($3.00 of listing fees) that don't roll over; its
//                   $5 a month of Etsy Ads credit is for Etsy's own ads, which Annex doesn't count, so it isn't used
//   conversion      2.5% of what you receive, only when the shop's currency differs from your bank's (a setting)
//   offsite ads     15% (or 12%, a setting) of the order total for orders marked as from an Offsite Ad, at most $100
//
// Refunds give back the transaction fee in proportion; the processing fee isn't returned.
//
// Once the shop is linked with Connect Etsy (etsy-link.js), sales also come straight from Etsy's API: every night,
// and a few seconds after Etsy's webhook says an order or listing changed. Files still work for anything older.
import { decimalCents } from "../util.js";
import { etsyClient, ready } from "./etsy-link.js";

export const about = {
  id: "etsy",
  name: "Etsy",
  // the app's keys are shared by every account, so they aren't named after one (see etsy-link.js)
  secrets: ["ETSY_KEY", "ETSY_SECRET", "ETSY_WEBHOOK_SECRET"],
  optional: ["ETSY_WEBHOOK_SECRET"], // only for the webhook; without it, pulls still run nightly and on Refresh
  plainSecrets: true,
  // config = { opened, listings, conversion, offsiteRate, plus, plusFrom, setupWaived }
};

// RoseWave's Etsy shop as Quest set it up: opened 2026-10-30 with Etsy Plus from the start and the setup fee waived.
// Filled into the Etsy settings until they're first saved (sync.js), so the fees count from day one.
export const SHOP = { opened: "2026-10-30", setupWaived: true, plus: true };

export const RATES = { transaction: 0.065, processing: 0.03, processingFixed: 25, listing: 20, setup: 2900, conversion: 0.025, offsiteCap: 10000, plus: 1000, plusCredits: 15 };

// Linked: pulls the orders Etsy changed since the last pull (all of them the first time) and the active listing count.
// Not linked: counts the orders that came from files, so the connection's status stays honest.
export async function pull({ db, env, config, cursor, days, full, base }) {
  const etsy = env && (await etsyClient(env, db, base));
  if (!etsy) {
    const row = await db.prepare("SELECT COUNT(*) AS n FROM orders WHERE source = 'etsy'").first();
    if (row.n) return { counted: `${row.n} Etsy orders, from the files you imported` };
    return { skipped: env && ready(env) ? "Not linked. Press Connect Etsy, or import Etsy's orders file." : "No Etsy orders yet. Import Etsy's orders file to bring them in." };
  }
  const started = new Date().toISOString();
  // a day's overlap, so nothing changed during the last pull is missed
  const since = full ? 0 : Math.floor((days ? Date.now() - days * 86400e3 : Date.parse(cursor || 0) - 86400e3 || Date.now() - 30 * 86400e3) / 1000);
  const receipts = [];
  for (let offset = 0; offset < 10000; offset += 100) {
    const page = await etsy.call(`/shops/${etsy.shop}/receipts?limit=100&offset=${offset}` + (since > 0 ? "&min_last_modified=" + since : ""));
    receipts.push(...(page.results || []));
    if ((page.results || []).length < 100) break;
  }
  const kept = new Map((await db.prepare("SELECT id, detail FROM orders WHERE source = 'etsy'").all()).results.map((o) => [o.id, JSON.parse(o.detail || "{}")]));
  // an order still waiting on payment isn't a sale yet
  const sales = receipts.filter((r) => r.is_paid !== false);
  const writes = sales.flatMap((r) => receiptWrites(db, r, kept.get("etsy:" + r.receipt_id) || {}, config));
  for (let i = 0; i < writes.length; i += 80) await db.batch(writes.slice(i, i + 80));
  // Etsy's own count of active listings replaces the one typed in Settings
  const listings = await etsy.call(`/shops/${etsy.shop}/listings?state=active&limit=1`).then((b) => b.count, () => null);
  if (Number.isInteger(listings)) {
    await db.prepare(`INSERT INTO connections (id, config) VALUES ('etsy', json_object('listings', ?1))
      ON CONFLICT(id) DO UPDATE SET config = json_set(connections.config, '$.listings', ?1)`).bind(listings).run();
  }
  const total = (await db.prepare("SELECT COUNT(*) AS n FROM orders WHERE source = 'etsy'").first()).n;
  return { counted: `Linked to Etsy. ${total} Etsy orders` + (sales.length ? `, ${sales.length} brought up to date` : "") + (Number.isInteger(listings) ? `; ${listings} active listings` : ""), cursor: started };
}

// Etsy writes money as { amount, divisor, currency_code }
const cents = (m) => (m && m.amount ? Math.round((m.amount * 100) / (m.divisor || 100)) : 0);

// One receipt from Etsy's API as an order, its lines (one per item sold) and its fees.
export function receiptWrites(db, r, before, config) {
  const ref = String(r.receipt_id), id = "etsy:" + ref;
  const paid = cents(r.grandtotal);
  const refunded = Math.min(paid, (r.refunds || []).reduce((s, x) => s + cents(x.amount), 0));
  const status = /cancel/i.test(r.status || "") ? "cancelled" : refunded >= paid && paid > 0 ? "refunded" : "paid";
  const items = r.transactions || [];
  const detail = {
    items: items.reduce((s, t) => s + (Number(t.quantity) || 1), 0) || before.items || 1,
    refunded, offsite: !!before.offsite, shipped: r.is_shipped ? "yes" : "", currency: (r.grandtotal || {}).currency_code || "", from: "api",
  };
  const o = {
    id, placed_at: new Date((r.created_timestamp || r.create_timestamp) * 1000).toISOString(), status, customer: r.name || "",
    goods_cents: cents(r.total_price), discount_cents: cents(r.discount_amt), shipping_cents: cents(r.total_shipping_cost),
    tax_cents: cents(r.total_tax_cost) + cents(r.total_vat_cost), paid_cents: paid, promo: "", payment: id, ref, detail: JSON.stringify(detail),
  };
  const lines = items.length ? [db.prepare("DELETE FROM lines WHERE order_id = ?").bind(id), ...items.map((t, i) => {
    const qty = Number(t.quantity) || 1;
    const variant = (t.variations || []).map((v) => `${v.formatted_name}: ${v.formatted_value}`).join(", ");
    return db.prepare("INSERT INTO lines (id, order_id, kind, product, collection, variant, qty, cents) VALUES (?, ?, 'print', ?, '', ?, ?, ?)")
      .bind(id + ":" + (t.transaction_id || i + 1), id, t.title || "Etsy item", variant, qty, cents(t.price) * qty);
  })] : [];
  return [...orderWrites(db, o), ...lines, ...feeWrites(db, o, config)];
}

// Files one Etsy order (from a file or the API); until its items are known it stands as one line.
function orderWrites(db, o) {
  return [
    db.prepare(
      `INSERT INTO orders (id, source, channel, placed_at, status, customer, goods_cents, discount_cents, shipping_cents, tax_cents, paid_cents, promo, member, payment, ref, detail, test)
       VALUES (?, 'etsy', 'Etsy', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0)
       ON CONFLICT(id) DO UPDATE SET placed_at = excluded.placed_at, status = excluded.status, customer = excluded.customer, goods_cents = excluded.goods_cents,
         discount_cents = excluded.discount_cents, shipping_cents = excluded.shipping_cents, tax_cents = excluded.tax_cents, paid_cents = excluded.paid_cents,
         promo = excluded.promo, payment = excluded.payment, ref = excluded.ref, detail = excluded.detail`,
    ).bind(o.id, o.placed_at, o.status, o.customer, o.goods_cents, o.discount_cents, o.shipping_cents, o.tax_cents, o.paid_cents, o.promo, o.payment, o.ref, o.detail),
    db.prepare("INSERT INTO lines (id, order_id, kind, product, collection, variant, qty, cents) SELECT ?, ?, 'other', 'Etsy order', '', '', ?, ? WHERE NOT EXISTS (SELECT 1 FROM lines WHERE order_id = ?)")
      .bind(o.id + ":all", o.id, JSON.parse(o.detail).items, o.goods_cents, o.id),
  ];
}

// One order's Etsy fees, in cents, from what it sold for and the account's Etsy settings.
export function orderFees(o, detail, config) {
  const base = o.goods_cents - o.discount_cents + o.shipping_cents;
  const transaction = Math.round(base * RATES.transaction);
  const processing = Number.isFinite(detail.processingFee) ? detail.processingFee : Math.round((base + o.tax_cents) * RATES.processing) + RATES.processingFixed;
  const listing = RATES.listing * Math.max(1, detail.items || 1);
  const conversion = config.conversion ? Math.round((base + o.tax_cents - transaction - processing) * RATES.conversion) : 0;
  const offsite = detail.offsite ? Math.min(RATES.offsiteCap, Math.round(base * (config.offsiteRate === 12 ? 0.12 : 0.15))) : 0;
  return { transaction, processing, listing, conversion, offsite };
}
const sum = (fees) => Object.values(fees).reduce((s, c) => s + c, 0);

// The writes that file one order's fees: the payment carries their total, the order's detail the parts.
export function feeWrites(db, o, config) {
  const detail = JSON.parse(o.detail || "{}");
  detail.fees = orderFees(o, detail, config);
  const writes = [
    db.prepare("UPDATE orders SET detail = ? WHERE id = ?").bind(JSON.stringify(detail), o.id),
    db.prepare(`INSERT INTO payments (id, source, created_at, amount_cents, fee_cents, status, ref, test) VALUES (?, 'etsy', ?, ?, ?, 'COMPLETED', ?, 0)
      ON CONFLICT(id) DO UPDATE SET created_at = excluded.created_at, amount_cents = excluded.amount_cents, fee_cents = excluded.fee_cents, ref = excluded.ref`)
      .bind(o.payment, o.placed_at, o.paid_cents, sum(detail.fees), o.ref),
  ];
  // a refund gives back the transaction fee in proportion to the money returned
  const back = detail.refunded || 0;
  writes.push(back > 0
    ? db.prepare(`INSERT INTO refunds (id, payment, created_at, amount_cents, fee_cents, status, test) VALUES (?, ?, ?, ?, ?, 'COMPLETED', 0)
        ON CONFLICT(id) DO UPDATE SET amount_cents = excluded.amount_cents, fee_cents = excluded.fee_cents, created_at = excluded.created_at`)
      .bind("etsy-refund:" + o.ref, o.payment, o.placed_at, back, -Math.round((detail.fees.transaction * back) / Math.max(1, o.paid_cents)))
    : db.prepare("DELETE FROM refunds WHERE id = ?").bind("etsy-refund:" + o.ref));
  return writes;
}

// Works every Etsy order's fees out again, after a setting changed.
export async function refigure(db, config) {
  const orders = (await db.prepare("SELECT * FROM orders WHERE source = 'etsy'").all()).results;
  const writes = orders.flatMap((o) => feeWrites(db, o, config));
  for (let i = 0; i < writes.length; i += 80) await db.batch(writes.slice(i, i + 80));
  return orders.length;
}

// ---------- reading Etsy's files ----------
export function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== "")) rows.push(row);
  const [head = [], ...body] = rows;
  const names = head.map((h) => h.replace(/^﻿/, "").trim());
  return body.map((r) => Object.fromEntries(names.map((n, i) => [n, (r[i] || "").trim()])));
}

const money = (v) => decimalCents(String(v || "").replace(/[^0-9.-]/g, ""));
// Etsy writes dates as 10/28/26 (or 10/28/2026); the sale is filed at midday UTC so it lands on that day
function isoDay(v) {
  const m = String(v || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}T12:00:00Z`;
  return /^\d{4}-\d{2}-\d{2}/.test(v || "") ? v.slice(0, 10) + "T12:00:00Z" : "";
}

// Takes either file. The orders file makes or updates each order and its fees; the items file fills in what sold.
export async function importFile(db, text, config) {
  const rows = parseCsv(text);
  if (!rows.length) return { error: "That file is empty." };
  const has = (k) => k in rows[0];
  if (has("Order ID") && has("Item Name")) return importItems(db, rows);
  if (!has("Order ID") || !has("Sale Date") || !(has("Order Value") || has("Order Total"))) {
    return { error: "That doesn't look like Etsy's Orders or Order Items file. Download it from Shop Manager › Settings › Options › Download Data." };
  }
  const writes = [];
  let count = 0;
  const kept = new Map((await db.prepare("SELECT id, detail FROM orders WHERE source = 'etsy'").all()).results.map((o) => [o.id, JSON.parse(o.detail || "{}")]));
  for (const r of rows) {
    const at = isoDay(r["Sale Date"]);
    if (!r["Order ID"] || !at) continue;
    const id = "etsy:" + r["Order ID"];
    const goods = money(r["Order Value"]);
    const discount = money(r["Discount Amount"]) + money(r["Shipping Discount"]);
    const shipping = money(r["Shipping"]);
    const tax = money(r["Sales Tax"]);
    const paid = money(r["Order Total"]) || goods - discount + shipping + tax;
    const adjusted = r["Adjusted Order Total"] ? money(r["Adjusted Order Total"]) : paid;
    const status = /cancel/i.test(r["Status"] || "") ? "cancelled" : adjusted <= 0 && paid > 0 ? "refunded" : "paid";
    const before = kept.get(id) || {};
    const detail = {
      items: Number(r["Number of Items"]) || before.items || 1,
      processingFee: r["Card Processing Fees"] !== undefined && r["Card Processing Fees"] !== "" ? Math.abs(money(r["Card Processing Fees"])) : undefined,
      refunded: Math.max(0, paid - adjusted),
      offsite: !!before.offsite,
      shipped: r["Date Shipped"] || "",
      currency: r["Currency"] || "",
    };
    const o = {
      id, placed_at: at, status, customer: r["Full Name"] || r["Buyer"] || "", goods_cents: goods, discount_cents: discount, shipping_cents: shipping,
      tax_cents: tax, paid_cents: paid, promo: r["Coupon Code"] || "", payment: id, ref: r["Order ID"], detail: JSON.stringify(detail),
    };
    writes.push(...orderWrites(db, o), ...feeWrites(db, o, config));
    count++;
  }
  for (let i = 0; i < writes.length; i += 80) await db.batch(writes.slice(i, i + 80));
  return { ok: true, kind: "orders", count };
}

async function importItems(db, rows) {
  const byOrder = new Map();
  for (const r of rows) {
    if (!r["Order ID"]) continue;
    if (!byOrder.has(r["Order ID"])) byOrder.set(r["Order ID"], []);
    byOrder.get(r["Order ID"]).push(r);
  }
  const writes = [];
  for (const [ref, items] of byOrder) {
    const id = "etsy:" + ref;
    writes.push(db.prepare("DELETE FROM lines WHERE order_id = ?").bind(id));
    items.forEach((r, i) => {
      const qty = Number(r["Quantity"]) || 1;
      writes.push(db.prepare("INSERT INTO lines (id, order_id, kind, product, collection, variant, qty, cents) VALUES (?, ?, 'print', ?, '', ?, ?, ?)")
        .bind(id + ":" + (r["Transaction ID"] || i + 1), id, r["Item Name"] || "Etsy item", (r["Variations"] || "").replace(/\s+/g, " "), qty, money(r["Item Total"]) || money(r["Price"]) * qty));
    });
  }
  for (let i = 0; i < writes.length; i += 80) await db.batch(writes.slice(i, i + 80));
  return { ok: true, kind: "items", count: byOrder.size };
}

// Marks an order as from an Offsite Ad (or not) and works its fees out again.
export async function markOffsite(db, orderId, on, config) {
  const o = await db.prepare("SELECT * FROM orders WHERE id = ? AND source = 'etsy'").bind(orderId).first();
  if (!o) return { error: "There's no Etsy order like that." };
  const detail = JSON.parse(o.detail || "{}");
  detail.offsite = !!on;
  await db.batch(feeWrites(db, { ...o, detail: JSON.stringify(detail) }, config));
  return { ok: true };
}
