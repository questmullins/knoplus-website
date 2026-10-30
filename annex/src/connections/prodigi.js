// Prodigi: what the lab actually invoiced for each order, print and shipping apart. Each cost carries the order's
// merchantReference, which is the seller's own order number (orders.ref), so it lines up with the sale it belongs to.
import { call, decimalCents } from "../util.js";

export const about = {
  id: "prodigi",
  name: "Prodigi",
  // Secrets: <ACCOUNT>_PRODIGI_KEY (live), <ACCOUNT>_PRODIGI_SANDBOX (optional: sandbox orders, kept as test costs)
  secrets: ["PRODIGI_KEY", "PRODIGI_SANDBOX"],
  optional: ["PRODIGI_SANDBOX"], // only for test orders
};

export async function pull(ctx) {
  const places = [
    { key: ctx.secret("PRODIGI_KEY"), host: "https://api.prodigi.com", test: 0 },
    { key: ctx.secret("PRODIGI_SANDBOX"), host: "https://api.sandbox.prodigi.com", test: 1 },
  ].filter((p) => p.key);
  if (!places.length) return { skipped: "Add a Prodigi API key to connect." };
  const from = new Date(Date.now() - (ctx.full ? 3 * 365 : ctx.days || 40) * 86400e3).toISOString();
  const writes = [];
  let count = 0;
  for (const place of places) {
    const host = ctx.base ? ctx.base + (place.test ? "/sandbox" : "") : place.host;
    for (let skip = 0, more = true; more && skip < 20000; skip += 100) {
      const got = await call(`${host}/v4.0/orders?top=100&skip=${skip}&createdFrom=${encodeURIComponent(from)}`, { headers: { "X-API-Key": place.key } });
      if (!got.ok) throw new Error("Prodigi answered " + got.status + (place.test ? " (sandbox key)" : ""));
      const orders = got.said.orders || [];
      for (const o of orders) writes.push(...costWrites(ctx.db, o, place.test));
      count += orders.length;
      more = !!got.said.hasMore && orders.length > 0;
    }
  }
  for (let i = 0; i < writes.length; i += 80) await ctx.db.batch(writes.slice(i, i + 80));
  return { counted: `${count} lab orders` };
}

// A charge's items are the prints (they name a SKU) and the shipping (they don't). A cancelled order's charges are
// dropped, as Prodigi doesn't bill them.
export function costWrites(db, o, test) {
  const writes = [db.prepare("DELETE FROM costs WHERE source = 'prodigi' AND note = ?").bind("Prodigi " + o.id)];
  if (((o.status || {}).stage || "") === "Cancelled") return writes;
  for (const charge of o.charges || []) {
    const items = charge.items && charge.items.length ? charge.items : [{ id: "total", cost: charge.totalCost }];
    items.forEach((item, i) => {
      const cost = item.cost || {};
      writes.push(db.prepare(
        `INSERT INTO costs (id, source, kind, ref, at, cents, currency, note, test) VALUES (?, 'prodigi', ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, ref = excluded.ref, at = excluded.at, cents = excluded.cents, currency = excluded.currency, note = excluded.note`,
      ).bind(`prodigi:${charge.id || o.id}:${item.id || i}`, item.itemSku ? "print" : "shipping", o.merchantReference || "", o.created || new Date().toISOString(),
        decimalCents(cost.amount), cost.currency || "USD", "Prodigi " + o.id, test));
    });
  }
  return writes;
}
