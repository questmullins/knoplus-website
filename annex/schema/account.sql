-- One of these per seller account. Every connection writes the same records; the dashboard only reads them.
-- Money is in whole cents. Times are UTC ISO strings; days are worked out in the account's time zone when read.
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,               -- square, rosewave, prodigi
  config TEXT NOT NULL DEFAULT '{}', -- names of the Worker secrets to use, never the keys themselves
  cursor TEXT NOT NULL DEFAULT '',   -- where the last pull got to
  last_run TEXT NOT NULL DEFAULT '',
  last_ok TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,               -- rw:<n>, sq:<payment id>
  source TEXT NOT NULL,
  channel TEXT NOT NULL,             -- app, website, in person, other
  placed_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  customer TEXT NOT NULL DEFAULT '',
  goods_cents INTEGER NOT NULL DEFAULT 0,     -- price of what was sold, before discounts
  discount_cents INTEGER NOT NULL DEFAULT 0,  -- promo codes, print credit, Square discounts
  shipping_cents INTEGER NOT NULL DEFAULT 0,  -- charged to the buyer; passes through, not a sale
  tax_cents INTEGER NOT NULL DEFAULT 0,       -- sales tax charged; passes through, not a sale
  paid_cents INTEGER NOT NULL DEFAULT 0,
  promo TEXT NOT NULL DEFAULT '',
  member INTEGER NOT NULL DEFAULT 0,
  payment TEXT NOT NULL DEFAULT '',           -- the payment's id at Square (or another processor)
  ref TEXT NOT NULL DEFAULT '',               -- the seller's own order number, as labs and processors see it
  detail TEXT NOT NULL DEFAULT '{}',
  test INTEGER NOT NULL DEFAULT 0             -- sandbox orders are kept but never counted
);
CREATE INDEX IF NOT EXISTS orders_placed ON orders(placed_at);
CREATE INDEX IF NOT EXISTS orders_payment ON orders(payment);
CREATE INDEX IF NOT EXISTS orders_ref ON orders(ref);
CREATE TABLE IF NOT EXISTS lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  kind TEXT NOT NULL,                -- print, membership, other
  product TEXT NOT NULL,             -- what it was: a photo, a plan
  collection TEXT NOT NULL DEFAULT '',
  variant TEXT NOT NULL DEFAULT '',  -- print type and size
  qty INTEGER NOT NULL DEFAULT 1,
  cents INTEGER NOT NULL DEFAULT 0   -- the line's goods total, before order discounts
);
CREATE INDEX IF NOT EXISTS lines_order ON lines(order_id);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,               -- the processor's own id
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL DEFAULT 0,      -- what the processor actually kept
  status TEXT NOT NULL,
  ref TEXT NOT NULL DEFAULT '',
  test INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  payment TEXT NOT NULL,
  created_at TEXT NOT NULL,          -- counted in the period it happened, not the sale's
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL DEFAULT 0,      -- fee given back (negative cost)
  status TEXT NOT NULL,
  test INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS refunds_payment ON refunds(payment);
CREATE TABLE IF NOT EXISTS costs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,              -- prodigi, square (chargebacks), manual
  kind TEXT NOT NULL,                -- print, shipping, chargeback, monthly, once
  ref TEXT NOT NULL DEFAULT '',      -- the seller's order number the cost is for (orders.ref), matched when read
  at TEXT NOT NULL,                  -- when it was charged; a monthly cost's first month
  until TEXT NOT NULL DEFAULT '',    -- a monthly cost's last day, or empty while it goes on
  cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  note TEXT NOT NULL DEFAULT '',
  test INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS costs_at ON costs(at);
CREATE INDEX IF NOT EXISTS costs_ref ON costs(ref);
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,               -- the email, lower case, or a processor's customer id when there is no email
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  processor_id TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,               -- the processor's subscription id
  source TEXT NOT NULL,
  customer TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT '',
  cadence TEXT NOT NULL DEFAULT 'MONTHLY',
  cents INTEGER NOT NULL DEFAULT 0,  -- price per cadence
  status TEXT NOT NULL,
  started TEXT NOT NULL,
  canceled TEXT NOT NULL DEFAULT '', -- the day it was cancelled
  through TEXT NOT NULL DEFAULT '',  -- paid up to
  test INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS etsy_auth (
  id TEXT PRIMARY KEY,               -- 'token' for the linked shop, 'pending:<state>' while Connect Etsy is under way
  data TEXT NOT NULL,                -- encrypted (see connections/etsy-link.js); never readable without ETSY_SECRET
  shop TEXT NOT NULL DEFAULT '',     -- Etsy's shop id, not secret
  at TEXT NOT NULL
);
