// The workspace around the sales: Quest's assets (the money-making areas), the overview of all of them, and the clients.
import { home } from "./report.js";
import { addDays, dayOf, fail, json, readJson } from "./util.js";

const ID = /^[a-z0-9][a-z0-9-]{0,30}$/;
const KINDS = ["store", "app", "service", "tool"];
const FIRST = [
  ["rosewave", "RoseWave", "store", "Selling", "rosewave", "/store", "/revamp/rosewave-gallery/photos/blush-of-autumn-01.webp", "#edb3a4", "Photography app, memberships and the print store", 1],
  ["update", "UpDate", "app", "In development", "", "/work/update", "/revamp/banners/update.webp", "#c5aceb", "Date planning and safety app for Android", 2],
  ["websites", "Client websites", "service", "Taking clients", "", "/websites", "/revamp/banners/websites.webp", "#85cfc0", "Websites made for small businesses", 3],
];

// The first visit fills in the assets Quest has today; after that Quest changes them on the Assets page.
export async function assetRows(db) {
  const rows = (await db.prepare("SELECT * FROM assets ORDER BY sort, name").all()).results;
  if (rows.length) return rows;
  const now = new Date().toISOString();
  await db.batch(FIRST.map((a) => db.prepare("INSERT OR IGNORE INTO assets (id, name, kind, status, account, link, image, tone, note, sort, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(...a, now)));
  return (await db.prepare("SELECT * FROM assets ORDER BY sort, name").all()).results;
}

// Each asset with its last 30 days: sales and profit when its sales are connected, client numbers for websites.
export async function assetsWithNumbers(env, accountDb) {
  const rows = await assetRows(env.ANNEX);
  const clients = await clientNumbers(env.CLIENT_DB);
  return Promise.all(rows.map(async (a) => {
    const out = { ...a, numbers: null };
    if (a.account) {
      const account = await env.ANNEX.prepare("SELECT * FROM accounts WHERE id = ?").bind(a.account).first();
      if (account) {
        const to = dayOf(new Date().toISOString(), account.tz), from = addDays(to, -29);
        const h = await home(await accountDb(account), account.tz, from, to).catch(() => null);
        if (h) out.numbers = { kind: "sales", sales: h.sales.value, profit: h.profit.value, orders: h.cards.orders, members: h.cards.members, change: h.sales.change };
      }
    }
    if (a.id === "websites") out.numbers = { kind: "clients", ...clients };
    return out;
  }));
}

async function clientNumbers(db) {
  const one = async (sql) => (await db.prepare(sql).first()) || {};
  const [projects, clients, updates] = await Promise.all([
    one("SELECT COUNT(*) AS n FROM projects"),
    one("SELECT COUNT(*) AS n FROM users WHERE role = 'client' AND disabled = 0"),
    one("SELECT COUNT(*) AS n FROM updates WHERE created > " + (Date.now() - 30 * 86400e3)),
  ]);
  return { projects: projects.n || 0, clients: clients.n || 0, updates: updates.n || 0 };
}

export async function saveAsset(request, db) {
  const ask = await readJson(request);
  const id = String(ask.id || "").trim().toLowerCase();
  if (!ID.test(id)) return fail("Use a short id: lowercase letters, numbers and dashes.");
  const name = String(ask.name || "").trim().slice(0, 60);
  if (!name) return fail("Give the asset a name.");
  const link = String(ask.link || "").trim();
  if (link && !/^(\/|https:\/\/)[^\s]*$/.test(link)) return fail("The link should start with / or https://");
  const image = String(ask.image || "").trim();
  if (image && !/^(\/|https:\/\/)[^\s"')]*$/.test(image)) return fail("The picture should start with / or https://");
  const tone = /^#[0-9a-fA-F]{6}$/.test(ask.tone || "") ? ask.tone : "#85cfc0";
  const account = ID.test(ask.account || "") ? ask.account : "";
  await db.prepare(`INSERT INTO assets (id, name, kind, status, account, link, image, tone, note, sort, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, kind = excluded.kind, status = excluded.status, account = excluded.account, link = excluded.link,
    image = excluded.image, tone = excluded.tone, note = excluded.note, sort = excluded.sort`)
    .bind(id, name, KINDS.includes(ask.kind) ? ask.kind : "app", String(ask.status || "").trim().slice(0, 40), account, link, image, tone,
      String(ask.note || "").trim().slice(0, 160), Math.max(0, Math.min(999, Number(ask.sort) || 0)), new Date().toISOString()).run();
  return json({ ok: true });
}

// The client side of the work: projects, who can see them, and the latest update on each.
export async function clientList(db) {
  const q = async (sql) => (await db.prepare(sql).all()).results;
  const [projects, grants, updates] = await Promise.all([
    q("SELECT * FROM projects ORDER BY name"),
    q("SELECT g.project_id, u.email, u.disabled FROM grants g JOIN users u ON u.id = g.user_id WHERE u.role = 'client'"),
    q("SELECT project_id, title, created FROM updates ORDER BY created DESC LIMIT 200"),
  ]);
  return projects.map((p) => ({
    id: p.id, name: p.name, trial: p.trial_path,
    clients: grants.filter((g) => g.project_id === p.id).map((g) => ({ email: g.email, disabled: !!g.disabled })),
    latest: updates.find((u) => u.project_id === p.id) || null,
    updates: updates.filter((u) => u.project_id === p.id).length,
  }));
}
