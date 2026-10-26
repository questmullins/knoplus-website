// How Quest's websites are doing, from Cloudflare: every zone the token can see, with requests, page views, unique
// visitors, data served and threats stopped by day, and the countries visits come from. Read only.
//
// Secret CLOUDFLARE_API_TOKEN: a token with Zone › Zone › Read and Zone › Analytics › Read for the zones to show.
import { call } from "../util.js";

const QUERY = `query ($zones: [String!], $since: Date!, $until: Date!) {
  viewer { zones(filter: { zoneTag_in: $zones }) {
    zoneTag
    httpRequests1dGroups(limit: 400, filter: { date_geq: $since, date_leq: $until }, orderBy: [date_ASC]) {
      dimensions { date }
      sum { requests pageViews bytes threats countryMap { clientCountryName requests } }
      uniq { uniques }
    }
  } }
}`;

export async function websites(env, from, to) {
  const token = env.CLOUDFLARE_API_TOKEN || "";
  if (!token) return { connected: false, zones: [] };
  const base = env.fakeBase ? env.fakeBase + "/cloudflare" : "https://api.cloudflare.com";
  const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
  const listed = await call(base + "/client/v4/zones?per_page=50&status=active", { headers });
  if (!listed.ok || !listed.said.success) return { connected: true, error: "Cloudflare refused the zone list (" + listed.status + "). The token needs Zone › Zone › Read.", zones: [] };
  const zones = listed.said.result.map((z) => ({ id: z.id, name: z.name }));
  if (!zones.length) return { connected: true, zones: [] };
  const got = await call(base + "/client/v4/graphql", {
    method: "POST", headers,
    body: JSON.stringify({ query: QUERY, variables: { zones: zones.map((z) => z.id), since: from, until: to } }),
  });
  const errors = got.said.errors || [];
  if (!got.ok || errors.length) return { connected: true, error: "Cloudflare analytics: " + String((errors[0] || {}).message || got.status).slice(0, 200) + ". The token needs Zone › Analytics › Read.", zones: zones.map((z) => ({ ...z, days: [] })) };
  const byZone = new Map(((got.said.data || {}).viewer || { zones: [] }).zones.map((z) => [z.zoneTag, z.httpRequests1dGroups]));
  return {
    connected: true,
    zones: zones.map((z) => {
      const groups = byZone.get(z.id) || [];
      const countries = {};
      const days = groups.map((g) => {
        for (const c of g.sum.countryMap || []) countries[c.clientCountryName] = (countries[c.clientCountryName] || 0) + c.requests;
        return { day: g.dimensions.date, requests: g.sum.requests, pageViews: g.sum.pageViews, visitors: g.uniq.uniques, bytes: g.sum.bytes, threats: g.sum.threats };
      });
      const sum = (k) => days.reduce((s, d) => s + d[k], 0);
      return {
        ...z, days,
        totals: { requests: sum("requests"), pageViews: sum("pageViews"), visitors: sum("visitors"), bytes: sum("bytes"), threats: sum("threats") },
        countries: Object.entries(countries).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8),
      };
    }).sort((a, b) => b.totals.requests - a.totals.requests),
  };
}
