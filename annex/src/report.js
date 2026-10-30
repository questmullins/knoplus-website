// The numbers. Everything is worked out from the records the connections write; test (sandbox) records never count.
//
// Sales  = what was paid for goods and memberships (before discounts, less discounts), less refunds, counted on the day
//          the refund happened. Sales tax and shipping charged leave out: they pass through to the state and the carrier.
// Gross  = sales plus shipping charged: what buyers paid, tax aside. Net = gross less every payment and selling fee.
// Etsy's fees are worked out from its rates (connections/etsy.js), part by part, and also count among the fees.
// Profit = sales, less what the processor kept in fees, the lab's print cost, shipping (what the lab charged less what
//          the buyer paid for it), chargebacks, and costs entered by hand (a monthly cost is spread over its days).
import { addDays, dayOf, daysBetween } from "./util.js";
import { RATES } from "./connections/etsy.js";

const ZERO = { sales: 0, shippingCharged: 0, fees: 0, print: 0, shipping: 0, chargebacks: 0, orders: 0, refunds: 0, other: 0,
  etsy: 0, etsyTransaction: 0, etsyProcessing: 0, etsyListing: 0, etsyConversion: 0, etsyOffsite: 0, etsySetup: 0 };

const PER_MONTH = { DAILY: 365 / 12, WEEKLY: 52 / 12, EVERY_TWO_WEEKS: 26 / 12, THIRTY_DAYS: 365 / 360, SIXTY_DAYS: 365 / 720, NINETY_DAYS: 365 / 1080, MONTHLY: 1, EVERY_TWO_MONTHS: 1 / 2, QUARTERLY: 1 / 3, EVERY_FOUR_MONTHS: 1 / 4, EVERY_SIX_MONTHS: 1 / 6, ANNUAL: 1 / 12, EVERY_TWO_YEARS: 1 / 24 };
export const monthly = (s) => Math.round(s.cents * (PER_MONTH[s.cadence] ?? 1));

// Reads what the range needs, with a day's margin each side for time zones, and files it under local days.
export async function load(db, tz, from, to) {
  const lo = addDays(from, -1) + "T00:00:00Z";
  const hi = addDays(to, 2) + "T00:00:00Z";
  const q = async (sql, ...args) => (await db.prepare(sql).bind(...args).all()).results;
  const [orders, lines, refunds, payments, costs, manual, etsyRow] = await Promise.all([
    q("SELECT * FROM orders WHERE test = 0 AND placed_at >= ? AND placed_at < ?", lo, hi),
    q("SELECT lines.* FROM lines JOIN orders ON orders.id = lines.order_id WHERE orders.test = 0 AND orders.placed_at >= ? AND orders.placed_at < ?", lo, hi),
    q(`SELECT refunds.*, orders.id AS order_id, orders.goods_cents, orders.discount_cents, orders.shipping_cents, orders.paid_cents
       FROM refunds LEFT JOIN orders ON orders.payment = refunds.payment WHERE refunds.test = 0 AND refunds.status = 'COMPLETED' AND refunds.created_at >= ? AND refunds.created_at < ?`, lo, hi),
    q("SELECT * FROM payments WHERE test = 0 AND status = 'COMPLETED' AND created_at >= ? AND created_at < ?", lo, hi),
    q("SELECT * FROM costs WHERE test = 0 AND source != 'manual' AND at >= ? AND at < ?", lo, hi),
    q("SELECT * FROM costs WHERE source = 'manual'"),
    q("SELECT config FROM connections WHERE id = 'etsy'"),
  ]);
  const etsy = JSON.parse((etsyRow[0] || {}).config || "{}");
  const inRange = (iso) => { const d = dayOf(iso, tz); return d >= from && d <= to ? d : null; };
  const days = new Map();
  const day = (d) => {
    if (!days.has(d)) days.set(d, { ...ZERO });
    return days.get(d);
  };
  for (const o of orders) {
    const d = inRange(o.placed_at);
    if (!d) continue;
    const t = day(d);
    t.sales += o.goods_cents - o.discount_cents;
    t.shippingCharged += o.shipping_cents;
    t.orders += 1;
    if (o.source === "etsy") {
      const f = JSON.parse(o.detail || "{}").fees || {};
      for (const [k, part] of [["transaction", "etsyTransaction"], ["processing", "etsyProcessing"], ["listing", "etsyListing"], ["conversion", "etsyConversion"], ["offsite", "etsyOffsite"]]) {
        t[part] += f[k] || 0;
        t.etsy += f[k] || 0;
        t.fees += f[k] || 0;
      }
    }
  }
  for (const r of refunds) {
    const d = inRange(r.created_at);
    if (!d) continue;
    const t = day(d);
    // a refund gives back goods and shipping in proportion to what was paid for each
    const paid = r.paid_cents || r.amount_cents;
    const goods = r.order_id ? Math.round((r.amount_cents * (r.goods_cents - r.discount_cents)) / paid) : r.amount_cents;
    const ship = r.order_id ? Math.round((r.amount_cents * r.shipping_cents) / paid) : 0;
    t.sales -= goods;
    t.shippingCharged -= ship;
    t.refunds += r.amount_cents;
    t.fees += r.fee_cents;
    if (r.payment.startsWith("etsy:")) { t.etsy += r.fee_cents; t.etsyTransaction += r.fee_cents; }
  }
  // Etsy's payments carry fees already counted with their orders above
  for (const p of payments) {
    const d = p.source === "etsy" ? null : inRange(p.created_at);
    if (d) day(d).fees += p.fee_cents;
  }
  // Etsy's fees outside any one order: the $29 to open the shop, and each active listing renewing every 4 months
  if (/^\d{4}-\d{2}-\d{2}$/.test(etsy.opened || "")) {
    const fixed = (d, part, c) => { const t = day(d); t[part] += c; t.etsy += c; t.fees += c; };
    if (etsy.opened >= from && etsy.opened <= to) fixed(etsy.opened, "etsySetup", RATES.setup);
    const perDay = ((Number(etsy.listings) || 0) * RATES.listing * 3) / 365;
    if (perDay) for (let d = etsy.opened > from ? etsy.opened : from; d <= to; d = addDays(d, 1)) fixed(d, "etsyListing", perDay);
  }
  for (const c of costs) {
    const d = inRange(c.at);
    if (!d) continue;
    const t = day(d);
    if (c.kind === "print") t.print += c.cents;
    else if (c.kind === "shipping") t.shipping += c.cents;
    else if (c.kind === "chargeback") t.chargebacks += c.cents;
    else t.other += c.cents;
  }
  // costs entered by hand: a monthly one is spread evenly over the days it covers, a one-off lands on its day
  for (const c of manual) {
    const start = c.at.slice(0, 10);
    if (c.kind === "once") {
      if (start >= from && start <= to) day(start).other += c.cents;
      continue;
    }
    const perDay = (c.cents * 12) / 365;
    const first = start > from ? start : from;
    const last = c.until && c.until < to ? c.until : to;
    for (let d = first; d <= last; d = addDays(d, 1)) day(d).other += perDay;
  }
  return { days, orders, lines, refunds, payments, costs };
}

export function total(days, from, to) {
  const t = { ...ZERO };
  for (const [d, v] of days) if (d >= from && d <= to) for (const k in t) t[k] += v[k];
  for (const k in t) t[k] = Math.round(t[k]);
  t.gross = t.sales + t.shippingCharged;
  t.net = t.gross - t.fees;
  t.profit = Math.round(t.sales - t.fees - t.print - (t.shipping - t.shippingCharged) - t.chargebacks - t.other);
  return t;
}

const change = (now, before) => (before ? (now - before) / Math.abs(before) : null);

export async function home(db, tz, from, to) {
  const length = daysBetween(from, to) + 1;
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(length - 1));
  const { days } = await load(db, tz, prevFrom, to);
  const now = total(days, from, to);
  const before = total(days, prevFrom, prevTo);
  const series = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const t = total(days, d, d);
    series.push({ day: d, sales: t.sales, profit: t.profit });
  }
  const members = await memberSummary(db, tz, from, to);
  return {
    from, to, now, before, series,
    sales: { value: now.sales, change: change(now.sales, before.sales) },
    profit: { value: now.profit, change: change(now.profit, before.profit) },
    cards: { orders: now.orders, average: now.orders ? Math.round(now.sales / now.orders) : 0, members: members.active, refunds: now.refunds },
  };
}

// Each order with what it cost and what it made, newest first.
export async function orderList(db, tz, from, to) {
  const { orders, lines } = await load(db, tz, from, to);
  const shown = orders.filter((o) => { const d = dayOf(o.placed_at, tz); return d >= from && d <= to; }).sort((a, b) => (a.placed_at < b.placed_at ? 1 : -1)).slice(0, 500);
  if (!shown.length) return { orders: [] };
  const extras = await orderExtras(db, shown);
  const names = await customerNames(db, shown.map((o) => o.customer));
  const byOrder = groupBy(lines, (l) => l.order_id);
  return {
    orders: shown.map((o) => {
      const x = extras(o);
      return {
        id: o.id, at: o.placed_at, day: dayOf(o.placed_at, tz), status: o.status, channel: o.channel, customer: names.get(o.customer) || o.customer,
        items: (byOrder.get(o.id) || []).map((l) => [l.product, l.variant].filter(Boolean).join(" · ")),
        paid: o.paid_cents, sales: o.goods_cents - o.discount_cents, promo: o.promo, member: !!o.member, ...x, detail: JSON.parse(o.detail || "{}"),
      };
    }),
  };
}

// for a set of orders: fees, lab costs, refunds and profit, matched by payment and by order number
async function orderExtras(db, orders) {
  const payments = orders.map((o) => o.payment).filter(Boolean);
  const refs = orders.map((o) => o.ref).filter(Boolean);
  const fees = new Map(), refunded = new Map(), refundFees = new Map(), lab = new Map();
  for (let i = 0; i < Math.max(payments.length, refs.length); i += 90) {
    const p = payments.slice(i, i + 90), r = refs.slice(i, i + 90);
    if (p.length) {
      const marks = p.map(() => "?").join(",");
      for (const row of (await db.prepare(`SELECT id, fee_cents FROM payments WHERE id IN (${marks})`).bind(...p).all()).results) fees.set(row.id, row.fee_cents);
      for (const row of (await db.prepare(`SELECT payment, SUM(amount_cents) AS a, SUM(fee_cents) AS f FROM refunds WHERE status = 'COMPLETED' AND payment IN (${marks}) GROUP BY payment`).bind(...p).all()).results) {
        refunded.set(row.payment, row.a);
        refundFees.set(row.payment, row.f);
      }
    }
    if (r.length) {
      const marks = r.map(() => "?").join(",");
      for (const row of (await db.prepare(`SELECT ref, kind, SUM(cents) AS c FROM costs WHERE source != 'manual' AND ref IN (${marks}) GROUP BY ref, kind`).bind(...r).all()).results) {
        const t = lab.get(row.ref) || { print: 0, shipping: 0, chargeback: 0 };
        t[row.kind] = (t[row.kind] || 0) + row.c;
        lab.set(row.ref, t);
      }
    }
  }
  return (o) => {
    const fee = (fees.get(o.payment) || 0) + (refundFees.get(o.payment) || 0);
    const costs = lab.get(o.ref) || { print: 0, shipping: 0, chargeback: 0 };
    const back = refunded.get(o.payment) || 0;
    const kept = o.paid_cents ? 1 - Math.min(1, back / o.paid_cents) : 1;
    const sales = Math.round((o.goods_cents - o.discount_cents) * kept);
    const shippingCharged = Math.round(o.shipping_cents * kept);
    const cost = fee + costs.print + costs.shipping + (costs.chargeback || 0);
    return { fee, print: costs.print, shipping: costs.shipping, refunded: back, cost, sales, profit: sales + shippingCharged - cost };
  };
}

async function customerNames(db, ids) {
  const wanted = [...new Set(ids.filter(Boolean))];
  const names = new Map();
  for (let i = 0; i < wanted.length; i += 90) {
    const chunk = wanted.slice(i, i + 90);
    for (const row of (await db.prepare(`SELECT id, name FROM customers WHERE id IN (${chunk.map(() => "?").join(",")})`).bind(...chunk).all()).results)
      if (row.name) names.set(row.id, row.name);
  }
  return names;
}

const groupBy = (list, key) => {
  const map = new Map();
  for (const item of list) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return map;
};

// Products, collections, print types and sizes ranked by units, sales and profit. An order's profit is shared among its
// lines by their price.
export async function bestSellers(db, tz, from, to) {
  const { orders, lines } = await load(db, tz, from, to);
  const shown = orders.filter((o) => { const d = dayOf(o.placed_at, tz); return d >= from && d <= to; });
  const extras = await orderExtras(db, shown);
  const byOrder = groupBy(lines, (l) => l.order_id);
  const groups = { product: new Map(), collection: new Map(), type: new Map(), size: new Map() };
  const add = (map, key, units, sales, profit) => {
    if (!key) return;
    const g = map.get(key) || { name: key, units: 0, sales: 0, profit: 0 };
    g.units += units; g.sales += sales; g.profit += profit;
    map.set(key, g);
  };
  for (const o of shown) {
    const x = extras(o);
    const own = byOrder.get(o.id) || [];
    const sum = own.reduce((s, l) => s + l.cents, 0) || 1;
    for (const l of own) {
      const share = l.cents / sum;
      const sales = Math.round(x.sales * share);
      const profit = Math.round(x.profit * share);
      // an order refunded in full no longer counts as sold, though what it cost still counts against profit
      const units = x.refunded && x.sales === 0 ? 0 : l.qty;
      add(groups.product, l.product, units, sales, profit);
      add(groups.collection, l.collection, units, sales, profit);
      if (l.kind === "print") {
        const [type, size] = l.variant.split(", ");
        add(groups.type, type, units, sales, profit);
        add(groups.size, size, units, sales, profit);
      } else if (l.kind === "membership") add(groups.type, "Memberships", units, sales, profit);
    }
  }
  const ranked = (map) => [...map.values()].sort((a, b) => b.sales - a.sales || b.units - a.units).slice(0, 50);
  return { products: ranked(groups.product), collections: ranked(groups.collection), types: ranked(groups.type), sizes: ranked(groups.size) };
}

// Members: active now, monthly recurring revenue, new and cancelled in the range, churn and failed renewals.
export async function memberSummary(db, tz, from, to) {
  const subs = (await db.prepare("SELECT subscriptions.*, customers.name AS name FROM subscriptions LEFT JOIN customers ON customers.id = subscriptions.customer WHERE subscriptions.test = 0").all()).results;
  const today = dayOf(new Date().toISOString(), tz);
  const grace = addDays(today, -3);
  const startDay = (s) => (s.started.length > 10 ? dayOf(s.started, tz) : s.started);
  const live = (s, d) => startDay(s) <= d && !(s.canceled && s.canceled <= d && (!s.through || s.through < d)) && s.status !== "DEACTIVATED" && s.status !== "PENDING";
  const failing = (s) => s.status === "DEACTIVATED" || (s.status === "ACTIVE" && s.through && s.through < grace);
  const active = subs.filter((s) => live(s, today) && !failing(s));
  const atStart = subs.filter((s) => live(s, from)).length;
  const cancelled = subs.filter((s) => s.canceled && s.canceled >= from && s.canceled <= to);
  return {
    active: active.length,
    mrr: active.filter((s) => !s.canceled).reduce((sum, s) => sum + monthly(s), 0),
    started: subs.filter((s) => startDay(s) >= from && startDay(s) <= to).length,
    cancelled: cancelled.length,
    churn: atStart ? cancelled.length / atStart : null,
    failed: subs.filter(failing).length,
    list: subs.sort((a, b) => (a.started < b.started ? 1 : -1)).slice(0, 500).map((s) => ({
      name: s.name || s.customer || "Member", plan: s.plan, cadence: s.cadence, cents: s.cents, started: startDay(s), through: s.through, canceled: s.canceled,
      state: failing(s) ? "renewal failed" : s.canceled ? (s.through && s.through >= today ? "cancelled, ends " + s.through : "ended") : s.status === "ACTIVE" ? "active" : s.status.toLowerCase(),
    })),
  };
}

// Where the money goes: each kind of cost for the range, and margin by print type.
export async function costSummary(db, tz, from, to) {
  const { days } = await load(db, tz, from, to);
  const t = total(days, from, to);
  const types = (await bestSellers(db, tz, from, to)).types.map((g) => ({ ...g, margin: g.sales ? g.profit / g.sales : null }));
  const manual = (await db.prepare("SELECT id, kind, at, until, cents, note FROM costs WHERE source = 'manual' ORDER BY at DESC").all()).results;
  return { total: t, types, manual };
}

// Sales and profit by day, week or month for the range, beside the period just before and the same period a year ago.
export async function trends(db, tz, from, to, by) {
  const length = daysBetween(from, to) + 1;
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(length - 1));
  const yearFrom = shiftYear(from), yearTo = shiftYear(to);
  const { days } = await load(db, tz, yearFrom < prevFrom ? yearFrom : prevFrom, to);
  const bucket = (d) => (by === "month" ? d.slice(0, 7) : by === "week" ? weekOf(d) : d);
  const run = (a, b) => {
    const out = new Map();
    for (let d = a; d <= b; d = addDays(d, 1)) {
      const k = bucket(d);
      const t = total(days, d, d);
      const g = out.get(k) || { key: k, sales: 0, profit: 0 };
      g.sales += t.sales; g.profit += t.profit;
      out.set(k, g);
    }
    return [...out.values()];
  };
  return { by, now: run(from, to), before: run(prevFrom, prevTo), lastYear: run(yearFrom, yearTo), totals: { now: total(days, from, to), before: total(days, prevFrom, prevTo), lastYear: total(days, yearFrom, yearTo) } };
}

const shiftYear = (d) => (Number(d.slice(0, 4)) - 1) + d.slice(4).replace("02-29", "02-28");
// the Monday a day's week starts on
function weekOf(d) {
  const wd = new Date(d + "T00:00:00Z").getUTCDay();
  return addDays(d, -((wd + 6) % 7));
}
