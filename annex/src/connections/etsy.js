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
import { decimalCents } from "../util.js";

export const about = {
  id: "etsy",
  name: "Etsy",
  // nothing secret: config = { opened, listings, conversion, offsiteRate, plus, plusFrom, setupWaived }
  secrets: [],
};

export const RATES = { transaction: 0.065, processing: 0.03, processingFixed: 25, listing: 20, setup: 2900, conversion: 0.025, offsiteCap: 10000, plus: 1000, plusCredits: 15 };

// Etsy has no pull yet: its sales arrive by file. This keeps the connection's status honest.
export async function pull({ db }) {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM orders WHERE source = 'etsy'").first();
  return row.n ? { counted: `${row.n} Etsy orders, from the files you imported` } : { skipped: "No Etsy orders yet. Import Etsy's orders file to bring them in." };
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
      id, placed_at: at, goods_cents: goods, discount_cents: discount, shipping_cents: shipping, tax_cents: tax, paid_cents: paid,
      payment: id, ref: r["Order ID"], detail: JSON.stringify(detail),
    };
    writes.push(db.prepare(
      `INSERT INTO orders (id, source, channel, placed_at, status, customer, goods_cents, discount_cents, shipping_cents, tax_cents, paid_cents, promo, member, payment, ref, detail, test)
       VALUES (?, 'etsy', 'Etsy', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0)
       ON CONFLICT(id) DO UPDATE SET placed_at = excluded.placed_at, status = excluded.status, customer = excluded.customer, goods_cents = excluded.goods_cents,
         discount_cents = excluded.discount_cents, shipping_cents = excluded.shipping_cents, tax_cents = excluded.tax_cents, paid_cents = excluded.paid_cents,
         promo = excluded.promo, payment = excluded.payment, ref = excluded.ref, detail = excluded.detail`,
    ).bind(id, at, status, r["Full Name"] || r["Buyer"] || "", goods, discount, shipping, tax, paid, r["Coupon Code"] || "", id, r["Order ID"], o.detail));
    // until the items file comes in, the order stands as one line
    writes.push(db.prepare("INSERT INTO lines (id, order_id, kind, product, collection, variant, qty, cents) SELECT ?, ?, 'other', 'Etsy order', '', '', ?, ? WHERE NOT EXISTS (SELECT 1 FROM lines WHERE order_id = ?)")
      .bind(id + ":all", id, detail.items, goods, id));
    writes.push(...feeWrites(db, { ...o, source: "etsy" }, config));
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
