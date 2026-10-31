// The A-to-Z checklists on Annex › Guides: everything, in order, for a new customer and for a new website. Each step
// has a help panel for when it gets stuck: what usually goes wrong and how to fix it, with buttons that go there.
// Quest starts one copy per customer or site ("Houseplant Nation", "rosewave.art") and ticks steps off; those copies
// live in D1 (table checklists), and the steps themselves live here. Same writing rules as sops.js: **bold**, `code`,
// [links](https://…), and no keys or passwords, because this file is in the public repository.
import { fail, json, readJson } from "./util.js";
import { DOMAIN, asDomain, checksFor } from "./checklist-checks.js";

const CF = "https://dash.cloudflare.com/";
const go = (label, href) => ({ label, href });
const step = (id, text, help) => ({ id, text, help });
const SECRETS = go("Cloudflare › knoplus-website secrets", CF + "?to=/:account/workers/services/view/knoplus-website/production/settings");

export const CHECKLISTS = [
  {
    id: "new-customer", title: "Set up a new customer",
    about: "From their first message to a live site and a happy client. When their website part comes, run Set up a new website alongside this one.",
    name: "Who is the customer?", placeholder: "Houseplant Nation",
    sections: [
      {
        title: "First contact",
        steps: [
          step("reply", "Reply to their message within a day", {
            answer: "Messages from the kno.plus contact form arrive at **info@kno.plus**, with the topic they picked.",
            fix: [
              "**No message arrived?** Annex › Websites counts contact-form messages. If it counted one that never reached you, check the `RESEND_API_KEY` secret is still in Cloudflare and look in spam.",
              "**They reached you another way** (text, Instagram): reply there, then move to email so everything is in one place.",
            ],
            go: [go("Open Websites", "#websites"), SECRETS],
          }),
          step("call", "Have a short call: what they want, by when, and their budget", {
            answer: "Twenty minutes is enough. Write the answers down as you go.",
            fix: [
              "Ask: what is the site for, who visits it, which pages it needs, examples they like, their domain (if they have one), their deadline, and their budget.",
              "**They don't know what they want?** Show them the templates on kno.plus/websites and ask which feels closest.",
              "**No budget yet?** Give a range from a similar past job and let them react to it.",
            ],
            go: [go("Website templates", "/websites")],
          }),
          step("brief", "Write a one-page brief and send it back to them to confirm", {
            answer: "A short list of what you'll build, in their words. It becomes the first page of the quote.",
            fix: ["Keep it to pages, features, content they'll supply, and the date. Anything they add later is a change, priced separately."],
            go: [],
          }),
        ],
      },
      {
        title: "Quote and contract",
        steps: [
          step("quote", "Write the quote: what you'll build, the price and the timeline", {
            answer: "The quote is its own page; the contract says that page decides the project details.",
            fix: [
              "Start from the brief. Price the pages and features, then add a line for anything they asked for that's optional.",
              "Prices go in the quote only, never on kno.plus.",
            ],
            go: [go("Guide: quotes and contracts", "#guides")],
          }),
          step("contract", "Fill in the contract template with their name, the project and the date", {
            answer: "Copy the template into a Google Doc or Word file and fill in the blanks.",
            fix: ["Have an attorney look over the template once before you use it for real. After that, only the names, dates and quote change."],
            go: [go("Contract template", "https://github.com/questmullins/knoplus-website/blob/main/contracts/knoplus-website-service-agreement.md")],
          }),
          step("sign", "Send the quote and contract as a PDF and get them signed", {
            answer: "Any e-signature app works. Keep the signed copy.",
            fix: [
              "**They want changes to the contract?** Small wording changes are fine; anything about payment or ownership, check with your attorney.",
              "**No reply after three days?** Send one short, friendly nudge.",
            ],
            go: [],
          }),
          step("deposit", "Collect the deposit before starting work", {
            answer: "However you bill, the deposit comes before any building.",
            fix: ["Note the amount and date in their project's update, so it's on record in Annex."],
            go: [],
          }),
        ],
      },
      {
        title: "Set them up in Annex",
        steps: [
          step("project", "Add their project in Clients (name, short id, domain, status Ongoing)", {
            answer: "Clients › **Add project**. The short id is lowercase with dashes, like `houseplant-nation`.",
            fix: [
              "**\"That id is taken\"?** Add a word, like `houseplant-nation-shop`.",
              "**No domain yet?** Leave it empty and fill it in once they have one.",
            ],
            go: [go("Open Clients", "#clients")],
          }),
          step("invite", "Add them as a client so they get their invite email", {
            answer: "Clients › **Add client**, pick the project, and leave the password empty. They get an email from info@kno.plus to choose their own.",
            fix: [
              "**Annex shows a link instead of sending an email?** Emails to clients aren't set up yet. Copy the link and send it to them privately, or follow the guide Set up emails to clients.",
              "**The link ran out?** Invites last 3 days. Press ⋯ next to their name › **Send reset email**.",
              "**It went to spam?** Ask them to mark it Not spam, then send a reset email.",
            ],
            go: [go("Open Clients", "#clients"), go("Guide: set up client emails", "#guides")],
          }),
          step("signed-in", "Check they can sign in and see their project", {
            answer: "Ask them to sign in at kno.plus/clients and tell you what they see.",
            fix: [
              "**\"Wrong email or password\"?** Send a reset email from ⋯ next to their name.",
              "**They see nothing?** In Clients, check they're on the right project (⋯ › access).",
            ],
            go: [go("Open Clients", "#clients")],
          }),
        ],
      },
      {
        title: "Build",
        steps: [
          step("content", "Collect their content: logo, photos, words, colours", {
            answer: "Ask for everything in one shared folder, so nothing gets lost in email.",
            fix: [
              "**Content is late?** Set the project status to **Waiting on client** so you can see it at a glance, and build with placeholders meanwhile.",
              "**Photos too small or blurry?** Ask for the originals, or offer stock photos they approve.",
            ],
            go: [go("Open Clients", "#clients")],
          }),
          step("preview", "Build the site and put a preview online for them", {
            answer: "Ask Claude to build it. A preview goes up as a trial site that only they can open, or on a preview link from the pull request.",
            fix: [
              "Trial sites live in the code under `trial-websites/<id>/`; then add the trial address `/trials/<id>/` to their project in Clients.",
              "**They can't open the preview?** Check they're signed in and have access to that project.",
            ],
            go: [go("How trials work", "https://github.com/questmullins/knoplus-website/blob/main/trial-websites/README.md"), go("Open Clients", "#clients")],
          }),
          step("update", "Post an update telling them the preview is ready", {
            answer: "Clients › ⋯ on their project › **Post an update**. They see it the next time they sign in.",
            fix: ["Say what to look at and by when you'd like their notes."],
            go: [go("Open Clients", "#clients")],
          }),
          step("changes", "Make their changes, one round at a time", {
            answer: "Gather notes into one list per round rather than fixing things one message at a time.",
            fix: [
              "**Something wasn't in the brief?** It's a change. Quote it separately before doing it.",
              "**Rounds keep coming?** The quote should say how many rounds are included; point back to it kindly.",
            ],
            go: [],
          }),
          step("approve", "Get their final approval in writing", {
            answer: "An email that says \"approved, go live\" is enough.",
            fix: [],
            go: [],
          }),
        ],
      },
      {
        title: "Launch",
        steps: [
          step("final-payment", "Collect the final payment (status Payment needed until it's in)", {
            answer: "Set the project's status to **Payment needed** in Clients, and back once it's paid.",
            fix: ["**Payment is late?** One reminder at a week, one at two. The site goes live once it's paid, as the contract says."],
            go: [go("Open Clients", "#clients")],
          }),
          step("website", "Put the site on their domain (run the Set up a new website checklist)", {
            answer: "Start a Set up a new website checklist named after their domain, and work through it.",
            fix: ["**They bought the domain themselves?** Ask them to add you to their registrar account, or to make the nameserver change while you're on a call."],
            go: [],
          }),
          step("live", "Set the project to Live and post a \"You're live\" update", {
            answer: "Clients › Status › **Live**, then ⋯ › **Post an update** with the address.",
            fix: [],
            go: [go("Open Clients", "#clients")],
          }),
        ],
      },
      {
        title: "After launch",
        steps: [
          step("handover", "Send them how to change things and who to ask", {
            answer: "A short email: their address, how to reach you, and what's included in any ongoing care.",
            fix: [],
            go: [],
          }),
          step("check-in", "Check in two weeks later: is everything working, any questions?", {
            answer: "Look at their site's visitors in Annex › Websites first, so you have something useful to tell them.",
            fix: ["**Their site isn't in Websites?** Follow the last section of Set up a new website (Search Console and Cloudflare)."],
            go: [go("Open Websites", "#websites")],
          }),
          step("review", "Ask for a short review or testimonial", {
            answer: "Ask when they're happiest: right after the check-in goes well.",
            fix: [],
            go: [],
          }),
          step("done", "Set the project to Done when nothing's left", {
            answer: "Clients › Status › **Done**. Their login keeps working, and their history stays.",
            fix: [],
            go: [go("Open Clients", "#clients")],
          }),
        ],
      },
    ],
  },
  {
    id: "new-website", title: "Set up a new website",
    about: "From buying a domain to a site that publishes itself on Cloudflare every time a change is merged. rosewave.art was set up this way.",
    name: "Which website?", placeholder: "rosewave.art",
    sections: [
      {
        title: "The domain",
        steps: [
          step("buy", "Buy the domain", {
            answer: "Porkbun and Cloudflare Registrar are both good. Buying it at Cloudflare skips the nameserver step below.",
            fix: [
              "**The name is taken?** Try another ending (.art, .studio, .co) or add a word.",
              "Turn on auto-renew so it can't lapse.",
            ],
            go: [go("Cloudflare Registrar", CF + "?to=/:account/domains/register")],
          }),
          step("add-zone", "Add the domain to Cloudflare (Add a domain, Free plan)", {
            answer: "Cloudflare › **Add a domain**, type the domain, choose **Free**. It then shows two nameservers, like `ada.ns.cloudflare.com`.",
            fix: [
              "**It asks about DNS records it found?** Keep them for now; old parking records can be deleted later.",
              "**It says the domain isn't registered?** A just-bought domain can take a few minutes to show up. Try again shortly.",
            ],
            go: [go("Add a domain", CF + "?to=/:account/add-site")],
          }),
          step("nameservers", "At the registrar, replace its nameservers with Cloudflare's two", {
            answer: "On **Porkbun**: Domain Management › the domain › **Details** › Authoritative Nameservers › Edit. Delete Porkbun's, paste Cloudflare's two, save.",
            fix: [
              "**Turn off DNSSEC** at the registrar first if it's on; otherwise the domain can stop working while it moves.",
              "**Other registrars:** look for \"Nameservers\" or \"DNS\" on the domain's page and pick \"custom nameservers\".",
              "**Typo risk:** copy and paste the names from Cloudflare rather than typing them.",
            ],
            go: [go("Porkbun domains", "https://porkbun.com/account/domainsSpeedy")],
          }),
          step("active", "Wait for Cloudflare to say the domain is Active", {
            answer: "Cloudflare emails you when it's Active. It usually takes under an hour, and at most a day.",
            fix: [
              "**Still Pending after a few hours?** On the domain's Overview, press **Check nameservers now**.",
              "Check what the world sees at whatsmydns.net (type NS). If it still shows the registrar's nameservers, the change at the registrar didn't save.",
            ],
            go: [go("Cloudflare domains", CF + "?to=/:account/home/domains"), go("whatsmydns.net", "https://www.whatsmydns.net/")],
          }),
        ],
      },
      {
        title: "Publishing set up once",
        steps: [
          step("repo", "Have the site's code in a GitHub repository", {
            answer: "Ask Claude to make or move the site into a repository. Keep it private if it holds originals, like photos.",
            fix: [],
            go: [go("Your repositories", "https://github.com/questmullins?tab=repositories")],
          }),
          step("token", "Make a Cloudflare API token from the \"Edit Cloudflare Workers\" template", {
            answer: "Cloudflare › My Profile › **API Tokens** › Create Token › **Edit Cloudflare Workers** › Use template. Under Zone Resources pick the new domain (or All zones). Continue, create, and copy the token.",
            fix: [
              "The token is shown only once. If you lose it, make a new one and delete the old.",
              "Never paste the token into a chat, a doc or the code. It only goes into GitHub's secrets (next step).",
            ],
            go: [go("API tokens", CF + "profile/api-tokens")],
          }),
          step("secrets", "Add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID to the repository's secrets", {
            answer: "GitHub › the repository › **Settings › Secrets and variables › Actions** › New repository secret. Add both.",
            fix: [
              "The **Account ID** is on the right side of Cloudflare's Workers & Pages overview (or in any dashboard address after dash.cloudflare.com/).",
              "Names must match exactly, in capitals.",
            ],
            go: [go("Workers & Pages", CF + "?to=/:account/workers-and-pages")],
          }),
          step("workflow", "Add the auto-publish setup (Claude does this)", {
            answer: "A Worker config with the domain as a custom domain, and a GitHub workflow that publishes main and posts preview links on pull requests. The rosewave repository has a working copy (`site/` and `.github/workflows/site.yml`).",
            fix: ["**Rather click than code?** Cloudflare can build it instead: Workers & Pages › Create › Import a repository. kno.plus works that way."],
            go: [],
          }),
        ],
      },
      {
        title: "First publish",
        steps: [
          step("preview", "Open the pull request's preview link and check it on a computer and a phone", {
            answer: "The link is posted as a comment on the pull request a minute or two after it opens.",
            fix: [
              "**No preview comment?** Open the pull request's **Checks** tab. A warning that the Cloudflare secrets aren't set means the secrets step isn't done.",
              "**The preview looks plain or has no photos?** The live back-end only answers the real domain, so some previews show built-in content instead.",
            ],
            go: [],
          }),
          step("merge", "Merge the pull request and watch the publish turn green", {
            answer: "GitHub › the pull request › **Merge**. Then the repository's **Actions** tab shows the publish run.",
            fix: [
              "**\"Authentication error\"** or code 10000: the token is wrong or lacks Workers access. Make a new one from the template and replace the secret.",
              "**Error about the zone or custom domain:** the domain isn't Active in Cloudflare yet, or the token doesn't include it. Wait for Active, then press **Re-run jobs**.",
              "**\"A DNS record already exists\"**: delete the old A or CNAME record for that name in Cloudflare › the domain › DNS, then re-run.",
            ],
            go: [],
          }),
          step("visit", "Visit the domain with and without www and check the padlock", {
            answer: "Both should load the site, and www should forward to the plain address.",
            fix: [
              "**Certificate warning?** New certificates take up to 15 minutes. Wait, then reload.",
              "**Error 522 or 1014, or a parking page?** Old records are still in front. Check DNS in Cloudflare and remove the registrar's parking records.",
              "**Old version showing?** Reload with Shift held, or try a private window.",
            ],
            go: [],
          }),
          step("undo", "Know the undo: Deployments › Rollback", {
            answer: "If a publish goes wrong: Cloudflare › Workers & Pages › the site › **Deployments**, pick the one before, **Rollback**. It's instant and changes no code.",
            fix: ["To undo for good, open the merged pull request on GitHub and press **Revert**, then merge that."],
            go: [go("Workers & Pages", CF + "?to=/:account/workers-and-pages")],
          }),
        ],
      },
      {
        title: "Finishing touches",
        steps: [
          step("email", "Forward email at the domain (like hello@) to your inbox", {
            answer: "Cloudflare › the domain › **Email › Email Routing** › Get started. Add hello@ (or a catch-all) and point it at your inbox, then confirm the email Cloudflare sends.",
            fix: ["**It warns about existing MX records?** Let it replace them unless the domain already has a mailbox somewhere."],
            go: [go("Cloudflare domains", CF + "?to=/:account/home/domains")],
          }),
          step("backend", "If the site talks to a back-end (shop, checkout), allow the new address there", {
            answer: "Back-ends only answer the sites they know. For RoseWave, add `https://<domain>` to `SITE_ORIGIN` on the RoseWave worker (Settings › Variables).",
            fix: ["**Photos missing or checkout says it can't be reached?** This is usually the cause. Separate several addresses with commas."],
            go: [go("Workers & Pages", CF + "?to=/:account/workers-and-pages")],
          }),
          step("search-console", "Add the site to Google Search Console", {
            answer: "Search Console › Add property › **Domain**, type the domain. Google gives a TXT record; Cloudflare can add it for you when asked.",
            fix: [
              "Then **Settings › Users and permissions › Add user**: paste the Annex robot's email (`client_email` from the service account) with **Restricted**, so Annex can read the clicks.",
              "**Verification fails?** TXT records can take a few minutes. Press Verify again.",
            ],
            go: [go("Search Console", "https://search.google.com/search-console")],
          }),
          step("annex", "Check the site shows in Annex › Websites", {
            answer: "Annex reads every Cloudflare domain the knoplus-website token can see.",
            fix: [
              "**Not there?** The `CLOUDFLARE_API_TOKEN` secret on knoplus-website must cover All zones (Zone Read and Analytics Read). Edit the token in Cloudflare to include it.",
              "**No visitor numbers yet?** They start from the day the domain went Active.",
            ],
            go: [go("Open Websites", "#websites"), SECRETS],
          }),
          step("redirects", "Point any old addresses at the new site", {
            answer: "If the site used to live somewhere else (like kno.plus/store for RoseWave), ask Claude to forward the old addresses so links and search results keep working.",
            fix: [],
            go: [],
          }),
          step("handbook", "Note it in the operations handbook's change log", {
            answer: "One line: the domain, where its code lives, and how it publishes. Future you will thank you.",
            fix: [],
            go: [go("Operations handbook", "https://claude.ai/artifact/CkifQ4Yr8LjAte6DxAHb3o")],
          }),
        ],
      },
    ],
  },
];

const LIST = new Map(CHECKLISTS.map((c) => [c.id, c]));
const STEPS = new Map(CHECKLISTS.map((c) => [c.id, new Set(c.sections.flatMap((s) => s.steps.map((x) => x.id)))]));
const ID = /^[a-z0-9]{6,32}$/;
const row = (r) => ({ id: r.id, list: r.list, name: r.name, link: r.link || "", done: JSON.parse(r.done || "{}"), created: r.created, updated: r.updated,
  seen: JSON.parse(r.seen || "{}"), target: r.target || "", checked: r.checked || "" });

// Columns that came after the first table, added once, in place: link (the Clients project or the domain a copy is
// about), and what Annex saw at its last check (seen, target, checked), so a checklist opens with its notes already there.
const LATER = { link: "TEXT NOT NULL DEFAULT ''", seen: "TEXT NOT NULL DEFAULT '{}'", target: "TEXT NOT NULL DEFAULT ''", checked: "TEXT NOT NULL DEFAULT ''" };
let linked;
const ensureLink = (db) => (linked ||= (async () => {
  const cols = (await db.prepare("SELECT name FROM pragma_table_info('checklists')").all()).results.map((c) => c.name);
  for (const [name, type] of Object.entries(LATER)) if (!cols.includes(name))
    await db.prepare("ALTER TABLE checklists ADD COLUMN " + name + " " + type).run().catch((e) => { if (!/duplicate column/i.test(e.message)) throw e; });
})().catch((error) => { linked = null; throw error; }));

export async function checklistRuns(db) {
  await ensureLink(db);
  return (await db.prepare("SELECT * FROM checklists ORDER BY updated DESC").all()).results.map(row);
}

// a new copy of a checklist, named after the customer or site it's for
export async function startChecklist(request, db) {
  const ask = await readJson(request);
  const list = LIST.get(String(ask.list || ""));
  if (!list) return fail("There's no checklist called " + ask.list + ".");
  const name = String(ask.name || "").trim().slice(0, 80);
  if (!name) return fail("Give it a name, like " + list.placeholder + ".");
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16), now = new Date().toISOString();
  await db.prepare("INSERT INTO checklists (id, list, name, done, created, updated) VALUES (?, ?, ?, '{}', ?, ?)").bind(id, list.id, name, now, now).run();
  return json({ ok: true, id });
}

// tick or untick one step ({ step, done }), rename ({ name }), or say what it's about ({ link }: a project id or a domain)
export async function changeChecklist(request, db, id) {
  if (!ID.test(id)) return fail("Not found", 404);
  await ensureLink(db);
  const run = await db.prepare("SELECT * FROM checklists WHERE id = ?").bind(id).first();
  if (!run) return fail("That checklist was deleted.", 404);
  const ask = await readJson(request), now = new Date().toISOString();
  if (ask.name !== undefined) {
    const name = String(ask.name).trim().slice(0, 80);
    if (!name) return fail("Give it a name.");
    await db.prepare("UPDATE checklists SET name = ?, updated = ? WHERE id = ?").bind(name, now, id).run();
    return json({ ok: true });
  }
  if (ask.link !== undefined) {
    let link = String(ask.link).trim().slice(0, 253);
    if (link && run.list === "new-website") {
      link = asDomain(link);
      if (!DOMAIN.test(link)) return fail("The domain should look like example.com.");
    }
    await db.prepare("UPDATE checklists SET link = ?, updated = ? WHERE id = ?").bind(link, now, id).run();
    return json({ ok: true });
  }
  const stepId = String(ask.step || "");
  if (!STEPS.get(run.list)?.has(stepId)) return fail("That step isn't on this checklist.");
  // one statement, so two quick ticks from different tabs can't undo each other
  await db.prepare(ask.done
    ? `UPDATE checklists SET done = json_set(done, '$."' || ? || '"', ?), updated = ? WHERE id = ?`
    : `UPDATE checklists SET done = json_remove(done, '$."' || ? || '"'), updated = ? WHERE id = ?`)
    .bind(...(ask.done ? [stepId, now, now, id] : [stepId, now, id])).run();
  return json({ ok: true });
}

export async function deleteChecklist(db, id) {
  await db.prepare("DELETE FROM checklists WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

// What Annex can see for one copy; steps it finds done are ticked (ticks already there stay, whatever it finds).
export async function checkChecklist(env, id) {
  if (!ID.test(id)) return fail("Not found", 404);
  const db = env.ANNEX;
  await ensureLink(db);
  const found = await db.prepare("SELECT * FROM checklists WHERE id = ?").bind(id).first();
  if (!found) return fail("That checklist was deleted.", 404);
  const run = row(found), { target, checks } = await checksFor(env, run);
  const steps = STEPS.get(run.list), now = new Date().toISOString();
  const tick = Object.entries(checks).filter(([step, c]) => c.ok && steps.has(step) && !run.done[step]).map(([step]) => step);
  if (tick.length) {
    await db.batch(tick.map((step) => db.prepare(`UPDATE checklists SET done = json_set(done, '$."' || ? || '"', ?), updated = ? WHERE id = ?`).bind(step, now, now, id)));
    for (const step of tick) run.done[step] = now;
  }
  await db.prepare("UPDATE checklists SET seen = ?, target = ?, checked = ? WHERE id = ?").bind(JSON.stringify(checks), target, now, id).run();
  return json({ target, checks, done: run.done, at: now });
}
