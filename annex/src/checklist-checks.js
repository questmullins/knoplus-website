// Steps Annex can check by itself, so a checklist ticks them without being asked. Each check answers
//   { ok: true, note }    done: the step is ticked (a tick already there stays)
//   { ok: false, note }   not yet, or wrong: the note says what Annex sees, and the step's Help says what to do
//   nothing               Annex can't tell (no key, or no customer or domain to look at)
// Read only: every check looks, none changes anything. Keys: CLOUDFLARE_API_TOKEN and GOOGLE_SERVICE_ACCOUNT, the ones
// Annex › Websites already uses, and the kno.plus client tables.
import { call } from "./util.js";
import { ensureClientColumns } from "../../server/client-admin.js";
import { searchSites } from "./insights/search.js";

export const DOMAIN = /^(?=.{3,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
export const asDomain = (text) => String(text || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

// A page on the open web: where it ends up and whether it answered. fakeBase stands in for the web in tests.
async function visit(env, address) {
  const url = env.fakeBase ? env.fakeBase + "/site/" + new URL(address).host + "/" : address;
  try {
    const got = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10000) });
    return { status: got.status, to: got.headers.get("location") || "" };
  } catch (error) {
    return { status: 0, why: /certificate|SSL|TLS/i.test(String(error)) ? "its certificate isn't ready" : "it didn't answer" };
  }
}

// the site itself: the plain address loads, and www either forwards to it or loads too
function siteCheck(domain, apex, www) {
  const loads = apex.status >= 200 && apex.status < 400 && !(apex.status >= 300 && apex.to && !apex.to.includes(domain));
  const wwwOk = (www.status >= 300 && www.status < 400 && asDomain(www.to) === domain) || (www.status >= 200 && www.status < 300);
  return loads && wwwOk ? { ok: true, note: "https://" + domain + " loads" + (www.status >= 300 ? " and www forwards to it." : ", and so does www.") }
    : !loads ? { ok: false, note: "https://" + domain + (apex.status ? " answered " + apex.status : " didn't load: " + apex.why) + "." }
    : { ok: false, note: "https://" + domain + " loads, but www " + (www.status ? "answered " + www.status : "didn't load: " + www.why) + "." };
}

async function websiteChecks(env, domain) {
  const out = {};
  if (!domain) return out;
  const token = env.CLOUDFLARE_API_TOKEN || "";
  const base = env.fakeBase ? env.fakeBase + "/cloudflare" : "https://api.cloudflare.com";
  const [zones, apex, www, mx, sites] = await Promise.all([
    token ? call(base + "/client/v4/zones?name=" + encodeURIComponent(domain), { headers: { Authorization: "Bearer " + token } }).catch(() => null) : null,
    visit(env, "https://" + domain + "/"),
    visit(env, "https://www." + domain + "/"),
    call((env.fakeBase ? env.fakeBase + "/dns" : "https://cloudflare-dns.com/dns-query") + "?type=MX&name=" + encodeURIComponent(domain), { headers: { Accept: "application/dns-json" } }, 8).catch(() => null),
    searchSites(env).catch(() => null),
  ]);

  // the domain in Cloudflare, and whether the nameserver change has gone through
  if (zones && zones.ok && zones.said.success) {
    const zone = (zones.said.result || []).find((z) => z.name === domain);
    if (!zone) {
      out["add-zone"] = { ok: false, note: "Cloudflare doesn't have " + domain + " yet." };
    } else {
      out["add-zone"] = { ok: true, note: "Cloudflare has " + domain + "." };
      const active = !zone.status || zone.status === "active";
      const ns = (zone.name_servers || []).join(" and ");
      out.nameservers = active ? { ok: true, note: "Cloudflare's nameservers are in place." }
        : { ok: false, note: "Cloudflare still sees the old nameservers" + (ns ? ". At the registrar they should be " + ns : "") + "." };
      out.active = active ? { ok: true, note: "Cloudflare says Active." } : { ok: false, note: "Cloudflare says " + (zone.status || "pending") + "." };
      out.annex = active ? { ok: true, note: "It's in Websites." } : { ok: false, note: "Websites shows it once Cloudflare says Active." };
    }
  } else if (zones) {
    out["add-zone"] = { ok: false, note: "Cloudflare refused Annex's key (" + zones.status + "), so this can't be checked. The key needs Zone Read for all zones." };
  }

  out.visit = siteCheck(domain, apex, www);

  // email: Cloudflare Email Routing's mail servers in the domain's MX records
  if (mx && mx.ok) {
    const servers = (mx.said.Answer || []).map((a) => String(a.data || "").toLowerCase());
    out.email = servers.some((s) => s.includes("mx.cloudflare.net")) ? { ok: true, note: "Email Routing's mail servers are set." }
      : { ok: false, note: servers.length ? "Mail goes to " + servers[0].replace(/^\d+\s+/, "").replace(/\.$/, "") + ", not Cloudflare Email Routing." : "No mail servers yet." };
  }

  // Search Console: the property is there and Annex's robot was added to it
  if (sites) {
    const mine = sites.sites.includes("sc-domain:" + domain) || sites.sites.includes("https://" + domain + "/") || sites.sites.includes("https://www." + domain + "/");
    out["search-console"] = mine ? { ok: true, note: "Search Console has it, and Annex can read it." }
      : { ok: false, note: "Search Console hasn't added Annex to " + domain + " yet (" + sites.email + ")." };
  }
  return out;
}

async function customerChecks(db, projectId) {
  const out = {};
  if (!db || !projectId) return out;
  await ensureClientColumns(db);
  const project = await db.prepare("SELECT * FROM projects WHERE id = ?").bind(projectId).first();
  if (!project) return { project: { ok: false, note: "The linked project was deleted from Clients." } };
  const [clients, signedIn, updates] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM grants g JOIN users u ON u.id = g.user_id WHERE g.project_id = ? AND u.disabled = 0").bind(projectId).first(),
    db.prepare("SELECT COUNT(DISTINCT s.user_id) AS n FROM sessions s JOIN grants g ON g.user_id = s.user_id WHERE g.project_id = ?").bind(projectId).first(),
    db.prepare("SELECT COUNT(*) AS n FROM updates WHERE project_id = ?").bind(projectId).first(),
  ]);
  const status = project.status || "Ongoing", live = status === "Live" || status === "Done";
  out.project = { ok: true, note: "In Clients as " + project.name + "." };
  out.invite = clients.n ? { ok: true, note: clients.n === 1 ? "1 client has access." : clients.n + " clients have access." } : { ok: false, note: "No client has access to " + project.name + " yet." };
  out["signed-in"] = signedIn.n ? { ok: true, note: "Annex has seen them signed in." } : { ok: false, note: clients.n ? "Nobody has signed in yet." : "Add a client first." };
  out.preview = project.trial_path ? { ok: true, note: "Preview at " + project.trial_path + "." } : { ok: false, note: "No preview address on the project yet." };
  out.update = updates.n ? { ok: true, note: updates.n === 1 ? "1 update posted." : updates.n + " updates posted." } : { ok: false, note: "No updates posted yet." };
  out["final-payment"] = live ? { ok: true, note: "Status is " + status + "." } : { ok: false, note: "Status is " + status + "." };
  out.live = live ? { ok: true, note: "Status is " + status + "." } : { ok: false, note: "Status is " + status + "." };
  out.done = status === "Done" ? { ok: true, note: "Status is Done." } : { ok: false, note: "Status is " + status + "." };
  return out;
}

// What Annex can see for one checklist. A customer list looks at its linked project (or the one with its name), and
// that project's domain too; a website list looks at its domain (its link, else its name).
export async function checksFor(env, run) {
  if (run.list === "new-website") {
    const domain = asDomain(run.link || run.name);
    return { target: DOMAIN.test(domain) ? domain : "", checks: DOMAIN.test(domain) ? await websiteChecks(env, domain) : {} };
  }
  const db = env.CLIENT_DB;
  if (!db) return { target: "", checks: {} };
  await ensureClientColumns(db);
  const project = run.link
    ? await db.prepare("SELECT id, name, domain FROM projects WHERE id = ?").bind(run.link).first()
    : await db.prepare("SELECT id, name, domain FROM projects WHERE name = ? COLLATE NOCASE OR id = ? LIMIT 1").bind(run.name.trim(), run.name.trim().toLowerCase()).first();
  if (!project) return { target: "", checks: {} };
  const checks = await customerChecks(db, project.id);
  // their site is on its domain once that domain loads
  if (project.domain) {
    const [apex, www] = await Promise.all([visit(env, "https://" + project.domain + "/"), visit(env, "https://www." + project.domain + "/")]);
    const site = siteCheck(project.domain, apex, www);
    checks.website = site.ok ? { ok: true, note: project.domain + " is live." } : site;
  }
  return { target: project.name, checks };
}
