// Annex's link to Etsy's API: the "Connect Etsy" sign-in (OAuth 2.0 with PKCE), the tokens it gives, and Etsy's webhooks.
//
// The app's keys are the Worker secrets ETSY_KEY (the keystring) and ETSY_SECRET (the shared secret). Etsy's tokens
// change with every refresh, so they can't be Worker secrets: they're kept in the account's database (table etsy_auth),
// encrypted with AES-GCM under a key made from ETSY_SECRET. Without that secret the stored tokens are unreadable;
// changing it means pressing Connect Etsy again. Webhooks are checked with ETSY_WEBHOOK_SECRET.
import { same } from "../util.js";

export const SCOPES = "transactions_r listings_r listings_w shops_r";
export const API = "https://api.etsy.com";
const AUTHORIZE = "https://www.etsy.com/oauth/connect";
const enc = new TextEncoder();
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const random = (n) => b64url(crypto.getRandomValues(new Uint8Array(n)));

export const ready = (env) => !!(env.ETSY_KEY && env.ETSY_SECRET);
export const apiKey = (env) => env.ETSY_KEY + ":" + env.ETSY_SECRET;

// ---------- the stored tokens ----------
async function lock(env) {
  const base = await crypto.subtle.importKey("raw", enc.encode(env.ETSY_SECRET), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: enc.encode("annex-etsy"), info: enc.encode("tokens") }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function seal(env, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await lock(env), enc.encode(JSON.stringify(value)));
  return b64url(iv) + "." + b64url(data);
}
async function open(env, text) {
  const [iv, data] = String(text || "").split(".");
  try {
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, await lock(env), fromB64(data))));
  } catch {
    return null; // a different ETSY_SECRET, or nothing stored
  }
}

// Whether the shop is linked, without opening the tokens: { shop, at } or null.
export async function linked(db) {
  return db.prepare("SELECT shop, at FROM etsy_auth WHERE id = 'token'").first();
}
export const unlink = (db) => db.prepare("DELETE FROM etsy_auth WHERE id = 'token'").run();

async function keep(env, db, t) {
  await db.prepare("INSERT INTO etsy_auth (id, data, shop, at) VALUES ('token', ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, shop = excluded.shop")
    .bind(await seal(env, t), String(t.shop || ""), new Date().toISOString()).run();
}

async function tokenCall(env, base, form) {
  const r = await fetch((base || API) + "/v3/public/oauth/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: env.ETSY_KEY, ...form }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || !body.access_token) throw Object.assign(new Error("Etsy said no (" + r.status + (body.error ? ": " + body.error : "") + ")"), { status: r.status });
  return { access: body.access_token, refresh: body.refresh_token, expires: Date.now() + (Number(body.expires_in) || 3600) * 1000 };
}

// ---------- Connect Etsy ----------
// The address to send the owner to. The state names the account, so the callback knows where the tokens go.
export async function connectUrl(env, db, account, origin) {
  const state = account.id + "." + random(24), verifier = random(48);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", enc.encode(verifier)));
  await db.batch([
    db.prepare("DELETE FROM etsy_auth WHERE id LIKE 'pending:%' AND at < ?").bind(new Date(Date.now() - 3600e3).toISOString()),
    db.prepare("INSERT INTO etsy_auth (id, data, at) VALUES (?, ?, ?)").bind("pending:" + state, await seal(env, { verifier }), new Date().toISOString()),
  ]);
  const q = new URLSearchParams({ response_type: "code", client_id: env.ETSY_KEY, redirect_uri: origin + "/annex/etsy/callback", scope: SCOPES, state, code_challenge: challenge, code_challenge_method: "S256" });
  return AUTHORIZE + "?" + q;
}

// Etsy sends the owner back here with a code; it becomes tokens. Returns an error to show, or nothing.
export async function finishConnect(env, db, url, base) {
  const state = url.searchParams.get("state") || "", code = url.searchParams.get("code") || "";
  const pending = await db.prepare("SELECT data, at FROM etsy_auth WHERE id = ?").bind("pending:" + state).first();
  if (pending) await db.prepare("DELETE FROM etsy_auth WHERE id = ?").bind("pending:" + state).run();
  if (url.searchParams.get("error")) return "Etsy didn't connect: " + (url.searchParams.get("error_description") || url.searchParams.get("error")).slice(0, 200);
  if (!pending || !code || Date.parse(pending.at) < Date.now() - 3600e3) return "That sign-in link has expired. Press Connect Etsy again.";
  const { verifier } = (await open(env, pending.data)) || {};
  if (!verifier) return "That sign-in link has expired. Press Connect Etsy again.";
  const t = await tokenCall(env, base, { grant_type: "authorization_code", redirect_uri: url.origin + "/annex/etsy/callback", code, code_verifier: verifier });
  const me = await (await fetch((base || API) + "/v3/application/users/me", { headers: { "x-api-key": apiKey(env), Authorization: "Bearer " + t.access } })).json().catch(() => ({}));
  if (!me.shop_id) return "That Etsy account has no shop.";
  await keep(env, db, { ...t, shop: me.shop_id, user: me.user_id });
  return "";
}

// A caller for Etsy's API with a fresh token, or null when Annex isn't linked (or Etsy has ended the link).
export async function etsyClient(env, db, base) {
  if (!ready(env)) return null;
  const row = await db.prepare("SELECT data FROM etsy_auth WHERE id = 'token'").first();
  let t = row && (await open(env, row.data));
  if (!t) return null;
  if (t.expires < Date.now() + 120e3) {
    try {
      t = { ...t, ...(await tokenCall(env, base, { grant_type: "refresh_token", refresh_token: t.refresh })) };
    } catch (error) {
      // the refresh token is spent or revoked: the owner has to connect again
      if (error.status === 400 || error.status === 401) { await unlink(db); return null; }
      throw error;
    }
    await keep(env, db, t);
  }
  const call = async (path) => {
    const r = await fetch((base || API) + "/v3/application" + path, { headers: { "x-api-key": apiKey(env), Authorization: "Bearer " + t.access } });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("Etsy " + r.status + (body.error ? ": " + String(body.error).slice(0, 200) : ""));
    return body;
  };
  return { shop: t.shop, call };
}

// ---------- webhooks ----------
// Etsy signs webhooks the Standard Webhooks way: HMAC-SHA256 of "id.timestamp.body" with the endpoint's signing
// secret (whsec_ + base64), sent as "v1,<base64>" in webhook-signature.
export async function verifyHook(request, body, secret) {
  const id = request.headers.get("webhook-id"), at = request.headers.get("webhook-timestamp"), sigs = request.headers.get("webhook-signature") || "";
  if (!secret || !id || !at || Math.abs(Date.now() / 1000 - Number(at)) > 300) return false;
  let raw;
  try { raw = fromB64(secret.replace(/^whsec_/, "")); } catch { raw = enc.encode(secret); }
  const key = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const want = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${id}.${at}.${body}`)))));
  return sigs.split(" ").some((s) => s.startsWith("v1,") && same(s.slice(3), want));
}
