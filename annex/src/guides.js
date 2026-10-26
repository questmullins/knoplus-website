// Quest's own guides and SOPs, kept in D1 and shown only to the owner. They are not in this repository on purpose:
// the repository is public, and these are working notes for running the business.
import { fail, json, readJson } from "./util.js";

const ID = /^[a-z0-9][a-z0-9-]{0,60}$/;
const MAX = 200000;
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 61) || "guide";

export async function guideList(db) {
  return (await db.prepare("SELECT id, title, body, sort, updated FROM guides ORDER BY sort, title").all()).results;
}

export async function guideOne(db, id) {
  const row = await db.prepare("SELECT * FROM guides WHERE id = ?").bind(id).first();
  return row ? json(row) : fail("There's no guide called " + id + ".", 404);
}

// One guide, or several at once ({ guides: [...] }) when a handbook is imported section by section.
export async function saveGuides(request, db) {
  const ask = await readJson(request);
  const items = Array.isArray(ask.guides) ? ask.guides : [ask];
  if (!items.length || items.length > 100) return fail("Send between 1 and 100 guides.");
  const now = new Date().toISOString();
  const rows = [];
  for (const [i, g] of items.entries()) {
    const title = String(g.title || "").trim().slice(0, 120);
    if (!title) return fail("Every guide needs a title.");
    const body = String(g.body || "");
    if (body.length > MAX) return fail(title + " is too long (over 200,000 characters).");
    const id = g.id ? String(g.id) : slug(title);
    if (!ID.test(id)) return fail("Use a short id: lowercase letters, numbers and dashes.");
    const sort = Number.isFinite(Number(g.sort)) ? Math.max(0, Math.min(9999, Math.round(Number(g.sort)))) : i * 10;
    rows.push(db.prepare(`INSERT INTO guides (id, title, body, sort, updated) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, sort = excluded.sort, updated = excluded.updated`).bind(id, title, body, sort, now));
  }
  await db.batch(rows);
  return json({ ok: true, saved: rows.length });
}

export async function deleteGuide(db, id) {
  await db.prepare("DELETE FROM guides WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
