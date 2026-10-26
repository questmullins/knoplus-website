// Managing clients from Annex: the client list, projects with their domain and status, access, updates, and password
// links sent by email from info@kno.plus. Only the Annex API calls these, after it has checked the owner's session.
import { digest, passwordHash, randomToken } from './client-auth.js';

export const STATUSES = ['Ongoing', 'Payment needed', 'Waiting on client', 'Live', 'Paused', 'Done'];
const RESET_HOURS = 1, INVITE_HOURS = 72;
const clean = (value, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const emailOf = (value) => clean(value).toLowerCase();
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const DOMAIN = /^(?=.{3,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

// Columns added after the first tables: a project's domain and status, a client's name. Added once, in place.
let columns;
export const ensureClientColumns = (db) => (columns ||= (async () => {
  const has = async (table) => new Set((await db.prepare(`SELECT name FROM pragma_table_info('${table}')`).all()).results.map((c) => c.name));
  const [projects, users] = await Promise.all([has('projects'), has('users')]);
  const add = [];
  if (!projects.has('domain')) add.push("ALTER TABLE projects ADD COLUMN domain TEXT NOT NULL DEFAULT ''");
  if (!projects.has('status')) add.push("ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'Ongoing'");
  if (!users.has('name')) add.push("ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  for (const sql of add) await db.prepare(sql).run().catch((e) => { if (!/duplicate column/i.test(e.message)) throw e; });
})().catch((error) => { columns = null; throw error; }));

// Every project with its clients, newest update and counts; a client with access to two projects shows on both.
export async function clientTable(db) {
  await ensureClientColumns(db);
  const q = async (sql) => (await db.prepare(sql).all()).results;
  const [projects, people, grants, updates] = await Promise.all([
    q('SELECT * FROM projects ORDER BY name COLLATE NOCASE'),
    q("SELECT u.id, u.email, u.name, u.disabled, r.requested FROM users u LEFT JOIN reset_requests r ON r.user_id = u.id WHERE u.role = 'client' ORDER BY u.email"),
    q('SELECT * FROM grants'),
    q('SELECT project_id, title, created FROM updates ORDER BY created DESC LIMIT 500'),
  ]);
  const person = (u) => ({ id: u.id, email: u.email, name: u.name, disabled: !!u.disabled, resetAsked: u.requested || null });
  return {
    statuses: STATUSES,
    projects: projects.map((p) => ({
      id: p.id, name: p.name, domain: p.domain || '', status: p.status || 'Ongoing', trial: p.trial_path,
      clients: grants.filter((g) => g.project_id === p.id).map((g) => people.find((u) => u.id === g.user_id)).filter(Boolean).map(person),
      latest: updates.find((u) => u.project_id === p.id) || null,
      updates: updates.filter((u) => u.project_id === p.id).length,
    })),
    people: people.map((u) => ({ ...person(u), projects: grants.filter((g) => g.user_id === u.id).map((g) => g.project_id) })),
  };
}

export async function saveProject(db, data) {
  await ensureClientColumns(db);
  const id = clean(data.id), name = clean(data.name, 120), domain = clean(data.domain, 253).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const trial = clean(data.trial);
  if (!/^[a-z0-9-]{2,64}$/.test(id)) return { error: 'Use a short project id: lowercase letters, numbers and dashes.' };
  if (!name) return { error: 'Give the project a name.' };
  if (domain && !DOMAIN.test(domain)) return { error: 'The domain should look like example.com.' };
  if (trial && trial !== '/trials/' + id + '/') return { error: 'The trial address must be /trials/' + id + '/ or empty.' };
  const status = STATUSES.includes(data.status) ? data.status : 'Ongoing';
  await db.prepare(`INSERT INTO projects (id, name, trial_path, domain, status) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, trial_path = excluded.trial_path, domain = excluded.domain, status = excluded.status`)
    .bind(id, name, trial, domain, status).run();
  return { ok: true };
}

// A new client: their account, access to one project, and (unless a password is given) an emailed link to set one.
export async function addClient(db, env, origin, data) {
  await ensureClientColumns(db);
  const email = emailOf(data.email), name = clean(data.name, 120), projectId = clean(data.projectId);
  if (!validEmail(email)) return { error: 'Enter the client\'s email address.' };
  if (!(await db.prepare('SELECT id FROM projects WHERE id = ?').bind(projectId).first())) return { error: 'Choose a project.' };
  const existing = await db.prepare('SELECT id, role FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    if (existing.role !== 'client') return { error: 'That email belongs to the administrator.' };
    await db.prepare('INSERT OR IGNORE INTO grants (user_id, project_id) VALUES (?, ?)').bind(existing.id, projectId).run();
    if (name) await db.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name, existing.id).run();
    return { ok: true, existing: true };
  }
  const password = typeof data.password === 'string' && data.password ? data.password : '';
  if (password && (password.length < 12 || password.length > 256)) return { error: 'A starting password needs 12 or more characters, or leave it empty to email a link.' };
  const id = crypto.randomUUID();
  await db.batch([
    db.prepare("INSERT INTO users (id, email, password, role, name) VALUES (?, ?, ?, 'client', ?)").bind(id, email, await passwordHash(password || randomToken()), name),
    db.prepare('INSERT INTO grants (user_id, project_id) VALUES (?, ?)').bind(id, projectId),
  ]);
  if (password) return { ok: true };
  return { ok: true, ...(await passwordLink(db, env, origin, id, 'invite')) };
}

export async function updateClient(db, data) {
  await ensureClientColumns(db);
  const id = clean(data.userId);
  const email = data.email === undefined ? null : emailOf(data.email);
  if (email !== null && !validEmail(email)) return { error: 'That email doesn\'t look right.' };
  const user = await db.prepare("SELECT id FROM users WHERE id = ? AND role = 'client'").bind(id).first();
  if (!user) return { error: 'There\'s no such client.' };
  if (email !== null && (await db.prepare('SELECT 1 FROM users WHERE email = ? AND id <> ?').bind(email, id).first())) return { error: 'Another account already uses that email.' };
  await db.prepare('UPDATE users SET name = ?, email = COALESCE(?, email) WHERE id = ?').bind(clean(data.name, 120), email, id).run();
  return { ok: true };
}

export async function setAccess(db, data) {
  const userId = clean(data.userId), projectId = clean(data.projectId);
  if (!(await db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'client'").bind(userId).first()) || !(await db.prepare('SELECT 1 FROM projects WHERE id = ?').bind(projectId).first())) return { error: 'Choose a client and a project.' };
  await db.prepare(data.allow ? 'INSERT OR IGNORE INTO grants (user_id, project_id) VALUES (?, ?)' : 'DELETE FROM grants WHERE user_id = ? AND project_id = ?').bind(userId, projectId).run();
  return { ok: true };
}

export async function setDisabled(db, data) {
  const userId = clean(data.userId);
  const done = await db.batch([
    db.prepare("UPDATE users SET disabled = ? WHERE id = ? AND role = 'client'").bind(data.disabled ? 1 : 0, userId),
    db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
  ]);
  return done[0].meta.changes ? { ok: true } : { error: 'There\'s no such client.' };
}

export async function postUpdate(db, data) {
  const title = clean(data.title, 200), body = clean(data.body, 8000), projectId = clean(data.projectId);
  if (!title || !body || !(await db.prepare('SELECT 1 FROM projects WHERE id = ?').bind(projectId).first())) return { error: 'Choose a project and write a title and the update.' };
  await db.prepare('INSERT INTO updates (id, project_id, title, body, created) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), projectId, title, body, Date.now()).run();
  return { ok: true };
}

// A one-time link to choose a password. Making one signs the client out everywhere and replaces any older link. It is
// emailed from info@kno.plus when email is set up; the link always comes back too, so it can be sent another way.
export async function passwordLink(db, env, origin, userId, kind = 'reset', send = true) {
  await ensureClientColumns(db);
  const user = await db.prepare("SELECT id, email, name FROM users WHERE id = ? AND role = 'client' AND disabled = 0").bind(clean(userId)).first();
  if (!user) return { error: 'There\'s no such client, or their access is turned off.' };
  const token = randomToken(), hours = kind === 'invite' ? INVITE_HOURS : RESET_HOURS;
  await db.batch([
    db.prepare('DELETE FROM resets WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    db.prepare('INSERT INTO resets (token, user_id, expires) VALUES (?, ?, ?)').bind(await digest(token), user.id, Date.now() + hours * 3600000),
    db.prepare('DELETE FROM reset_requests WHERE user_id = ?').bind(user.id),
  ]);
  const link = origin + '/clients/#reset=' + token;
  if (!send) return { ok: true, link, emailed: false, expiresHours: hours };
  const hello = user.name ? 'Hi ' + user.name.split(/\s+/)[0] + ',' : 'Hi,';
  const words = kind === 'invite'
    ? [hello, '', 'Your Knoplus client page is ready. Use this link to choose your password and see your project:', '', link, '', `The link works once and expires in ${hours} hours. After that, sign in any time at ${origin}/clients/.`]
    : [hello, '', 'Here is a link to choose a new password for your Knoplus client page:', '', link, '', `It works once and expires in ${hours === 1 ? 'one hour' : hours + ' hours'}. If you didn't ask for this, you can ignore this email.`];
  const mail = await sendMail(env, {
    to: user.email,
    subject: kind === 'invite' ? 'Your Knoplus client page' : 'Reset your Knoplus password',
    text: [...words, '', 'Knoplus', 'info@kno.plus'].join('\n'),
  });
  return { ok: true, link, emailed: mail.sent, emailProblem: mail.sent ? undefined : mail.why, to: user.email, expiresHours: hours };
}

// Email from info@kno.plus through Resend (secret RESEND_API_KEY, with kno.plus verified in Resend). Cloudflare's
// EMAIL binding here can only reach info@kno.plus itself, so it can't write to clients.
export async function sendMail(env, { to, subject, text }) {
  const fake = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(env.ANNEX_FAKE_APIS || '') ? env.ANNEX_FAKE_APIS.replace(/\/+$/, '') + '/resend' : '';
  if (!env.RESEND_API_KEY) return { sent: false, why: 'Email isn\'t set up yet (the RESEND_API_KEY secret is missing).' };
  try {
    const response = await fetch((fake || 'https://api.resend.com') + '/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.CONTACT_FROM || 'Knoplus <info@kno.plus>', to: [to], reply_to: env.CONTACT_TO || 'info@kno.plus', subject, text }),
    });
    if (response.ok) return { sent: true };
    const said = await response.json().catch(() => ({}));
    return { sent: false, why: 'The email service refused it (' + response.status + (said.message ? ': ' + String(said.message).slice(0, 160) : '') + ').' };
  } catch {
    return { sent: false, why: 'The email service couldn\'t be reached.' };
  }
}
