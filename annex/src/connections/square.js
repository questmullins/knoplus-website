// Square: every payment with the fee Square really kept, refunds, memberships (subscriptions) and chargebacks.
// A payment another connection already filed (a RoseWave print order) only adds its fee; any other completed payment
// becomes an order of its own: a membership when Square invoiced it for a subscription, else a sale (in person when the
// card was there). Read only: nothing here can move money.
import { call, cents } from "../util.js";
import { customerWrite } from "./rosewave.js";

export const about = {
  id: "square",
  name: "Square",
  // config: sandbox = true for Square's sandbox. Secrets: <ACCOUNT>_SQUARE_TOKEN (read-only access token),
  // <ACCOUNT>_SQUARE_SIGNATURE (the webhook subscription's signature key)
  secrets: ["SQUARE_TOKEN", "SQUARE_SIGNATURE"],
};

const VERSION = "2026-09-16";
const PRESENT = new Set(["EMV", "CONTACTLESS", "SWIPED"]);

function client(ctx) {
  const token = ctx.secret("SQUARE_TOKEN");
  const host = ctx.base || (ctx.config.sandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com");
  return async (path, body) => {
    const got = await call(host + "/v2/" + path, {
      method: body ? "POST" : "GET",
      headers: { Authorization: "Bearer " + token, "Square-Version": VERSION, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!got.ok) throw new Error("Square answered " + got.status + ": " + (((got.said.errors || [])[0] || {}).detail || "").slice(0, 160));
    return got.said;
  };
}

// every page of a Square list
async function all(square, path, key, body) {
  const out = [];
  let cursor;
  for (let page = 0; page < 200; page++) {
    const said = body
      ? await square(path, { ...body, cursor })
      : await square(path + (cursor ? (path.includes("?") ? "&" : "?") + "cursor=" + encodeURIComponent(cursor) : ""));
    out.push(...(said[key] || []));
    cursor = said.cursor;
    if (!cursor) break;
  }
  return out;
}

// full: everything from the last three years (on connect); otherwise the last 40 days, which catches fees and refunds
// that settle after a payment and anything a webhook missed
export async function pull(ctx) {
  if (!ctx.secret("SQUARE_TOKEN")) return { skipped: "Add the Square access token to connect." };
  const square = client(ctx);
  const { db } = ctx;
  const test = ctx.config.sandbox ? 1 : 0;
  const begin = new Date(Date.now() - (ctx.full ? 3 * 365 : ctx.days || 40) * 86400e3).toISOString();

  const locations = (await square("locations")).locations || [];
  const locationIds = locations.map((l) => l.id);
  // which payments were for a subscription: an invoice made for a subscription names both
  const invoices = [];
  for (const id of locationIds) invoices.push(...(await all(square, "invoices/search", "invoices", { query: { filter: { location_ids: [id] } }, limit: 200 })));
  const forSubscription = new Map(invoices.filter((i) => i.subscription_id && i.order_id).map((i) => [i.order_id, i.subscription_id]));

  const payments = await all(square, "payments?sort_order=ASC&limit=100&begin_time=" + encodeURIComponent(begin), "payments");
  const refunds = await all(square, "refunds?sort_order=ASC&limit=100&begin_time=" + encodeURIComponent(begin), "refunds");
  const subscriptions = locationIds.length ? await all(square, "subscriptions/search", "subscriptions", { query: { filter: { location_ids: locationIds } }, limit: 200 }) : [];
  const disputes = await all(square, "disputes", "disputes");

  // the orders behind payments that nothing else filed, for their tax, discounts and items
  const filed = new Set();
  const refs = new Map();
  for (let i = 0; i < payments.length; i += 50) {
    const chunk = payments.slice(i, i + 50);
    const marks = chunk.map(() => "?").join(",");
    const rows = (await db.prepare(`SELECT id, payment, ref FROM orders WHERE payment IN (${marks}) OR ref IN (${marks})`)
      .bind(...chunk.map((p) => p.id), ...chunk.map((p) => p.reference_id || "-")).all()).results;
    for (const row of rows) {
      if (row.payment) filed.add(row.payment);
      if (row.ref) refs.set(row.ref, row.id);
    }
  }
  const loose = payments.filter((p) => p.status === "COMPLETED" && p.order_id && !filed.has(p.id) && !refs.has(p.reference_id || "-") && !forSubscription.has(p.order_id));
  const squareOrders = new Map();
  for (let i = 0; i < loose.length; i += 100) {
    const said = await square("orders/batch-retrieve", { order_ids: loose.slice(i, i + 100).map((p) => p.order_id) });
    for (const o of said.orders || []) squareOrders.set(o.id, o);
  }

  const plans = await planPrices(square, subscriptions);
  const writes = [];
  for (const p of payments) writes.push(...paymentWrites(db, p, { test, filed, refs, forSubscription, squareOrders, plans }));
  for (const r of refunds) writes.push(...refundWrites(db, r, test));
  for (const s of subscriptions) writes.push(subscriptionWrite(db, s, plans, test));
  for (const d of disputes) writes.push(...disputeWrites(db, d, test));
  for (let i = 0; i < writes.length; i += 80) await db.batch(writes.slice(i, i + 80));
  return { counted: `${payments.length} payments, ${refunds.length} refunds, ${subscriptions.length} subscriptions` };
}

const feeOf = (list) => (list || []).reduce((sum, f) => sum + cents(f.amount_money), 0);

export function paymentWrites(db, p, { test, filed, refs, forSubscription, squareOrders, plans }) {
  const writes = [
    db.prepare(
      `INSERT INTO payments (id, source, created_at, amount_cents, fee_cents, status, ref, test) VALUES (?, 'square', ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET amount_cents = excluded.amount_cents, fee_cents = excluded.fee_cents, status = excluded.status, ref = excluded.ref`,
    ).bind(p.id, p.created_at, cents(p.total_money || p.amount_money), feeOf(p.processing_fee), p.status, p.reference_id || "", test),
  ];
  if (filed.has(p.id)) return writes;
  // the seller's own order number on the payment: link that order to it
  if (p.reference_id && refs.has(p.reference_id)) {
    writes.push(db.prepare("UPDATE orders SET payment = ? WHERE id = ?").bind(p.id, refs.get(p.reference_id)));
    return writes;
  }
  if (p.status !== "COMPLETED") return writes;
  const id = "sq:" + p.id;
  const email = String(p.buyer_email_address || "").trim().toLowerCase();
  const subscription = p.order_id && forSubscription.get(p.order_id);
  const amount = cents(p.amount_money);
  let goods = amount, discount = 0, tax = 0, shipping = 0, channel, lines;
  if (subscription) {
    const plan = plans.bySubscription.get(subscription) || {};
    channel = "online";
    lines = [{ kind: "membership", product: (plan.name || "Membership") + (/member/i.test(plan.name || "") ? "" : " membership"), cents: amount }];
  } else {
    const order = squareOrders.get(p.order_id);
    const present = p.card_details && PRESENT.has(p.card_details.entry_method);
    channel = present ? "in person" : "online";
    if (order) {
      tax = cents(order.total_tax_money);
      discount = cents(order.total_discount_money);
      shipping = cents(order.total_service_charge_money);
      lines = (order.line_items || []).map((l) => ({
        kind: "other", product: l.name || "Item", variant: l.variation_name || "", qty: Math.round(Number(l.quantity) || 1), cents: cents(l.gross_sales_money || l.base_price_money),
      }));
      goods = lines.reduce((sum, l) => sum + l.cents, 0) || amount - tax - shipping + discount;
    } else lines = [{ kind: "other", product: p.note ? String(p.note).slice(0, 80) : "Square sale", cents: amount }];
  }
  writes.push(
    db.prepare(
      `INSERT INTO orders (id, source, channel, placed_at, status, customer, goods_cents, discount_cents, shipping_cents, tax_cents, paid_cents, payment, ref, test)
       VALUES (?, 'square', ?, ?, 'paid', ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET customer = excluded.customer, goods_cents = excluded.goods_cents, discount_cents = excluded.discount_cents,
         shipping_cents = excluded.shipping_cents, tax_cents = excluded.tax_cents, paid_cents = excluded.paid_cents`,
    ).bind(id, channel, p.created_at, email, goods, discount, shipping, tax, amount, p.id, p.reference_id || "", test),
    db.prepare("DELETE FROM lines WHERE order_id = ?").bind(id),
    ...lines.map((l, i) => db.prepare("INSERT INTO lines (id, order_id, kind, product, collection, variant, qty, cents) VALUES (?, ?, ?, ?, '', ?, ?, ?)")
      .bind(id + ":" + (i + 1), id, l.kind, l.product, l.variant || "", l.qty || 1, l.cents)),
  );
  if (email) writes.push(customerWrite(db, email, "", "", p.customer_id || ""));
  return writes;
}

export function refundWrites(db, r, test) {
  const writes = [
    db.prepare(
      `INSERT INTO refunds (id, payment, created_at, amount_cents, fee_cents, status, test) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET amount_cents = excluded.amount_cents, fee_cents = excluded.fee_cents, status = excluded.status`,
    ).bind(r.id, r.payment_id, r.created_at, cents(r.amount_money), feeOf(r.processing_fee), r.status, test),
  ];
  // an order refunded in full shows as refunded
  if (r.status === "COMPLETED")
    writes.push(db.prepare(
      `UPDATE orders SET status = 'refunded' WHERE payment = ? AND paid_cents <= (SELECT COALESCE(SUM(amount_cents), 0) FROM refunds WHERE payment = ? AND status = 'COMPLETED')`,
    ).bind(r.payment_id, r.payment_id));
  return writes;
}

// a subscription's plan name and price, from Square's catalogue (each plan asked about once)
async function planPrices(square, subscriptions) {
  const variations = new Map();
  for (const id of new Set(subscriptions.map((s) => s.plan_variation_id).filter(Boolean))) {
    try {
      const said = await square("catalog/object/" + encodeURIComponent(id) + "?include_related_objects=true");
      const v = said.object || {};
      const data = v.subscription_plan_variation_data || {};
      const phase = (data.phases || []).slice(-1)[0] || {};
      const price = phase.pricing && phase.pricing.price_money ? phase.pricing.price_money : phase.recurring_price_money;
      variations.set(id, { name: data.name || "Membership", cadence: phase.cadence || "MONTHLY", cents: cents(price) });
    } catch {
      variations.set(id, { name: "Membership", cadence: "MONTHLY", cents: 0 });
    }
  }
  const bySubscription = new Map(subscriptions.map((s) => [s.id, variations.get(s.plan_variation_id) || {}]));
  return { variations, bySubscription };
}

function subscriptionWrite(db, s, plans, test) {
  const plan = plans.bySubscription.get(s.id) || {};
  const status = s.canceled_date && s.status === "ACTIVE" ? "CANCELED" : s.status;
  return db.prepare(
    `INSERT INTO subscriptions (id, source, customer, plan, cadence, cents, status, started, canceled, through, test) VALUES (?, 'square', '', ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET source = 'square', plan = CASE WHEN subscriptions.plan = '' THEN excluded.plan ELSE subscriptions.plan END,
       cadence = excluded.cadence, cents = CASE WHEN excluded.cents > 0 THEN excluded.cents ELSE subscriptions.cents END,
       status = excluded.status, started = excluded.started, canceled = excluded.canceled, through = excluded.through`,
  ).bind(s.id, plan.name || "", plan.cadence || "MONTHLY", plan.cents || 0, status, s.start_date || s.created_at || "", s.canceled_date || "", s.charged_through_date || "", test);
}

// A chargeback the seller lost (or accepted) costs the disputed amount; one won costs nothing.
function disputeWrites(db, d, test) {
  const id = "sq-dispute:" + d.id;
  if (!["LOST", "ACCEPTED"].includes(d.state)) return [db.prepare("DELETE FROM costs WHERE id = ?").bind(id)];
  const paymentId = (d.disputed_payment && d.disputed_payment.payment_id) || "";
  return [
    db.prepare(
      `INSERT INTO costs (id, source, kind, ref, at, cents, note, test) VALUES (?, 'square', 'chargeback', COALESCE((SELECT ref FROM orders WHERE payment = ? LIMIT 1), ''), ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET cents = excluded.cents, at = excluded.at, note = excluded.note`,
    ).bind(id, paymentId, d.reported_at || d.created_at, cents(d.amount_money), "Chargeback: " + (d.reason || "").toLowerCase().replace(/_/g, " "), test),
  ];
}

// Square's webhook: checked with the signature key, then a short pull (the last three days) does the rest.
export async function verify(request, body, signatureKey) {
  const given = request.headers.get("x-square-hmacsha256-signature") || "";
  if (!signatureKey || !given) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(signatureKey), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const sig = Uint8Array.from(atob(given), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(request.url + body));
}
