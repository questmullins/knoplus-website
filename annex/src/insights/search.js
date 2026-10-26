// How Quest's websites do in Google Search, from Search Console: clicks, impressions, click-through rate and average
// position by day, and the top searches and pages. Read only.
//
// Secret GOOGLE_SERVICE_ACCOUNT: a Google Cloud service account's JSON key (with the Search Console API turned on in
// its project). Add the service account's email as a user (Restricted is enough) on each Search Console property.
import { call } from "../util.js";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const text64 = (value) => b64url(new TextEncoder().encode(JSON.stringify(value)));

// A signed JWT for the service account, traded for an hour's access token.
async function accessToken(account, base) {
  const pem = String(account.private_key || "").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const tokenUrl = base ? base + "/token" : "https://oauth2.googleapis.com/token";
  const body = text64({ alg: "RS256", typ: "JWT" }) + "." + text64({ iss: account.client_email, scope: SCOPE, aud: tokenUrl, iat: now, exp: now + 3600 });
  const jwt = body + "." + b64url(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(body)));
  const got = await call(tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt });
  if (!got.ok || !got.said.access_token) throw new Error("Google refused the service account (" + got.status + ")");
  return got.said.access_token;
}

export async function search(env, from, to) {
  let account;
  try { account = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT || "null"); } catch { account = null; }
  if (!account || !account.client_email) return { connected: false, sites: [] };
  const base = env.fakeBase ? env.fakeBase + "/google" : "";
  let token;
  try { token = await accessToken(account, base); } catch (error) { return { connected: true, error: error.message, serviceEmail: account.client_email, sites: [] }; }
  const api = (base || "https://www.googleapis.com") + "/webmasters/v3/";
  const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
  const listed = await call(api + "sites", { headers });
  const sites = ((listed.said && listed.said.siteEntry) || []).filter((s) => s.permissionLevel !== "siteUnverifiedUser").map((s) => s.siteUrl);
  const query = async (site, dimensions, rowLimit) => {
    const got = await call(api + "sites/" + encodeURIComponent(site) + "/searchAnalytics/query", { method: "POST", headers, body: JSON.stringify({ startDate: from, endDate: to, dimensions, rowLimit }) });
    return got.ok ? got.said.rows || [] : [];
  };
  const row = (r) => ({ name: (r.keys || [""])[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
  return {
    connected: true, serviceEmail: account.client_email,
    sites: await Promise.all(sites.map(async (site) => {
      const [days, queries, pages] = await Promise.all([query(site, ["date"], 500), query(site, ["query"], 10), query(site, ["page"], 10)]);
      const clicks = days.reduce((s, r) => s + r.clicks, 0), impressions = days.reduce((s, r) => s + r.impressions, 0);
      const position = impressions ? days.reduce((s, r) => s + r.position * r.impressions, 0) / impressions : null;
      return {
        site, totals: { clicks, impressions, ctr: impressions ? clicks / impressions : null, position },
        days: days.map((r) => ({ day: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr })),
        queries: queries.map(row), pages: pages.map(row),
      };
    })),
  };
}
