// Small helpers shared by every part of the worker.

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });

export const fail = (message, status = 400) => json({ error: message }, status);

const enc = new TextEncoder();

export function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const randomId = (bytes = 16) => b64url(crypto.getRandomValues(new Uint8Array(bytes)));

export async function sha256(text) {
  return b64url(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

// compares two strings in time that doesn't depend on where they first differ
export function same(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

export const cents = (money) => (money && Number.isFinite(Number(money.amount)) ? Math.round(Number(money.amount)) : 0);
// "12.50" (a lab's decimal amount) to 1250
export const decimalCents = (amount) => Math.round(parseFloat(amount || "0") * 100) || 0;

// The local calendar day of an instant, in the account's time zone: 2026-10-24.
const dayFormats = new Map();
export function dayOf(iso, tz) {
  if (!dayFormats.has(tz)) dayFormats.set(tz, new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }));
  return dayFormats.get(tz).format(new Date(iso));
}
export const addDays = (day, n) => new Date(Date.parse(day + "T00:00:00Z") + n * 86400e3).toISOString().slice(0, 10);
export const daysBetween = (from, to) => Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400e3);

export async function readJson(request, limit = 32 * 1024) {
  if (Number(request.headers.get("content-length") || 0) > limit) throw new Error("Too large");
  return request.json();
}

// fetch with a time limit, answering { ok, status, said } like the RoseWave worker's helpers
export async function call(url, init = {}, seconds = 20) {
  const answer = await fetch(url, { ...init, signal: AbortSignal.timeout(seconds * 1000) });
  const said = await answer.json().catch(() => ({}));
  return { ok: answer.ok, status: answer.status, said };
}
