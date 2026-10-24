// Sign-in: email and password, a session cookie, and which seller accounts a person may see.
import { b64url, randomId, sha256, same } from "./util.js";

const ROUNDS = 100000; // the most PBKDF2 rounds Workers allow
const SESSION_DAYS = 30;
const COOKIE = "annex";

export async function hashPassword(password, salt = randomId(16)) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: ROUNDS }, key, 256);
  return { hash: b64url(bits), salt };
}

export const passwordProblem = (password) =>
  typeof password !== "string" || password.length < 10 ? "Use a password of at least 10 characters." : password.length > 200 ? "That password is too long." : "";

export function cookieOf(request) {
  const found = (request.headers.get("Cookie") || "").split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  return found ? found.slice(COOKIE.length + 1) : "";
}

const cookieHeader = (value, days) =>
  `${COOKIE}=${value}; Path=/annex; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.round(days * 86400)}`;

export async function startSession(env, user) {
  const token = randomId(32);
  await env.ANNEX.prepare("INSERT INTO sessions (id, user, expires) VALUES (?, ?, ?)")
    .bind(await sha256(token), user, Date.now() + SESSION_DAYS * 86400e3).run();
  return cookieHeader(token, SESSION_DAYS);
}

export async function endSession(env, request) {
  const token = cookieOf(request);
  if (token) await env.ANNEX.prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256(token)).run();
  return cookieHeader("", 0);
}

// the signed-in person, or null
export async function whoIs(env, request) {
  const token = cookieOf(request);
  if (!token || token.length > 64) return null;
  const row = await env.ANNEX.prepare(
    "SELECT users.id, users.email, users.name FROM sessions JOIN users ON users.id = sessions.user WHERE sessions.id = ? AND sessions.expires > ?",
  ).bind(await sha256(token), Date.now()).first();
  return row || null;
}

// Checks an email and password. Eight wrong tries in a row lock the sign-in for fifteen minutes.
export async function checkPassword(env, email, password) {
  const user = await env.ANNEX.prepare("SELECT * FROM users WHERE email = ?").bind(String(email || "").trim().toLowerCase()).first();
  if (!user) {
    await hashPassword(String(password || ""), "no-such-user"); // the same wait as a real check
    return { error: "That email and password don't match." };
  }
  if (user.locked_until > Date.now()) return { error: "Too many tries. Wait fifteen minutes and try again." };
  const { hash } = await hashPassword(String(password || ""), user.salt);
  if (!same(hash, user.hash)) {
    const failed = user.failed + 1;
    await env.ANNEX.prepare("UPDATE users SET failed = ?, locked_until = ? WHERE id = ?")
      .bind(failed >= 8 ? 0 : failed, failed >= 8 ? Date.now() + 15 * 60e3 : 0, user.id).run();
    return { error: "That email and password don't match." };
  }
  if (user.failed) await env.ANNEX.prepare("UPDATE users SET failed = 0 WHERE id = ?").bind(user.id).run();
  return { user };
}

export async function roleIn(env, account, user) {
  const row = await env.ANNEX.prepare("SELECT role FROM access WHERE account = ? AND user = ?").bind(account, user).first();
  return row ? row.role : "";
}
