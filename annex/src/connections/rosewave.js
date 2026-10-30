// RoseWave's own records: print orders (which photo, print, promo code, member price, shipping charged) and
// memberships, read from the RoseWave worker's annex/feed. Payments, fees and refunds come from Square.
import { call } from "../util.js";

export const about = {
  id: "rosewave",
  name: "RoseWave orders",
  // config: url = the RoseWave worker's address; the feed's key is the Worker secret <ACCOUNT>_ANNEX_KEY
  // (ROSEWAVE_ANNEX_KEY), the same text as ANNEX_KEY on the RoseWave worker
  secrets: ["ANNEX_KEY"],
};

const STAGES = { paid: "paid", hand: "paid", sent: "printing", printing: "printing", shipped: "shipped", cancelled: "cancelled" };

export async function pull(ctx) {
  const { db, config, secret, cursor, full, base } = ctx;
  const key = secret("ANNEX_KEY") || secret("ROSEWAVE_KEY"); // its name before 2026-10-30, still read
  if (!config.url || !key) return { skipped: "Add the RoseWave worker's address and its key to connect." };
  // a day's overlap, so an order written while the last pull ran is never missed
  const since = full || !cursor ? "" : new Date(Date.parse(cursor) - 86400e3).toISOString();
  const url = (base || config.url.replace(/\/+$/, "")) + "/annex/feed" + (since ? "?since=" + encodeURIComponent(since) : "");
  const got = await call(url, { headers: { Authorization: "Bearer " + key } }, 60);
  if (!got.ok) throw new Error(got.status === 404 ? "RoseWave didn't accept the key (or its worker is older than the Annex feed)" : "RoseWave answered " + got.status);
  const feed = got.said;
  const plans = feed.plans || {};
  const writes = [];
  for (const r of feed.orders || []) writes.push(...orderWrites(db, r));
  for (const m of feed.members || []) writes.push(...memberWrites(db, m, plans));
  for (let i = 0; i < writes.length; i += 80) await db.batch(writes.slice(i, i + 80));
  return { cursor: feed.at, counted: `${(feed.orders || []).length} orders, ${(feed.members || []).length} members` };
}

// RoseWave's order: c = what was paid; d = promo code and k = print credit, both off the print; sc = shipping charged.
// No sales tax is charged. Orders from before Annex didn't say whether they were test orders: those placed with
// Prodigi's sandbox (live not set) were.
export function orderWrites(db, r) {
  const id = "rw:" + r.n;
  const discount = (r.d || 0) + (r.k || 0);
  const goods = (r.c || 0) - (r.sc || 0) + discount;
  const to = r.to || {};
  const email = String(to.email || "").trim().toLowerCase();
  const test = r.test === undefined ? !r.live : !!r.test;
  const status = STAGES[r.stage] || "paid";
  const detail = JSON.stringify({ stage: r.stage, problem: r.problem || "", lab: r.lab ? { id: r.lab.id, stage: r.lab.stage } : null, shipments: r.shipments || [], receipt: r.receipt || "", shipping: r.sm || "" });
  const collection = String(r.h || "").split(" · ")[0];
  const writes = [
    db.prepare(
      `INSERT INTO orders (id, source, channel, placed_at, status, customer, goods_cents, discount_cents, shipping_cents, tax_cents, paid_cents, promo, member, payment, ref, detail, test)
       VALUES (?, 'rosewave', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET channel = excluded.channel, status = CASE WHEN orders.status = 'refunded' THEN 'refunded' ELSE excluded.status END,
         customer = excluded.customer, goods_cents = excluded.goods_cents, discount_cents = excluded.discount_cents, shipping_cents = excluded.shipping_cents,
         paid_cents = excluded.paid_cents, promo = excluded.promo, member = excluded.member, payment = excluded.payment, detail = excluded.detail, test = excluded.test`,
    ).bind(id, r.ch === "web" ? "website" : "app", r.paid, status, email, goods, discount, r.sc || 0, r.c || 0, r.p || "", r.m ? 1 : 0, r.square || "", r.n, detail, test ? 1 : 0),
    db.prepare("DELETE FROM lines WHERE order_id = ?").bind(id),
    db.prepare("INSERT INTO lines (id, order_id, kind, product, collection, variant, qty, cents) VALUES (?, ?, 'print', ?, ?, ?, 1, ?)")
      .bind(id + ":1", id, r.h || r.f || "Print", collection, r.w || "", goods),
  ];
  // Square may have been read first and filed this payment as an order of its own: this one replaces it
  if (r.square) {
    writes.push(db.prepare("DELETE FROM lines WHERE order_id = ?").bind("sq:" + r.square));
    writes.push(db.prepare("DELETE FROM orders WHERE id = ?").bind("sq:" + r.square));
  }
  if (email) writes.push(customerWrite(db, email, [to.first, to.last].filter(Boolean).join(" "), to.state || "", ""));
  return writes;
}

function memberWrites(db, m, plans) {
  if (!m.sub) return [];
  const plan = plans[m.plan] || {};
  const email = String(m.email || "").trim().toLowerCase();
  const status = m.ends ? "CANCELED" : m.status || "ACTIVE";
  const writes = [
    db.prepare(
      `INSERT INTO subscriptions (id, source, customer, plan, cadence, cents, status, started, canceled, through, test)
       VALUES (?, 'rosewave', ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET customer = excluded.customer, plan = excluded.plan, cadence = excluded.cadence, cents = excluded.cents,
         status = CASE WHEN subscriptions.source = 'square' THEN subscriptions.status ELSE excluded.status END,
         canceled = CASE WHEN subscriptions.source = 'square' THEN subscriptions.canceled ELSE excluded.canceled END,
         through = CASE WHEN subscriptions.source = 'square' THEN subscriptions.through ELSE excluded.through END, test = excluded.test`,
    ).bind(m.sub, email, plan.name || m.plan || "", plan.cadence || "MONTHLY", plan.cents || 0, status, m.started || "", m.ends || "", m.through || "", m.test ? 1 : 0),
  ];
  if (email) writes.push(customerWrite(db, email, m.name || "", "", m.customer || ""));
  return writes;
}

export const customerWrite = (db, email, name, state, processorId) =>
  db.prepare(
    `INSERT INTO customers (id, name, email, state, processor_id) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = CASE WHEN excluded.name = '' THEN customers.name ELSE excluded.name END,
       state = CASE WHEN excluded.state = '' THEN customers.state ELSE excluded.state END,
       processor_id = CASE WHEN excluded.processor_id = '' THEN customers.processor_id ELSE excluded.processor_id END`,
  ).bind(email, name, email, state, processorId);
