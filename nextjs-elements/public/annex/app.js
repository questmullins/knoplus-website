// Annex: Quest's Kno.plus workspace. One page, drawn from /annex/api. Text from the server is always set as text,
// never as HTML.
const API = "/annex/api/";
const app = document.getElementById("app");
const tip = document.getElementById("tip");
// Etsy's sign-in comes back with ?etsy=<what happened>: shown once on the Etsy card, then cleared from the address
let etsyNote = new URLSearchParams(location.search).get("etsy") || "";
if (etsyNote) { etsyNote = etsyNote === "connected" ? "Connected. Etsy's orders are coming in now; refresh in a minute." : etsyNote; history.replaceState(null, "", location.pathname + location.hash); }
const state = { me: null, page: "overview", asset: null, account: "", acct: null, tab: "home", range: loadRange(), data: null, days: recall("annex-days") || "28" };

// ---------- small helpers ----------
function h(tag, props = {}, ...kids) {
  const el = document.createElementNS(tag.startsWith("svg:") ? "http://www.w3.org/2000/svg" : "http://www.w3.org/1999/xhtml", tag.replace("svg:", ""));
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.setAttribute("class", v);
    else if (k === "text") el.textContent = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
}
const money = (c, sign) => {
  const s = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Math.abs(c) >= 100000 ? 0 : 2 }).format((c || 0) / 100);
  return sign && c > 0 ? "+" + s : s;
};
const pct = (x) => (x === null || x === undefined ? "–" : (x * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0) + "%");
const plural = (n, one, many = one + "s") => n + " " + (n === 1 ? one : many);
// Workspace routes are about everything; the rest are about the open asset's sales account.
const WORKSPACE = /^(me|site|websites|search|assets|clients|guides|checklists|overview|setup)\b/;
const scoped = (path) => (state.account && !WORKSPACE.test(path) ? path + (path.includes("?") ? "&" : "?") + "account=" + encodeURIComponent(state.account) : path);
// Every answer is kept in memory, so a page you've seen (or one loaded ahead in the background) shows at once and then
// refreshes quietly. Any change you make clears it, so nothing stale outlives an edit.
const cache = new Map();
const MISS = new Error("not loaded yet");
const get = (path) => fetchJson(scoped(path));
const peek = (path) => { const key = scoped(path); if (!cache.has(key)) throw MISS; return cache.get(key); };
async function fetchJson(key) {
  const r = await fetch(API + key, { credentials: "same-origin" });
  const body = await r.json().catch(() => ({}));
  if (r.status === 401) { cache.clear(); state.me.user = null; route(); throw new Error("signed out"); }
  if (!r.ok) throw new Error(body.error || "Something went wrong");
  cache.set(key, body);
  return body;
}
async function send(path, body, method = "POST") {
  cache.clear();
  const r = await fetch(API + scoped(path), { method, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  const said = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(said.error || "Something went wrong");
  return said;
}
function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* fine without it */ } }
function recall(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
function loadRange() { return recall("annex-range") || { preset: "30" }; }

// ---------- days, in the account's own time zone ----------
const tz = () => (state.acct && state.acct.tz) || (state.me && state.me.account && state.me.account.tz) || Intl.DateTimeFormat().resolvedOptions().timeZone;
const todayIn = (zone) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const addDays = (d, n) => new Date(Date.parse(d + "T00:00:00Z") + n * 86400e3).toISOString().slice(0, 10);
const PRESETS = [["30", "Last 30 days"], ["today", "Today"], ["week", "This week"], ["month", "This month"], ["year", "This year"], ["90", "Last 90 days"], ["custom", "Custom"]];
function rangeDays(zone = tz()) {
  const r = state.range, today = todayIn(zone);
  if (r.preset === "custom" && r.from && r.to) return { from: r.from, to: r.to };
  if (r.preset === "today") return { from: today, to: today };
  if (r.preset === "week") { const wd = (new Date(today + "T00:00:00Z").getUTCDay() + 6) % 7; return { from: addDays(today, -wd), to: today }; }
  if (r.preset === "month") return { from: today.slice(0, 8) + "01", to: today };
  if (r.preset === "year") return { from: today.slice(0, 5) + "01-01", to: today };
  if (r.preset === "90") return { from: addDays(today, -89), to: today };
  return { from: addDays(today, -29), to: today };
}
const rangeQuery = (zone) => { const { from, to } = rangeDays(zone); return `from=${from}&to=${to}`; };
const prettyDay = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const ago = (iso) => {
  if (!iso) return "never";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return m < 1 ? "just now" : m < 60 ? plural(m, "minute") + " ago" : m < 1440 ? plural(Math.round(m / 60), "hour") + " ago" : plural(Math.round(m / 1440), "day") + " ago";
};


// ---------- start ----------
async function boot() {
  try {
    state.me = await (await fetch(API + "me", { credentials: "same-origin" })).json();
  } catch {
    app.replaceChildren(h("p", { class: "empty", text: "Annex couldn't be reached. Check your connection and reload." }));
    return;
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/annex/sw.js", { scope: "/annex/" }).catch(() => {});
  addEventListener("hashchange", route);
  // Charts are drawn to the page's width, so a wider or narrower window redraws them. Only a change of width counts: on
  // a phone, scrolling shows and hides the address bar, which changes the height and used to redraw the page (shutting
  // whatever was open). Guides has no charts and is never redrawn this way.
  let wait, wide = innerWidth;
  addEventListener("resize", () => {
    clearTimeout(wait);
    wait = setTimeout(() => {
      if (innerWidth === wide) return;
      wide = innerWidth;
      if (state.data && state.page !== "guides") draw();
    }, 150);
  });
  route();
}

// #overview, #assets, #asset/<id>/<tab>, #websites, #clients, #settings
const PAGES = [["overview", "Overview"], ["assets", "Assets"], ["websites", "Websites"], ["clients", "Clients"], ["guides", "Guides"], ["settings", "Settings"]];
async function route() {
  const me = state.me;
  if (!me.user && me.setup && (me.firstAdmin || location.hash === "#setup")) return setupView();
  if (!me.user && me.setupCodeMissing) return gate("Set up Annex", "Annex has no administrator yet. Add a Worker secret named ANNEX_SETUP_CODE (12 or more characters) to knoplus-website in Cloudflare, then reload this page.", null);
  if (!me.user) return gate("Annex", "Sign in with your kno.plus administrator account to see your work, your websites and your sales.",
    h("div", { class: "stack" }, h("a", { class: "button", href: me.signIn || "/clients/?next=/annex/", text: "Sign in" }),
      me.setup ? h("a", { class: "text-link", href: "#setup", text: "Use your setup code to make or reset your sign-in" }) : null));
  // clients sign in at the same place and land on their own page
  if (me.user.role !== "owner") { location.replace("/clients/"); return; }
  const [page, id, tab] = location.hash.slice(1).split("/");
  state.page = PAGES.some(([p]) => p === page) || page === "asset" ? page : "overview";
  state.asset = state.page === "asset" ? id : null;
  state.tab = tab || "home";
  state.guide = state.page === "guides" && id ? decodeURIComponent(id) : null;
  state.account = "";
  state.acct = null;
  shell();
  if (state.page === "asset") await openAsset();
  load();
}

function gate(title, words, action) {
  app.replaceChildren(h("section", { class: "gate" }, h("div", { class: "brand", text: "KNOPLUS" }), h("h1", { text: title }), h("p", { text: words }), action));
}

function setupView() {
  const error = h("p", { class: "error", role: "alert" });
  const form = h("form", { class: "stack", onsubmit: async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await send("setup", { code: f.get("code"), email: f.get("email"), password: f.get("password") });
      location.hash = "";
      location.reload();
    } catch (err) { error.textContent = err.message; }
  } },
    h("label", {}, "Setup code (the ANNEX_SETUP_CODE secret)", h("input", { name: "code", type: "password", required: true, autocomplete: "off" })),
    h("label", {}, "Your email", h("input", { name: "email", type: "email", required: true, autocomplete: "email" })),
    h("label", {}, "Password (12 or more characters)", h("input", { name: "password", type: "password", required: true, minlength: "12", autocomplete: "new-password" })),
    error, h("button", { class: "button", type: "submit", text: "Create my sign-in" }));
  gate("Set up Annex", "Create the kno.plus administrator sign-in, or give an existing one a new password. It works here and at kno.plus/clients. Delete the ANNEX_SETUP_CODE secret afterwards if you want this form gone.", form);
}

// ---------- the frame: the Kno.plus sidebar and the page ----------
function shell() {
  const open = (on) => {
    document.body.classList.toggle("menu-open", on);
    toggle.setAttribute("aria-expanded", String(on));
    toggle.replaceChildren("Workspace ", h("span", { "aria-hidden": "true", text: on ? "×" : "+" }));
  };
  const toggle = h("button", { class: "menu-toggle", "aria-expanded": "false", "aria-controls": "sidebar", onclick: () => open(!document.body.classList.contains("menu-open")) }, "Workspace ", h("span", { "aria-hidden": "true", text: "+" }));
  const current = state.page === "asset" ? "assets" : state.page;
  const nav = h("nav", { "aria-label": "Workspace" }, h("div", { class: "nav-label", text: "Workspace" }),
    PAGES.map(([id, name]) => h("a", { href: "#" + id, class: current === id ? "active" : null, "aria-current": current === id ? "page" : null, title: name, onclick: () => open(false) }, icon(id), h("span", { class: "nav-name", text: name }))));
  // on a computer the sidebar can shrink to its icons; the choice is remembered
  const small = (on) => {
    document.documentElement.classList.toggle("side-small", on);
    shrink.setAttribute("aria-pressed", String(on));
    shrink.title = on ? "Show the sidebar" : "Shrink the sidebar";
    store("annex-side-small", on);
  };
  const shrink = h("button", { class: "side-toggle", type: "button", "aria-label": "Shrink the sidebar", onclick: () => small(!document.documentElement.classList.contains("side-small")) }, icon("side"));
  small(!!recall("annex-side-small"));
  const signOut = h("button", { class: "text-link", text: "Sign out", onclick: async () => {
    await fetch("/api/clients/logout", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" });
    location.reload();
  } });
  document.body.classList.remove("menu-open");
  app.replaceChildren(
    h("div", { class: "mobile-bar" }, h("a", { class: "brand", href: "/", text: "KNOPLUS" }), toggle),
    h("aside", { id: "sidebar" }, h("a", { class: "brand", href: "/", "aria-label": "KNOPLUS" }, h("span", { class: "brand-full", text: "KNOPLUS" }), h("span", { class: "brand-short", text: "K+" })), nav,
      h("div", { class: "aside-bottom" }, h("div", { class: "motto" }, "Know More.", h("br"), "Know Better.", h("br"), "Knoplus."),
        h("p", { class: "small", text: state.me.user.email }), h("div", { class: "row" }, h("a", { class: "text-link", href: "/", text: "kno.plus ↗" }), signOut, shrink))),
    h("main", {}, h("header", { class: "crumbs" }, h("span", { id: "crumb", text: crumb() }), h("div", { class: "row" }, h("span", { class: "identity" }, "Owner", h("i")), schemeToggle())),
      h("section", { class: "view", id: "view" }, h("p", { class: "loading", text: "Loading…" }))));
}
// The sidebar's line icons, drawn on a 24-unit grid in the ink colour.
const ICONS = {
  overview: ["M4 4h7v7H4z", "M13 4h7v4h-7z", "M13 10h7v10h-7z", "M4 13h7v7H4z"],
  assets: ["M12 3 21 8l-9 5-9-5z", "M3 12.5l9 5 9-5", "M3 16.5l9 5 9-5"],
  websites: ["M3 5h18v14H3z", "M3 9h18", "M6 7h.01", "M8.5 7h.01"],
  clients: ["M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6", "M16 4.3a3.5 3.5 0 0 1 0 6.4", "M18 14.4c2.1.8 3.5 2.8 3.5 5.6"],
  guides: ["M12 6.5C10 5 7 4.5 3 5v14c4-.5 7 0 9 1.5", "M12 6.5C14 5 17 4.5 21 5v14c-4-.5-7 0-9 1.5", "M12 6.5v14"],
  settings: ["M4 7h9", "M17 7h3", "M15 4.5v5", "M4 17h3", "M11 17h9", "M9 14.5v5"],
  side: ["M3 4h18v16H3z", "M9 4v16", "M15.5 9.5 13 12l2.5 2.5"],
};
function icon(name) {
  return h("svg:svg", { class: "nav-icon", viewBox: "0 0 24 24", width: 24, height: 24, "aria-hidden": "true" },
    ICONS[name].map((d) => h("svg:path", { d, fill: "none", stroke: "currentColor", "stroke-width": 1.6, "stroke-linecap": "round", "stroke-linejoin": "round" })));
}
// Light or dark; /scheme.js (shared with kno.plus) handles the click and remembers the choice.
function schemeToggle() {
  return h("button", { class: "scheme-toggle", type: "button", "data-scheme-toggle": "", "aria-label": "Switch between light and dark mode", title: "Light or dark" },
    h("svg:svg", { viewBox: "0 0 20 20", width: 16, height: 16, "aria-hidden": "true" },
      h("svg:circle", { cx: 10, cy: 10, r: 7.25, fill: "none", stroke: "currentColor", "stroke-width": 1.75 }),
      h("svg:path", { d: "M10 2.75a7.25 7.25 0 0 1 0 14.5z", fill: "currentColor" })));
}
function crumb() {
  if (state.page === "asset") return "YOUR WORK / ASSETS / " + String(state.asset).toUpperCase();
  return "YOUR WORK / " + state.page.toUpperCase();
}
function intro(eyebrow, title, text, action) {
  return h("div", { class: "intro" }, h("div", {}, h("span", { class: "eyebrow", text: eyebrow }), h("h1", { text: title }), text ? h("p", { text }) : null), action || null);
}

// ---------- loading a page ----------
const SALES_TABS = [["home", "Sales"], ["orders", "Orders"], ["best", "Best sellers"], ["members", "Members"], ["costs", "Costs and margin"], ["trends", "Trends"], ["settings", "Connections"]];
async function openAsset() {
  const remembered = (path) => { try { return peek(path); } catch { return get(path); } };
  const list = await Promise.resolve(remembered("assets")).catch(() => ({ assets: [] }));
  state.assetRow = list.assets.find((a) => a.id === state.asset) || null;
  state.accounts = list.accounts || [];
  if (state.assetRow && state.assetRow.account) {
    state.account = state.assetRow.account;
    state.acct = (await Promise.resolve(remembered("me?account=" + encodeURIComponent(state.account))).catch(() => ({}))).account || null;
  }
}

async function load() {
  const view = document.getElementById("view");
  const page = state.page, tab = state.tab, asset = state.asset, guide = state.guide;
  // what this page needs, read through `ask`: from memory (peek) or from the server (get)
  const gather = async (ask) => {
    if (page === "guides") {
      const [list, one] = await Promise.all([ask("guides"), guide && !["new", "import"].includes(guide) && !guide.startsWith("check:") ? Promise.resolve().then(() => ask("guides/" + encodeURIComponent(guide))).catch((e) => { if (e === MISS) throw e; return null; }) : null]);
      return { guides: list.guides, sops: list.sops || [], checklists: list.checklists || [], runs: list.runs || [], one };
    }
    if (page === "websites") {
      const days = state.days;
      const [web, search, site] = await Promise.all([ask("websites?days=" + days), ask("search?days=" + days), ask("site?days=" + days)]);
      return { web, search, site };
    }
    if (page === "asset") {
      if (!state.assetRow) return { missing: "There's no asset called " + asset + "." };
      if (!state.account) return asset === "websites" ? ask("clients") : null;
      const q = rangeQuery();
      return ask({ home: "home?" + q, orders: "orders?" + q, best: "best?" + q, members: "members?" + q, costs: "costs?" + q, trends: "trends?" + q + "&by=" + (state.by || "day"), settings: "connections" }[tab] || "home?" + q);
    }
    return ask({ overview: "overview", assets: "assets", clients: "clients", settings: "connections" }[page] || "overview");
  };
  let shown;
  try { shown = await gather(peek); done(shown); } catch { shown = undefined; }
  try {
    const fresh = await gather(get);
    // redraw only when something changed, so a quiet refresh never interrupts typing or an open menu
    if (shown === undefined || JSON.stringify(fresh) !== JSON.stringify(shown)) done(fresh);
  } catch (err) {
    if (shown === undefined && err.message !== "signed out") view.replaceChildren(h("p", { class: "empty", text: err.message }));
  }
  setTimeout(warmUp, 300);
  function done(data) {
    if (page !== state.page || tab !== state.tab || asset !== state.asset || guide !== state.guide) return;
    if (data && data.missing) return view.replaceChildren(h("p", { class: "empty", text: data.missing }));
    state.data = data;
    draw();
  }
}

// After the first page shows, load every other page in the background, one batch, so switching tabs is instant.
let warming = null;
function warmUp() {
  if (warming || !state.me || !state.me.user) return;
  warming = (async () => {
    const days = state.days, quiet = (key) => (cache.has(key) ? null : fetchJson(key).catch(() => null));
    const assets = await quiet("assets") || cache.get("assets") || { assets: [] };
    await Promise.all(["overview", "clients", "guides", "connections", "websites?days=" + days, "search?days=" + days, "site?days=" + days].map(quiet));
    // each asset's sales page for the saved date range, in that account's own time zone
    await Promise.all((assets.assets || []).filter((a) => a.account).map(async (a) => {
      const id = encodeURIComponent(a.account);
      const me = await quiet("me?account=" + id) || cache.get("me?account=" + id) || {};
      const zone = (me.account && me.account.tz) || tz();
      await quiet("home?" + rangeQuery(zone) + "&account=" + id);
    }));
  })().finally(() => { warming = null; });
}

// an open ⋯ menu closes when you click anywhere else or press Escape
document.addEventListener("click", (e) => { for (const m of document.querySelectorAll("details.menu[open]")) if (!m.contains(e.target)) m.open = false; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") for (const m of document.querySelectorAll("details.menu[open]")) m.open = false; });

// folding cards and guides slide open and shut instead of jumping (not the ⋯ menus, and not when motion is turned down)
const still = matchMedia("(prefers-reduced-motion: reduce)");
document.addEventListener("click", (e) => {
  const sum = e.target.closest("summary"), d = sum && sum.parentElement;
  if (!d || d.tagName !== "DETAILS" || d.classList.contains("menu") || still.matches || e.target.closest("a, button, input")) return;
  e.preventDefault();
  slide(d, d.slide ? !d.opening : !d.open);
});
function slide(d, open) {
  const from = d.offsetHeight;
  d.slide?.cancel();
  d.open = open;
  const to = d.offsetHeight;
  if (!open) d.open = true; // stays open while it closes, so the contents slide away
  d.opening = open;
  d.style.overflow = "hidden";
  const run = d.animate({ height: [from + "px", to + "px"] }, { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" });
  d.slide = run;
  run.onfinish = () => { d.open = open; done(); };
  run.oncancel = done;
  function done() { if (d.slide === run) { d.slide = null; d.style.overflow = ""; } }
}
function draw() {
  const view = document.getElementById("view");
  tip.hidden = true;
  if (!view) return;
  const pages = { overview: overviewView, assets: assetsView, websites: websitesView, clients: clientsView, guides: guidesView, settings: workspaceSettingsView, asset: assetView };
  view.replaceChildren(...[].concat(pages[state.page](state.data)).flat(Infinity).filter((x) => x !== null && x !== undefined && x !== false));
}

// ---------- Overview ----------
const count = (n) => Number(n || 0).toLocaleString("en-US");
function metric(name, value, note) {
  return h("div", { class: "metric" }, h("span", { text: name }), h("strong", { text: value }), note ? h("small", { text: note }) : null);
}
function overviewView(d) {
  const web = d.web.connected ? metric("Website visitors", count(d.web.visitors), `Last 28 days · ${plural(d.web.zones, "site")} on Cloudflare`)
    : metric("kno.plus page views", count(d.site.pageRequests), "Last 28 days · connect Cloudflare in Settings for every site");
  return [
    intro("A little clarity", "Everything, in motion.", "Your money-making areas, your websites and your clients, in one place."),
    h("div", { class: "metric-grid" },
      metric("Sales", money(d.sales), "Last 30 days, every connected asset"),
      metric("Profit", money(d.profit), plural(d.orders, "order")),
      web,
      metric("Client projects", count(d.clients.projects), `${plural(d.clients.clients, "client")} · ${plural(d.clients.updates, "update")} this month`)),
    h("div", { class: "toolbar" }, h("h2", { text: "Your assets" }), h("a", { class: "text-link", href: "#assets", text: "Manage assets ↗" })),
    h("div", { class: "projects" }, d.assets.map(assetCard)),
  ];
}

// ---------- Assets ----------
const KIND = { store: "STORE", app: "APP", service: "SERVICE", tool: "TOOL" };
function assetCard(a) {
  const n = a.numbers;
  const figure = !n ? h("span", { class: "small", text: "No money connected yet" })
    : n.kind === "sales" ? h("div", { class: "figure" }, h("strong", { text: money(n.sales) }), h("span", { class: "small", text: `30 days · profit ${money(n.profit)} · ${plural(n.orders, "order")}` }))
      : h("div", { class: "figure" }, h("strong", { text: plural(n.projects, "project") }), h("span", { class: "small", text: `${plural(n.clients, "client")} · ${plural(n.updates, "update")} this month` }));
  const card = h("a", { class: "project", href: "#asset/" + a.id },
    h("div", {}, h("span", { class: "eyebrow", text: KIND[a.kind] || "ASSET" }), h("h3", { text: a.name }), h("p", { text: a.note })),
    h("div", { class: "project-right" }, figure, a.status ? h("span", { class: "pill", text: a.status }) : null, h("span", { class: "arrow", "aria-hidden": "true", text: "↗" })));
  card.style.setProperty("--tone", a.tone);
  if (a.image) card.style.setProperty("--image", `url("${a.image.replace(/["\\]/g, "")}")`);
  return card;
}
function assetsView(d) {
  const form = assetForm(null, d.accounts);
  form.hidden = true;
  return [
    intro("Your assets", "What brings money in.", "Apps, stores, tools and services. Open one to see its sales, its connections and its clients.",
      h("button", { class: "button", text: "Add an asset", onclick: () => { form.hidden = !form.hidden; } })),
    form,
    h("div", { class: "projects" }, d.assets.map(assetCard)),
  ];
}
function assetForm(a, accounts) {
  const error = h("p", { class: "error", role: "alert" });
  const v = a || { id: "", name: "", kind: "app", status: "", account: "", link: "", image: "", tone: "#85cfc0", note: "", sort: 10 };
  return h("form", { class: "panel stack", onsubmit: async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try { await send("assets", { ...f, id: a ? a.id : f.id }); route(); } catch (err) { error.textContent = err.message; }
  } },
    h("h2", { text: a ? "Edit " + a.name : "Add an asset" }),
    h("div", { class: "split" },
      a ? null : h("label", {}, "Short id (letters, numbers, dashes)", h("input", { name: "id", required: true, pattern: "[a-z0-9][a-z0-9-]{0,30}", value: v.id })),
      h("label", {}, "Name", h("input", { name: "name", required: true, value: v.name })),
      h("label", {}, "Kind", h("select", { name: "kind" }, Object.keys(KIND).map((k) => h("option", { value: k, selected: v.kind === k, text: k[0].toUpperCase() + k.slice(1) })))),
      h("label", {}, "Status", h("input", { name: "status", value: v.status, placeholder: "Selling, In development…" })),
      h("label", {}, "Sales from", h("select", { name: "account" }, h("option", { value: "", text: "Not connected" }), (accounts || []).map((c) => h("option", { value: c.id, selected: v.account === c.id, text: c.name })))),
      h("label", {}, "Link", h("input", { name: "link", value: v.link, placeholder: "/work/update" })),
      h("label", {}, "Picture", h("input", { name: "image", value: v.image, placeholder: "/revamp/banners/update.webp" })),
      h("label", {}, "Color", h("input", { name: "tone", type: "color", value: v.tone })),
      h("label", {}, "Order on the page", h("input", { name: "sort", type: "number", min: "0", max: "999", value: String(v.sort) }))),
    h("label", {}, "One line about it", h("input", { name: "note", value: v.note, maxlength: "160" })),
    error, h("div", { class: "row" }, h("button", { class: "button", type: "submit", text: "Save" }),
      a ? h("button", { class: "button secondary", type: "button", text: "Remove asset", onclick: async () => { if (confirm("Remove " + a.name + " from Annex? Its sales stay.")) { await send("assets/" + encodeURIComponent(a.id), {}, "DELETE"); location.hash = "#assets"; } } }) : null));
}

function assetView(d) {
  const a = state.assetRow;
  const edit = assetForm(a, state.accounts);
  edit.hidden = true;
  const head = [
    h("a", { class: "back", href: "#assets", text: "← All assets" }),
    intro(KIND[a.kind] || "ASSET", a.name, a.note, h("div", { class: "row" },
      a.link ? h("a", { class: "button secondary", href: a.link, text: "Open ↗" }) : null,
      h("button", { class: "button secondary", text: "Edit", onclick: () => { edit.hidden = !edit.hidden; } }))),
    edit,
  ];
  if (state.account) {
    const preset = h("select", { "aria-label": "Date range", onchange: (e) => { state.range = { ...state.range, preset: e.target.value }; if (e.target.value === "custom") { const r = rangeDays(); state.range.from = state.range.from || r.from; state.range.to = state.range.to || r.to; } store("annex-range", state.range); route(); } },
      PRESETS.map(([v, t]) => h("option", { value: v, selected: state.range.preset === v, text: t })));
    const custom = state.range.preset === "custom" ? [
      h("input", { type: "date", "aria-label": "From", value: rangeDays().from, onchange: (e) => { state.range.from = e.target.value; store("annex-range", state.range); load(); } }),
      h("input", { type: "date", "aria-label": "To", value: rangeDays().to, onchange: (e) => { state.range.to = e.target.value; store("annex-range", state.range); load(); } }),
    ] : [];
    const tabs = h("nav", { class: "tabs", "aria-label": a.name + " sections" }, SALES_TABS.map(([id, t]) => h("a", { href: `#asset/${a.id}/${id}`, "aria-current": state.tab === id ? "page" : null, text: t })));
    const views = { home: homeView, orders: ordersView, best: bestView, members: membersView, costs: costsView, trends: trendsView, settings: settingsView };
    return [...head, tabs, state.tab === "settings" ? null : h("div", { class: "range" }, preset, custom), ...[].concat((views[state.tab] || homeView)(d))];
  }
  if (a.id === "websites") return [...head, ...clientsBody(d)];
  return [...head, h("div", { class: "panel" }, h("h2", { text: "No sales connected yet" }),
    h("p", { text: "When " + a.name + " starts taking money, connect its sales account under Edit › Sales from. Until then this is a place to keep its status and link." }))];
}

// ---------- Websites ----------
const bytes = (n) => (n >= 1e9 ? (n / 1e9).toFixed(1) + " GB" : n >= 1e6 ? (n / 1e6).toFixed(1) + " MB" : Math.round(n / 1e3) + " kB");
const rate = (x) => (x === null || x === undefined ? "–" : (x * 100).toFixed(1) + "%");
function daysPicker() {
  return h("select", { "aria-label": "Period", onchange: (e) => { state.days = e.target.value; store("annex-days", state.days); load(); } },
    ["7", "28", "90"].map((v) => h("option", { value: v, selected: state.days === v, text: "Last " + v + " days" })));
}
function list(title, rows, columns) {
  return h("div", { class: "panel scroll" }, h("h2", { text: title }), rows.length ? h("table", { class: "table" },
    h("thead", {}, h("tr", {}, columns.map(([t], i) => h("th", { class: i ? "n" : null, text: t })))),
    h("tbody", {}, rows.map((r) => h("tr", {}, columns.map(([, f], i) => h("td", { class: i ? "n" : null, text: f(r) }))))))
    : h("p", { class: "note", text: "Nothing in these days yet." }));
}
function websitesView(d) {
  const { web, search: sc, site } = d;
  const out = [intro("How your websites are doing", "Seen, searched, visited.", "Traffic from Cloudflare for every site on your account, and how often people click you in Google.", daysPicker())];

  out.push(h("h2", { class: "section", text: "Traffic · Cloudflare" }));
  if (!web.connected) out.push(h("div", { class: "panel" }, h("p", { text: "Connect Cloudflare to see every site's visitors, page views and countries. In Cloudflare: My Profile › API Tokens › Create Token, with Zone › Zone › Read and Zone › Analytics › Read for all zones. Add it to knoplus-website as the Worker secret CLOUDFLARE_API_TOKEN." })));
  else if (web.error) out.push(h("p", { class: "error", text: web.error }));
  for (const z of web.zones || []) {
    if (!z.totals) continue;
    out.push(h("div", { class: "panel" },
      h("div", { class: "panel-heading" }, h("h2", { text: z.name }), h("a", { class: "text-link", href: "https://" + z.name, text: "Visit ↗" })),
      h("div", { class: "metric-grid" }, metric("Visitors", count(z.totals.visitors), "Daily unique visitors, added up"), metric("Page views", count(z.totals.pageViews)), metric("Requests", count(z.totals.requests), bytes(z.totals.bytes) + " served"), metric("Threats stopped", count(z.totals.threats))),
      lineChart({ label: z.name + " visitors and page views by day", axis: true, format: count, series: [
        { name: "Visitors", color: "var(--series-1)", values: z.days.map((p) => ({ key: p.day, value: p.visitors })) },
        { name: "Page views", color: "var(--series-2)", dash: "dash", values: z.days.map((p) => ({ key: p.day, value: p.pageViews })) }] }),
      z.countries.length ? h("p", { class: "note", text: "Most requests from: " + z.countries.map((c) => c.name + " " + count(c.count)).join(" · ") }) : null));
  }

  out.push(h("h2", { class: "section", text: "Search · Google Search Console" }));
  if (!sc.connected) out.push(h("div", { class: "panel" }, h("p", { text: "Connect Search Console to see clicks, impressions and click-through rate. In Google Cloud: create a project, turn on the Search Console API, make a service account and download its JSON key. Add the key to knoplus-website as the Worker secret GOOGLE_SERVICE_ACCOUNT, then add the service account's email as a user on each Search Console property." })));
  else if (sc.error) out.push(h("p", { class: "error", text: sc.error }));
  else if (!sc.sites.length) out.push(h("div", { class: "panel" }, h("p", { text: "Connected, but no properties yet. Add " + sc.serviceEmail + " as a user on each property in Search Console." })));
  for (const s of sc.sites || []) {
    out.push(h("div", { class: "panel" },
      h("div", { class: "panel-heading" }, h("h2", { text: s.site.replace(/^sc-domain:/, "") }), h("span", { class: "small", text: sc.from + " to " + sc.to })),
      h("div", { class: "metric-grid" }, metric("Clicks", count(s.totals.clicks)), metric("Impressions", count(s.totals.impressions)), metric("Click-through rate", rate(s.totals.ctr)), metric("Average position", s.totals.position ? s.totals.position.toFixed(1) : "–")),
      lineChart({ label: "Clicks and impressions by day", axis: true, format: count, series: [
        { name: "Impressions", color: "var(--series-1)", values: s.days.map((p) => ({ key: p.day, value: p.impressions })) },
        { name: "Clicks", color: "var(--series-2)", dash: "dash", values: s.days.map((p) => ({ key: p.day, value: p.clicks })) }] }),
      h("div", { class: "split" },
        list("Top searches", s.queries, [["Search", (r) => r.name], ["Clicks", (r) => count(r.clicks)], ["CTR", (r) => rate(r.ctr)], ["Position", (r) => r.position.toFixed(1)]]),
        list("Top pages", s.pages, [["Page", (r) => r.name.replace(/^https?:\/\/[^/]+/, "") || "/"], ["Clicks", (r) => count(r.clicks)], ["CTR", (r) => rate(r.ctr)], ["Position", (r) => r.position.toFixed(1)]]))));
  }

  out.push(h("h2", { class: "section", text: "kno.plus pages · counted here" }));
  const shown = site.series.filter((p) => p.count !== null);
  out.push(h("div", { class: "metric-grid" }, metric("Page views", count(site.pageRequests)), metric("Contact messages", count(site.contacts)), metric("Busiest day", count(Math.max(0, ...shown.map((p) => p.count)))), metric("Counting since", prettyDay(site.started.slice(0, 10)))),
    h("div", { class: "split" }, list("Top pages", site.pages, [["Page", (r) => r.name], ["Views", (r) => count(r.count)]]), list("Where visitors came from", site.sources, [["Source", (r) => r.name], ["Views", (r) => count(r.count)]])),
    h("p", { class: "note", text: "Counted by kno.plus itself without keeping who anyone is: public pages only, no bots, no addresses or query strings." }));
  return out;
}

// ---------- Clients ----------
// Every project and who it's for, one row per client, with a ⋯ menu for what you do with them.
const STATUS_TONE = { "Ongoing": "mint", "Payment needed": "gold", "Waiting on client": "rose", "Live": "mint", "Paused": "muted", "Done": "muted" };
async function clientAction(path, body, said) {
  try {
    const r = await send("clients/" + path, body);
    state.clientNotice = said ? said(r) : null;
  } catch (err) { state.clientNotice = { error: err.message }; }
  state.clientEditor = null;
  await load();
  scrollTo({ top: 0, behavior: "smooth" });
}
function linkNotice(r, who) {
  if (r.emailed) return { text: "Sent a password link to " + r.to + " from info@kno.plus. It works once and expires in " + (r.expiresHours === 1 ? "one hour" : r.expiresHours + " hours") + "." };
  return { text: (r.emailProblem ? r.emailProblem + " " : "") + "Here's the link for " + (who || r.to) + ". Send it to them privately; it works once and expires in " + (r.expiresHours === 1 ? "one hour" : r.expiresHours + " hours") + ".", link: r.link };
}
function clientNotice() {
  const n = state.clientNotice;
  if (!n) return null;
  const close = h("button", { class: "text-link", type: "button", text: "Dismiss", onclick: () => { state.clientNotice = null; draw(); } });
  if (n.error) return h("div", { class: "notice bad", role: "alert" }, h("p", { text: n.error }), close);
  const copy = n.link ? h("div", { class: "row" }, h("input", { class: "grow", readonly: true, value: n.link, "aria-label": "Password link", onfocus: (e) => e.target.select() }),
    h("button", { class: "button", type: "button", text: "Copy link", onclick: async (e) => { try { await navigator.clipboard.writeText(n.link); e.target.textContent = "Copied"; } catch { /* the field is selectable */ } } })) : null;
  return h("div", { class: "notice", role: "status" }, h("p", { text: n.text }), copy, close);
}

function projectForm(p, d) {
  const error = h("p", { class: "error", role: "alert" });
  return h("form", { class: "panel stack", onsubmit: async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try { await send("clients/project", { ...f, id: p ? p.id : f.id, trial: f.trial ? "/trials/" + (p ? p.id : f.id) + "/" : "" }); state.clientNotice = { text: (p ? "Saved " : "Added ") + f.name + "." }; state.clientEditor = null; await load(); }
    catch (err) { error.textContent = err.message; }
  } },
    h("h2", { text: p ? "Edit " + p.name : "Add a project" }),
    h("div", { class: "split" },
      p ? null : h("label", {}, "Short id (letters, numbers, dashes)", h("input", { name: "id", required: true, pattern: "[a-z0-9-]{2,64}", placeholder: "houseplant-nation" })),
      h("label", {}, "Project name", h("input", { name: "name", required: true, maxlength: "120", value: p ? p.name : "" })),
      h("label", {}, "Domain", h("input", { name: "domain", placeholder: "example.com", value: p ? p.domain : "" })),
      h("label", {}, "Status", h("select", { name: "status" }, d.statuses.map((x) => h("option", { value: x, selected: (p ? p.status : "Ongoing") === x, text: x }))))),
    h("label", { class: "row" }, h("input", { type: "checkbox", name: "trial", value: "1", checked: !!(p && p.trial) }), "It has a preview site under /trials/"),
    error, h("div", { class: "row" }, h("button", { class: "button", type: "submit", text: "Save" }), h("button", { class: "button secondary", type: "button", text: "Cancel", onclick: () => { state.clientEditor = null; draw(); } })));
}
function clientForm(d, projectId) {
  const error = h("p", { class: "error", role: "alert" });
  return h("form", { class: "panel stack", onsubmit: async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
      const r = await send("clients/client", f);
      state.clientNotice = r.existing ? { text: f.email + " already had a login; they now also see this project." } : r.link ? linkNotice(r, f.email) : { text: "Added " + f.email + " with the starting password you chose. Send it to them privately." };
      state.clientEditor = null; await load();
    } catch (err) { error.textContent = err.message; }
  } },
    h("h2", { text: "Add a client" }),
    h("div", { class: "split" },
      h("label", {}, "Name", h("input", { name: "name", maxlength: "120", placeholder: "Jane Smith" })),
      h("label", {}, "Email", h("input", { name: "email", type: "email", required: true })),
      h("label", {}, "Project", h("select", { name: "projectId", required: true }, d.projects.map((p) => h("option", { value: p.id, selected: p.id === projectId, text: p.name }))))),
    h("label", {}, "Starting password (optional). Leave it empty and they get an email from info@kno.plus to choose their own.", h("input", { name: "password", type: "password", minlength: "12", autocomplete: "new-password" })),
    error, h("div", { class: "row" }, h("button", { class: "button", type: "submit", text: "Add client" }), h("button", { class: "button secondary", type: "button", text: "Cancel", onclick: () => { state.clientEditor = null; draw(); } })));
}
function personForm(c) {
  const error = h("p", { class: "error", role: "alert" });
  return h("form", { class: "panel stack", onsubmit: async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try { await send("clients/person", { userId: c.id, ...f }); state.clientNotice = { text: "Saved " + (f.name || f.email) + "." }; state.clientEditor = null; await load(); }
    catch (err) { error.textContent = err.message; }
  } },
    h("h2", { text: "Edit " + (c.name || c.email) }),
    h("div", { class: "split" }, h("label", {}, "Name", h("input", { name: "name", maxlength: "120", value: c.name })), h("label", {}, "Email", h("input", { name: "email", type: "email", required: true, value: c.email }))),
    error, h("div", { class: "row" }, h("button", { class: "button", type: "submit", text: "Save" }), h("button", { class: "button secondary", type: "button", text: "Cancel", onclick: () => { state.clientEditor = null; draw(); } })));
}
function updateForm(p) {
  const error = h("p", { class: "error", role: "alert" });
  const body = h("textarea", { name: "body", rows: "6", required: true, maxlength: "8000" });
  return h("form", { class: "panel stack", onsubmit: async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try { await send("clients/update", { projectId: p.id, title: f.title, body: body.value }); state.clientNotice = { text: "Posted to " + p.name + ". Its clients see it next time they sign in." }; state.clientEditor = null; await load(); }
    catch (err) { error.textContent = err.message; }
  } },
    h("h2", { text: "Post an update to " + p.name }),
    h("label", {}, "Title", h("input", { name: "title", required: true, maxlength: "200" })), h("label", {}, "Update", body),
    error, h("div", { class: "row" }, h("button", { class: "button", type: "submit", text: "Post update" }), h("button", { class: "button secondary", type: "button", text: "Cancel", onclick: () => { state.clientEditor = null; draw(); } })));
}

function rowMenu(p, c, d) {
  const edit = (form) => () => { state.clientEditor = form; draw(); document.getElementById("client-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const item = (text, run, bad) => h("button", { type: "button", class: bad ? "bad" : null, role: "menuitem", text, onclick: (e) => { e.target.closest("details").open = false; run(); } });
  const who = c ? c.name || c.email : "";
  const items = c ? [
    !c.disabled && item("Send reset email", () => clientAction("reset", { userId: c.id }, (r) => linkNotice(r, who))),
    !c.disabled && item("Copy a reset link", () => clientAction("reset", { userId: c.id, send: false }, (r) => linkNotice(r, who))),
    item("Edit name or email", edit(personForm(c))),
    item("Post an update", edit(updateForm(p))),
    item("Edit project", edit(projectForm(p, d))),
    p.trial && h("a", { role: "menuitem", href: p.trial, target: "_blank", rel: "noopener", text: "Open preview site ↗" }),
    item(c.disabled ? "Turn access back on" : "Turn off access", () => clientAction("disable", { userId: c.id, disabled: !c.disabled }, () => ({ text: (c.disabled ? "Turned access back on for " : "Turned off access for ") + who + "." })), !c.disabled),
    item("Remove from this project", () => { if (confirm("Remove " + who + " from " + p.name + "? Their login stays.")) clientAction("access", { userId: c.id, projectId: p.id, allow: false }, () => ({ text: "Removed " + who + " from " + p.name + "." })); }, true),
  ] : [
    item("Add a client", edit(clientForm(d, p.id))),
    item("Post an update", edit(updateForm(p))),
    item("Edit project", edit(projectForm(p, d))),
    p.trial && h("a", { role: "menuitem", href: p.trial, target: "_blank", rel: "noopener", text: "Open preview site ↗" }),
  ];
  return h("details", { class: "menu" }, h("summary", { "aria-label": "Actions for " + (who || p.name), title: "Actions" }, "⋯"), h("div", { class: "menu-list", role: "menu" }, items));
}
function statusPicker(p, d) {
  return h("select", { class: "status " + (STATUS_TONE[p.status] || "mint"), "aria-label": "Status of " + p.name, onchange: (e) => clientAction("project", { id: p.id, name: p.name, domain: p.domain, trial: p.trial, status: e.target.value }, () => ({ text: p.name + " is now " + e.target.value + "." })) },
    d.statuses.map((x) => h("option", { value: x, selected: p.status === x, text: x })));
}

function clientsBody(d) {
  const q = (state.clientSearch || "").toLowerCase(), only = state.clientStatus || "";
  const rows = [];
  for (const p of d.projects) {
    if (only && p.status !== only) continue;
    const people = p.clients.length ? p.clients : [null];
    for (const c of people) {
      const hay = [p.name, p.domain, p.status, c && c.name, c && c.email].join(" ").toLowerCase();
      if (!q || hay.includes(q)) rows.push({ p, c });
    }
  }
  const search = h("input", { type: "search", class: "grow", placeholder: "Search projects, clients, emails, domains", "aria-label": "Search clients", value: state.clientSearch || "", oninput: (e) => { state.clientSearch = e.target.value; const at = e.target.selectionStart; draw(); const again = document.querySelector(".client-tools input[type=search]"); if (again) { again.focus(); again.setSelectionRange(at, at); } } });
  const filter = h("select", { "aria-label": "Show status", onchange: (e) => { state.clientStatus = e.target.value; draw(); } }, h("option", { value: "", text: "Every status" }), d.statuses.map((x) => h("option", { value: x, selected: only === x, text: x })));
  const name = (c) => c ? [c.name || h("span", { class: "small", text: "No name" }), c.disabled ? h("span", { class: "pill bad", text: "Off" }) : null, c.resetAsked ? h("span", { class: "pill gold", text: "Asked for a reset" }) : null] : h("span", { class: "small", text: "No client yet" });
  const domain = (p) => p.domain ? h("a", { class: "text-link", href: "https://" + p.domain, target: "_blank", rel: "noopener", text: p.domain }) : h("span", { class: "small", text: "—" });
  const table = h("div", { class: "panel scroll wide client-table" }, h("table", { class: "table" },
    h("thead", {}, h("tr", {}, ["Project", "Client", "Email", "Domain", "Status", ""].map((t) => h("th", { text: t })))),
    h("tbody", {}, rows.map(({ p, c }) => h("tr", {},
      h("td", {}, h("strong", { text: p.name }), p.latest ? h("div", { class: "small", text: "Last update " + prettyDay(new Date(p.latest.created).toISOString().slice(0, 10)) }) : null),
      h("td", {}, name(c)), h("td", {}, c ? c.email : ""), h("td", {}, domain(p)), h("td", {}, statusPicker(p, d)), h("td", { class: "n" }, rowMenu(p, c, d)))))));
  const cards = h("div", { class: "narrow client-cards" }, rows.map(({ p, c }) => h("div", { class: "panel client-card" },
    h("div", { class: "row" }, h("div", { class: "grow" }, h("span", { class: "eyebrow", text: p.name }), h("strong", {}, name(c)), c ? h("div", { class: "small", text: c.email }) : null), rowMenu(p, c, d)),
    h("div", { class: "row" }, domain(p), h("span", { class: "grow" }), statusPicker(p, d)))));
  const editor = state.clientEditor ? h("div", { id: "client-editor" }, state.clientEditor) : null;
  return [
    clientNotice(),
    d.email ? null : h("p", { class: "note", text: "Reset emails aren't set up yet, so ⋯ › Send reset email gives you a link to copy instead. Guides › \"Set up emails to clients\" shows how to turn it on." }),
    editor,
    h("div", { class: "row client-tools" }, search, filter),
    rows.length ? [table, cards] : h("p", { class: "empty", text: d.projects.length ? "Nothing matches." : "No projects yet. Add one to get started." }),
  ];
}
function clientsView(d) {
  const add = (form) => () => { state.clientEditor = form; draw(); };
  return [intro("Your clients", "The work, together.", "Every project, who it's for and where it stands. Clients only ever see their own page.",
    h("div", { class: "row" }, h("button", { class: "button", type: "button", text: "Add client", onclick: add(clientForm(d)) }), h("button", { class: "button secondary", type: "button", text: "Add project", onclick: add(projectForm(null, d)) }))),
  ...clientsBody(d)];
}

// ---------- Guides: the owner's SOPs and notes, written in markdown ----------
// A small markdown reader for what the guides use: headings, paragraphs, lists, tables, code, bold and links.
const mdText = (t) => t.replace(/&#91;/g, "[").replace(/&#93;/g, "]").replace(/\\([\\`*_{}\[\]()#+\-.!<>|~"])/g, "$1");
const anchor = (t) => "g-" + t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
function inline(text) {
  const out = [];
  const re = /`([^`]+)`|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let at = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > at) out.push(mdText(text.slice(at, m.index)));
    if (m[1] !== undefined) out.push(h("code", { text: m[1] }));
    else if (m[2] !== undefined) out.push(h("strong", {}, inline(m[2])));
    else {
      const url = m[4], safe = /^(https:\/\/|http:\/\/|\/|#)/.test(url);
      out.push(safe ? h("a", { href: url, target: url.startsWith("http") ? "_blank" : null, rel: url.startsWith("http") ? "noopener" : null }, inline(m[3])) : mdText(m[3]));
    }
    at = re.lastIndex;
  }
  if (at < text.length) out.push(mdText(text.slice(at)));
  return out;
}
function markdown(src) {
  const lines = String(src || "").replace(/\r/g, "").split("\n");
  const out = [];
  const cells = (l) => l.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim());
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim() || /^(&#91;|\[)embedded content/.test(line.trim())) { i++; continue; }
    if (line.startsWith("```")) {
      const code = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) code.push(lines[i]);
      out.push(h("pre", {}, h("code", { text: code.join("\n") })));
      i++; continue;
    }
    const head = /^(#{1,4})\s+(.*)$/.exec(line);
    if (head) {
      const level = Math.max(2, head[1].length), words = mdText(head[2]);
      out.push(h("h" + level, { id: anchor(words) }, inline(head[2])));
      i++; continue;
    }
    if (line.trim().startsWith("|")) {
      const rows = [];
      for (; i < lines.length && lines[i].trim().startsWith("|"); i++) rows.push(cells(lines[i]));
      const body = rows.filter((r, n) => !(n === 1 && r.every((c) => /^:?-{2,}:?$/.test(c))));
      const [first, ...rest] = body;
      out.push(h("div", { class: "scroll" }, h("table", { class: "table" },
        h("thead", {}, h("tr", {}, first.map((c) => h("th", {}, inline(c))))),
        h("tbody", {}, rest.map((r) => h("tr", {}, r.map((c) => h("td", {}, inline(c)))))))));
      continue;
    }
    const item = /^(\s*)(\d+\.|[-*])\s+(.*)$/;
    if (item.test(line)) {
      const ordered = /\d/.test(item.exec(line)[2]);
      const list = h(ordered ? "ol" : "ul");
      for (; i < lines.length && item.test(lines[i]); i++) {
        const [, , , words] = item.exec(lines[i]);
        const task = /^\[( |x)\]\s+(.*)$/i.exec(words);
        list.append(task ? h("li", { class: "task" }, h("input", { type: "checkbox", disabled: true, checked: task[1] !== " " }), " ", inline(task[2])) : h("li", {}, inline(words)));
      }
      out.push(list);
      continue;
    }
    const para = [];
    for (; i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\s*\||\s*(\d+\.|[-*])\s)/.test(lines[i]); i++) para.push(lines[i].trim());
    out.push(h("p", {}, inline(para.join(" "))));
  }
  return out;
}

// A handbook pasted whole becomes one guide per "## " section; the text before the first one is its introduction.
function splitHandbook(src) {
  const lines = String(src).replace(/\r/g, "").split("\n");
  const title = (/^#\s+(.*)$/.exec(lines.find((l) => /^#\s/.test(l)) || "") || [])[1];
  const parts = [];
  let cur = { title: title ? mdText(title) : "Introduction", body: [] };
  for (const l of lines) {
    if (/^#\s/.test(l)) continue;
    const m = /^##\s+(.*)$/.exec(l);
    if (m) { parts.push(cur); cur = { title: mdText(m[1]), body: [] }; } else cur.body.push(l);
  }
  parts.push(cur);
  return parts.map((p) => ({ title: p.title.slice(0, 120), body: p.body.join("\n").trim() })).filter((p) => p.body).map((p, n) => ({ ...p, sort: n * 10 }));
}

function guideForm(g, done) {
  const error = h("p", { class: "error", role: "alert" });
  const body = h("textarea", { name: "body", rows: "22", spellcheck: "true", "aria-label": "Guide text (markdown)" });
  body.value = g ? g.body : "";
  return h("form", { class: "panel stack", onsubmit: async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await send("guides", { id: g ? g.id : undefined, title: f.get("title"), body: body.value, sort: f.get("sort") });
      done(g ? g.id : null);
    } catch (err) { error.textContent = err.message; }
  } },
    h("h2", { text: g ? "Edit " + g.title : "New guide" }),
    h("div", { class: "split" }, h("label", {}, "Title", h("input", { name: "title", required: true, maxlength: "120", value: g ? g.title : "" })),
      h("label", {}, "Order in the list", h("input", { name: "sort", type: "number", min: "0", max: "9999", value: String(g ? g.sort : 100) }))),
    h("label", {}, "Text. Use # for headings, 1. for steps, - for bullets, **bold**, [link](https://…)", body),
    error, h("div", { class: "row" }, h("button", { class: "button", type: "submit", text: "Save" }), h("a", { class: "button secondary", href: g ? "#guides/" + encodeURIComponent(g.id) : "#guides", text: "Cancel" })));
}

function importForm() {
  const error = h("p", { class: "error", role: "alert" });
  const text = h("textarea", { rows: "12", "aria-label": "Markdown to import", placeholder: "Paste the handbook's markdown here, or choose a .md file above." });
  const file = h("input", { type: "file", accept: ".md,.markdown,.txt,text/markdown,text/plain", onchange: async (e) => { const f = e.target.files[0]; if (f) text.value = await f.text(); } });
  const split = h("input", { type: "checkbox", checked: true });
  return h("form", { class: "panel stack", onsubmit: async (e) => {
    e.preventDefault();
    if (!text.value.trim()) { error.textContent = "Paste some text or choose a file first."; return; }
    const guides = split.checked ? splitHandbook(text.value) : [{ title: ((/^#\s+(.*)$/m.exec(text.value) || [])[1] || "Imported guide").slice(0, 120), body: text.value }];
    try {
      const r = await send("guides", { guides });
      location.hash = "#guides";
      route();
      setTimeout(() => alert(plural(r.saved, "guide") + " imported."), 50);
    } catch (err) { error.textContent = err.message; }
  } },
    h("h2", { text: "Import guides" }),
    h("p", { class: "note", text: "In the Kno.plus operations handbook doc, choose Export › Markdown (or select all and copy). Then choose the file or paste it below. Importing again replaces guides with the same titles." }),
    file, text,
    h("label", { class: "row" }, split, "One guide per section (each ## heading)"),
    error, h("div", { class: "row" }, h("button", { class: "button", type: "submit", text: "Import" }), h("a", { class: "button secondary", href: "#guides", text: "Cancel" })));
}

// The built-in SOPs as questions: each opens to its steps and buttons that go straight to the right place.
function sopCard(item, open) {
  return h("details", { class: "sop", id: "sop-" + item.id, open: open || null },
    h("summary", {}, h("span", { text: item.q }), h("span", { class: "nav-plus", "aria-hidden": "true" })),
    h("div", { class: "sop-body prose" },
      h("p", {}, inline(item.answer)),
      item.steps.length ? h("ol", {}, item.steps.map((s) => h("li", {}, inline(s)))) : null,
      item.go.length ? h("div", { class: "row go" }, item.go.map((g, n) => h("a", {
        class: "button" + (n ? " secondary" : ""), href: g.href,
        target: /^https?:/.test(g.href) ? "_blank" : null, rel: /^https?:/.test(g.href) ? "noopener" : null,
      }, g.label + (/^https?:/.test(g.href) ? " ↗" : " →")))) : null));
}

function guidesView(d) {
  const editing = state.tab === "edit", making = state.guide === "new", importing = state.guide === "import";
  const reload = (id) => { location.hash = id ? "#guides/" + encodeURIComponent(id) : "#guides"; route(); };
  if (making) return [intro("Your guides", "A new guide.", null), guideForm(null, reload)];
  if (importing) return [intro("Your guides", "Import guides.", null), importForm()];

  if (state.guide && state.guide.startsWith("check:")) return checklistView(d, state.guide.slice(6));
  if (state.guide) {
    const g = d.one;
    const back = h("a", { class: "back", href: "#guides", text: "← All guides" });
    if (!g) return [back, h("div", { class: "panel" }, h("p", { text: "There's no guide called " + state.guide + "." }))];
    if (editing) return [back, guideForm(g, reload)];
    const steps = markdown(g.body);
    const inside = steps.filter((n) => n.tagName === "H3");
    return [back, h("article", { class: "panel prose" },
      h("div", { class: "panel-heading" }, h("div", {}, h("h2", { class: "guide-title", text: g.title }), h("p", { class: "small", text: "Updated " + new Date(g.updated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) })),
        h("div", { class: "row" }, h("a", { class: "button secondary", href: "#guides/" + encodeURIComponent(g.id) + "/edit", text: "Edit" }),
          h("button", { class: "button secondary", type: "button", text: "Delete", onclick: async () => { if (confirm("Delete \"" + g.title + "\"? This can't be undone.")) { await send("guides/" + encodeURIComponent(g.id), {}, "DELETE"); reload(null); } } }))),
      inside.length > 3 ? h("details", { class: "toc", open: true }, h("summary", { text: "In this guide" }), h("ul", {}, inside.map((n) => h("li", {}, h("a", { href: "#" + n.id, onclick: (e) => { e.preventDefault(); n.scrollIntoView({ behavior: "smooth" }); }, text: n.textContent }))))) : null,
      steps)];
  }

  // the questions, searchable; your own guides below them
  const search = h("input", { type: "search", class: "sop-search", placeholder: "What do you need to do? Try \"password\", \"refund\" or \"quote\"", "aria-label": "Search guides", value: state.guideSearch || "" });
  const results = h("div", { class: "sop-groups" });
  const words = (item) => [item.q, item.answer, ...item.steps].join(" ").toLowerCase();
  const fill = () => {
    const q = search.value.trim().toLowerCase();
    state.guideSearch = search.value;
    const groups = d.sops.map((g) => ({ ...g, items: g.items.filter((i) => !q || q.split(/\s+/).every((w) => words(i).includes(w))) })).filter((g) => g.items.length);
    const own = d.guides.filter((g) => !q || (g.title + "\n" + g.body).toLowerCase().includes(q));
    results.replaceChildren(
      ...groups.map((g) => h("section", { class: "sop-group" }, h("h2", { class: "section", text: g.group }), g.items.map((i) => sopCard(i, !!q && groups.length === 1 && g.items.length === 1)))),
      h("section", { class: "sop-group" }, h("div", { class: "toolbar" }, h("h2", { class: "section", text: "Your own guides" }),
        h("div", { class: "row" }, h("a", { class: "text-link", href: "#guides/new", text: "New guide" }), h("a", { class: "text-link", href: "#guides/import", text: "Import" }))),
        own.length ? h("nav", { class: "guide-list", "aria-label": "Your guides" }, own.map((g) => h("a", { href: "#guides/" + encodeURIComponent(g.id) }, g.title,
          q && !g.title.toLowerCase().includes(q) ? h("small", { text: "Mentions \"" + search.value.trim() + "\"" }) : null)))
          : h("p", { class: "note", text: q ? "None of your own guides match." : "Write your own notes with New guide, or bring in the handbook doc with Import." })),
      groups.length || own.length ? "" : h("p", { class: "empty", text: "Nothing matches \"" + search.value.trim() + "\". Try one word, like \"client\" or \"key\"." }));
  };
  search.addEventListener("input", fill);
  fill();
  return [intro("Your guides", "What do you need to do?", "Pick a question for the steps and a button that takes you there. Only your owner login can see this page."), checklistCards(d), search, results];
}

// ---------- Checklists: A to Z for a new customer or a new website, one copy per customer or site ----------
const stepCount = (list) => list.sections.reduce((n, s) => n + s.steps.length, 0);
const doneCount = (list, run) => list.sections.reduce((n, s) => n + s.steps.filter((x) => run.done[x.id]).length, 0);
// the width is set through .style, not a style attribute, which Annex's content policy blocks
const progress = (done, all) => {
  const fill = h("i");
  fill.style.width = (all ? (done / all) * 100 : 0) + "%";
  return h("div", { class: "check-bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(all), "aria-valuenow": String(done) }, fill);
};

function checklistCards(d) {
  if (!d.checklists.length) return null;
  return h("section", { class: "sop-group checklists" }, h("h2", { class: "section", text: "A-to-Z checklists" }),
    h("div", { class: "check-cards" }, d.checklists.map((list) => {
      const error = h("p", { class: "error", role: "alert" });
      const name = h("input", { name: "name", required: true, maxlength: "80", placeholder: list.placeholder, "aria-label": list.name });
      const runs = d.runs.filter((r) => r.list === list.id);
      return h("article", { class: "panel check-card" },
        h("h2", { text: list.title }), h("p", { class: "small", text: list.about }),
        runs.length ? h("nav", { class: "check-runs", "aria-label": list.title }, runs.map((r) => {
          const done = doneCount(list, r), all = stepCount(list);
          return h("a", { href: "#guides/" + encodeURIComponent("check:" + r.id) },
            h("span", { class: "row" }, h("strong", { class: "grow", text: r.name }), h("span", { class: "small num", text: done === all ? "All done" : done + " of " + all })),
            progress(done, all));
        })) : null,
        h("form", { class: "row check-start", onsubmit: async (e) => {
          e.preventDefault();
          try { const r = await send("checklists", { list: list.id, name: name.value }); location.hash = "#guides/" + encodeURIComponent("check:" + r.id); }
          catch (err) { error.textContent = err.message; }
        } }, h("label", { class: "grow" }, h("span", { class: "small", text: list.name }), name), h("button", { class: "button", type: "submit", text: runs.length ? "Start another" : "Start" })),
        error);
    })));
}

function checklistView(d, id) {
  const back = h("a", { class: "back", href: "#guides", text: "← All guides" });
  const run = d.runs.find((r) => r.id === id), list = run && d.checklists.find((c) => c.id === run.list);
  if (!run || !list) return [back, h("div", { class: "panel" }, h("p", { text: "This checklist was deleted, or never existed." }))];
  const all = stepCount(list);
  const count = h("span", { class: "small num" }), bar = h("div", { class: "check-bar" }, h("i"));
  const tally = () => {
    const done = doneCount(list, run);
    count.textContent = done === all ? "All " + all + " done" : done + " of " + all + " done";
    bar.firstChild.style.width = (done / all) * 100 + "%";
    for (const s of view.querySelectorAll(".check-section")) s.querySelector(".num").textContent = s.dataset.steps.split(",").filter((x) => run.done[x]).length + " of " + s.dataset.steps.split(",").length;
  };
  const rename = async () => {
    const name = prompt("Rename this checklist", run.name);
    if (!name || name.trim() === run.name) return;
    try { await send("checklists/" + id, { name }); run.name = name.trim(); title.textContent = run.name; } catch (err) { alert(err.message); }
  };
  const title = h("h1", { text: run.name });
  const autos = new Map();
  // Each section folds: the one you're on is open, the rest stay shut until you open them. Finishing a section by hand
  // slides it shut and opens the next one that isn't done.
  const folds = [];
  let touched = false;
  const sectionDone = (section) => section.steps.every((x) => run.done[x.id]);
  const focus = () => {
    const at = list.sections.findIndex((section) => !sectionDone(section));
    folds.forEach((f, n) => f.set(n === at));
  };
  const finished = (x) => {
    const n = list.sections.findIndex((section) => section.steps.includes(x));
    if (!sectionDone(list.sections[n])) return;
    const next = list.sections.findIndex((section, m) => m > n && !sectionDone(section));
    folds[n].set(false);
    if (next >= 0) folds[next].set(true);
  };
  const view = h("div", { class: "check-list" }, list.sections.map((section, n) => {
    const head = h("button", { class: "check-section-head", type: "button", "aria-expanded": "false", onclick: () => { touched = true; fold.set(!fold.open); } },
      h("h2", { class: "section", text: (n + 1) + ". " + section.title }), h("span", { class: "small num" }), h("span", { class: "nav-plus", "aria-hidden": "true" }));
    const fold = slider(h("div", { class: "check-steps" }, section.steps.map((x) => checkStep(list, run, x, tally, autos, finished))), head);
    folds.push(fold);
    return h("section", { class: "check-section", "data-steps": section.steps.map((x) => x.id).join(",") }, head, fold.el);
  }));
  tally();
  focus();

  // Annex looks for itself: steps it finds done tick themselves, and each step it can see says what it saw. The notes
  // from its last check show straight away and stay put; when a fresh check in the background sees something different,
  // a Refresh button appears instead of the page changing under you.
  const looking = h("p", { class: "small", role: "status" });
  const link = h("div", { class: "row check-link" });
  let pending = null;
  const refresh = h("button", { class: "button check-refresh", type: "button", hidden: true, text: "Statuses changed · Refresh", onclick: () => pending && apply(pending) });
  const say = () => {
    const seen = Object.keys(run.seen || {}).length;
    looking.textContent = pending ? "Annex has new statuses. Refresh to see them."
      : run.target ? "Annex checked " + seen + (seen === 1 ? " step" : " steps") + " for " + run.target + " " + ago(run.checked) + "."
      : run.checked ? "" : "Annex is checking…";
  };
  const apply = (r) => {
    pending = null; refresh.hidden = true;
    for (const [step, at] of Object.entries(r.done)) if (!run.done[step]) { run.done[step] = at; autos.get(step)?.tick(); }
    run.seen = r.checks; run.target = r.target; run.checked = r.at;
    for (const [step, a] of autos) a.show(r.checks[step]);
    tally();
    if (!touched) focus();
    say();
    linker(r.target);
  };
  const same = (checks) => JSON.stringify(Object.keys(checks).sort().map((k) => [k, checks[k].ok, checks[k].note]));
  // asked: you pressed Check again (or changed what it checks), so show the answer at once
  const look = async (asked) => {
    if (asked === true) looking.textContent = "Annex is checking…";
    try {
      const r = await fetchJson("checklists/" + id + "/check");
      const changed = same(r.checks) !== same(run.seen || {}) || r.target !== run.target || Object.keys(r.done).some((step) => !run.done[step]);
      if (asked === true || !run.checked || !changed) return apply(r);
      pending = r; refresh.hidden = false; say();
    } catch (err) { looking.textContent = "Annex couldn't check just now: " + err.message; }
  };
  const linker = async (target) => {
    const save = async (value) => { try { await send("checklists/" + id, { link: value }); run.link = value; look(true); } catch (err) { alert(err.message); } };
    if (list.id === "new-website") {
      const input = h("input", { value: run.link || (target ? "" : ""), placeholder: target || "example.com", "aria-label": "Domain" });
      link.replaceChildren(h("span", { class: "small", text: target ? "Checking the domain " + target + ". A different domain?" : "Which domain should Annex check?" }), input,
        h("button", { class: "button secondary", type: "button", text: "Use it", onclick: () => save(input.value) }));
    } else {
      const clients = await fetchJson("clients").catch(() => ({ projects: [] }));
      const pick = h("select", { "aria-label": "Project in Clients", onchange: () => save(pick.value) },
        h("option", { value: "", text: target ? "Matched by name" : "Pick their project" }),
        clients.projects.map((p) => h("option", { value: p.id, selected: p.id === run.link || null, text: p.name })));
      link.replaceChildren(h("span", { class: "small", text: target ? "Checking the project in Clients:" : "Link their project in Clients so Annex can check steps:" }), pick);
    }
  };
  for (const [step, a] of autos) a.show((run.seen || {})[step]);
  say();
  linker(run.target);
  look();
  return [back,
    h("div", { class: "intro" }, h("div", {}, h("span", { class: "eyebrow", text: list.title }), title, h("p", { text: list.about })),
      h("div", { class: "row" }, h("button", { class: "button secondary", type: "button", text: "Rename", onclick: rename }),
        h("button", { class: "button secondary", type: "button", text: "Delete", onclick: async () => {
          if (!confirm("Delete the checklist for \"" + run.name + "\"? Its ticks can't be brought back.")) return;
          await send("checklists/" + id, {}, "DELETE"); location.hash = "#guides";
        } }))),
    h("div", { class: "panel check-progress" }, h("div", { class: "row" }, h("strong", { class: "grow", text: "Progress" }), count), bar,
      h("div", { class: "row" }, h("span", { class: "grow" }, looking), refresh, h("button", { class: "button secondary", type: "button", text: "Check again", onclick: () => look(true) }),
        copyForAi(list, run, null)), link),
    view];
}

// The whole checklist as plain text for an AI assistant: every step, what's done and when, what Annex saw, and the step
// you're on (the one asked from, else the first not done) with its how-to, so it can pick up exactly where you are.
const plainText = (t) => String(t).replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)");
function checklistForAi(list, run, at) {
  const steps = list.sections.flatMap((s) => s.steps);
  const here = at || steps.find((x) => !run.done[x.id]);
  const day = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const seen = run.seen || {};
  const out = [
    `I'm working through the "${list.title}" checklist in Annex (my kno.plus workspace) for ${run.name}.` + (here ? ` I'm on the step marked "<- I'M HERE". Please help me get it done.` : " Every step is done."),
    "", `Progress: ${steps.filter((x) => run.done[x.id]).length} of ${steps.length} steps done.` + (run.target ? ` Annex checks ${run.target}.` : ""),
  ];
  list.sections.forEach((section, n) => {
    out.push("", (n + 1) + ". " + section.title);
    for (const x of section.steps) {
      const c = seen[x.id];
      out.push((run.done[x.id] ? "[x] " : "[ ] ") + plainText(x.text) + (run.done[x.id] ? " (done " + day(run.done[x.id]) + ")" : "")
        + (c ? " | Annex " + (c.ok ? "checked: " : "sees: ") + c.note : "") + (here && x.id === here.id ? "   <- I'M HERE" : ""));
    }
  });
  if (here) {
    out.push("", "About the step I'm on (" + plainText(here.text) + "):", plainText(here.help.answer));
    if (here.help.fix.length) out.push("What usually goes wrong:", ...here.help.fix.map((f) => "- " + plainText(f)));
    out.push("", "What I see right now: ");
  }
  return out.join("\n");
}
function copyForAi(list, run, at) {
  const button = h("button", { class: "button secondary", type: "button", text: "Copy for AI", onclick: async () => {
    const text = checklistForAi(list, run, at);
    try { await navigator.clipboard.writeText(text); button.textContent = "Copied. Paste it into Claude"; setTimeout(() => { button.textContent = "Copy for AI"; }, 2500); }
    catch { prompt("Copy this and paste it into Claude:", text); }
  } });
  return button;
}

// Something that slides open and shut under the button that toggles it. Shut, it's inert so tabbing skips what's hidden.
function slider(content, button) {
  const el = h("div", { class: "slide" }, h("div", { class: "slide-in" }, content));
  const fold = { el, open: false, set(on) {
    fold.open = on;
    el.classList.toggle("open", on);
    el.inert = !on;
    button.setAttribute("aria-expanded", String(on));
  } };
  fold.set(false);
  return fold;
}

// One step: tick it off, or open it (the +) for how to do it, what usually goes wrong, buttons that go there, and Copy for AI.
function checkStep(list, run, x, tally, autos, finished) {
  const when = h("span", { class: "small" });
  const box = h("input", { type: "checkbox", checked: !!run.done[x.id] || null, onchange: async () => {
    const on = box.checked;
    if (on) run.done[x.id] = new Date().toISOString(); else delete run.done[x.id];
    mark(); tally();
    if (on) finished(x);
    try { await send("checklists/" + run.id, { step: x.id, done: on }); }
    catch (err) { box.checked = !on; if (on) delete run.done[x.id]; else run.done[x.id] = new Date().toISOString(); mark(); tally(); alert(err.message); }
  } });
  const item = h("div", { class: "check-step" });
  const mark = () => {
    item.classList.toggle("done", !!run.done[x.id]);
    when.textContent = run.done[x.id] ? "Done " + new Date(run.done[x.id]).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  };
  const help = x.help;
  const panel = h("div", { class: "check-help prose" },
    h("p", {}, inline(help.answer)),
    help.fix.length ? [h("h4", { text: "If it's stuck" }), h("ul", {}, help.fix.map((f) => h("li", {}, inline(f))))] : null,
    h("div", { class: "row go" },
      help.go.map((g, n) => h("a", { class: "button" + (n ? " secondary" : ""), href: g.href, target: /^https?:/.test(g.href) ? "_blank" : null, rel: /^https?:/.test(g.href) ? "noopener" : null }, g.label + (/^https?:/.test(g.href) ? " ↗" : " →"))),
      copyForAi(list, run, x)));
  const toggle = h("button", { class: "check-open", type: "button", "aria-expanded": "false", "aria-label": "How to do this step", onclick: () => open.set(!open.open) },
    h("span", { class: "nav-plus", "aria-hidden": "true" }));
  const open = slider(panel, toggle);
  const seen = h("span", { class: "check-auto", hidden: true });
  autos.set(x.id, {
    tick: () => { box.checked = true; mark(); },
    show: (c) => {
      seen.hidden = !c;
      if (!c) return;
      seen.className = "check-auto " + (c.ok ? "ok" : "bad");
      seen.textContent = (c.ok ? "Checked by Annex: " : "Annex sees: ") + c.note;
    },
  });
  item.append(h("div", { class: "check-row" }, h("label", { class: "check-label" }, box, h("span", {}, h("span", { class: "check-text" }, inline(x.text)), when, seen)), toggle), open.el);
  mark();
  return item;
}

// ---------- Settings ----------
function workspaceSettingsView(d) {
  const row = (name, on, how) => h("div", { class: "row line" }, h("div", { class: "grow" }, h("strong", { text: name }), h("p", { class: "small", text: how })), h("span", { class: "pill" + (on ? "" : " bad"), text: on ? "Connected" : "Not connected" }));
  return [
    intro("Settings", "Connections.", "Where Annex gets its numbers. Keys live in Cloudflare as Worker secrets, never on this page."),
    h("div", { class: "panel" },
      row("Cloudflare traffic", d.insights.cloudflare, "Worker secret CLOUDFLARE_API_TOKEN (Zone › Zone › Read, Zone › Analytics › Read)"),
      row("Google Search Console", d.insights.google, "Worker secret GOOGLE_SERVICE_ACCOUNT (a service account's JSON key)")),
    h("h2", { class: "section", text: (state.me.account || {}).name + " sales" }),
    ...settingsView(d),
  ];
}
// ---------- Home ----------
function changeLine(change, length) {
  const span = length === 1 ? "the day before" : `the ${length} days before`;
  if (change === null) return h("div", { class: "change", text: "No sales in " + span });
  const up = change >= 0;
  return h("div", { class: "change" }, h("b", { class: up ? "up" : "down", text: (up ? "▲ " : "▼ ") + pct(Math.abs(change)) }), " vs " + span);
}
function homeView(d) {
  const length = d.series.length;
  const owner = state.me.user.role === "owner";
  const hero = (label, item, key) => h("div", { class: "card hero" },
    h("div", { class: "label", text: label }), h("div", { class: "value", text: money(item.value) }), changeLine(item.change, length),
    lineChart({ compact: true, label: label + " by day", series: [{ name: label, color: "var(--accent)", values: d.series.map((s) => ({ key: s.day, value: s[key] })) }] }));
  const n = d.now;
  const line = ([t, c]) => h("tr", {}, h("td", { text: t }), h("td", { class: "n" + (c < 0 ? " neg" : ""), text: money(c) }));
  const sum = (t, c) => h("tr", {}, h("td", {}, h("b", { text: t })), h("td", { class: "n" }, h("b", { text: money(c) })));
  const breakdown = h("details", {}, h("summary", { text: "How gross, net and profit are worked out" }),
    h("table", { class: "table" }, h("tbody", {},
      [["Sales", n.sales], ["Shipping charged to buyers", n.shippingCharged]].map(line), sum("Gross", n.gross),
      [["Square and other payment fees", -(n.fees - n.etsy)], n.etsy ? ["Etsy fees", -n.etsy] : null].filter(Boolean).map(line), sum("Net after fees", n.net),
      [["Print cost at the lab", -n.print], ["Shipping cost at the lab", -n.shipping], ["Chargebacks", -n.chargebacks], ["Your own costs", -n.other]].map(line), sum("Profit", n.profit))),
    h("p", { class: "note", text: "Sales leave out sales tax and shipping charged; gross adds the shipping back. Net is gross less every payment and selling fee. Shipping counts once in profit: what the lab charged, less what the buyer paid for it. Refunds count on the day they happen." }));
  const refresh = owner ? h("button", { class: "quiet", text: "Refresh", onclick: async (e) => { e.target.disabled = true; e.target.textContent = "Refreshing…"; try { await send("sync", {}); } catch (err) { alert(err.message); } load(); } }) : null;
  return [
    h("div", { class: "heroes" }, hero("Sales", d.sales, "sales"), hero("Profit", d.profit, "profit")),
    h("div", { class: "tiles" },
      [["Gross", money(n.gross)], ["Net after fees", money(n.net)], ["Orders", String(d.cards.orders)], ["Average order", money(d.cards.average)], ["Active members", String(d.cards.members)], ["Refunds", money(d.cards.refunds)]]
        .map(([t, v]) => h("div", { class: "card tile" }, h("div", { class: "label", text: t }), h("div", { class: "value", text: v })))),
    h("div", { class: "card" }, breakdown),
    h("div", { class: "row" }, h("span", { class: "note grow", text: d.updated ? "Updated " + ago(d.updated) : "Nothing connected yet. Connect your sales in Settings." }), refresh),
  ];
}


// ---------- Orders ----------
const STATUS = { paid: "Paid", printing: "Printing", shipped: "Shipped", refunded: "Refunded", cancelled: "Cancelled" };
function ordersView(d) {
  if (!d.orders.length) return h("p", { class: "empty", text: "No orders in these dates." });
  const pill = (o) => h("span", { class: "pill" + (o.status === "refunded" || o.status === "cancelled" || o.detail.problem ? " bad" : ""), text: o.detail.problem ? "Needs you" : STATUS[o.status] || o.status });
  const what = (o) => o.items.join(", ") || "Order";
  const ad = (o) => o.channel === "Etsy" && state.me.user.role === "owner" ? h("label", { class: "ad-tick", title: "Etsy charges an Offsite Ads fee on orders that came through its ads" },
    h("input", { type: "checkbox", checked: !!o.detail.offsite, onchange: async (e) => { try { await send("etsy/offsite", { orderId: o.id, on: e.target.checked }); load(); } catch (err) { alert(err.message); } } }), "From an Offsite Ad") : null;
  const cards = h("div", { class: "orders narrow" }, d.orders.map((o) => h("article", { class: "card order" },
    h("div", { class: "what", text: what(o) }), h("div", { class: "money", text: money(o.paid) }),
    h("div", { class: "small", text: [prettyDay(o.day), o.customer, o.channel].filter(Boolean).join(" · ") }), h("div", { class: "money small", text: "profit " + money(o.profit) }),
    h("div", {}, pill(o), o.promo ? h("span", { class: "small", text: " code " + o.promo }) : null, o.detail.problem ? h("div", { class: "small", text: o.detail.problem }) : null), ad(o))));
  const table = h("div", { class: "card scroll wide" }, h("table", { class: "table" },
    h("thead", {}, h("tr", {}, ["Date", "Order", "Customer", "Where", "Status", "Paid", "Costs", "Profit"].map((t, i) => h("th", { class: i > 4 ? "n" : null, text: t })))),
    h("tbody", {}, d.orders.map((o) => h("tr", {},
      h("td", { text: prettyDay(o.day) }),
      h("td", {}, what(o), o.promo ? h("div", { class: "small", text: "code " + o.promo }) : null, o.member ? h("div", { class: "small", text: "member price" }) : null, o.detail.problem ? h("div", { class: "small neg", text: o.detail.problem }) : null),
      h("td", { text: o.customer }), h("td", {}, o.channel, ad(o)), h("td", {}, pill(o)),
      h("td", { class: "n", text: money(o.paid) }),
      h("td", { class: "n", title: `fee ${money(o.fee)} · print ${money(o.print)} · shipping ${money(o.shipping)}`, text: money(o.cost) }),
      h("td", { class: "n" + (o.profit < 0 ? " neg" : ""), text: money(o.profit) }))))));
  return [h("p", { class: "note", text: plural(d.orders.length, "order") + ", newest first. Costs are the payment and selling fees plus what the lab charged." }), cards, table];
}

// ---------- Best sellers ----------
function bestView(d) {
  const kinds = [["products", "Photos and products"], ["collections", "Collections"], ["types", "Print types"], ["sizes", "Sizes"]];
  const pick = state.best || "products";
  const rows = d[pick] || [];
  const seg = h("div", { class: "seg", role: "group", "aria-label": "Rank by" }, kinds.map(([id, t]) => h("button", { "aria-pressed": String(pick === id), text: t, onclick: () => { state.best = id; draw(); } })));
  return [seg, rows.length ? h("div", { class: "card scroll" }, h("table", { class: "table" },
    h("thead", {}, h("tr", {}, h("th", { text: "#" }), h("th", { text: kinds.find((k) => k[0] === pick)[1] }), h("th", { class: "n", text: "Sold" }), h("th", { class: "n", text: "Sales" }), h("th", { class: "n", text: "Profit" }))),
    h("tbody", {}, rows.map((r, i) => h("tr", {}, h("td", { class: "small", text: String(i + 1) }), h("td", { text: r.name }), h("td", { class: "n", text: String(r.units) }), h("td", { class: "n", text: money(r.sales) }), h("td", { class: "n" + (r.profit < 0 ? " neg" : ""), text: money(r.profit) }))))))
    : h("p", { class: "empty", text: "Nothing sold in these dates." })];
}

// ---------- Members ----------
function membersView(d) {
  const tiles = [["Active members", String(d.active)], ["Monthly recurring", money(d.mrr)], ["New in these dates", String(d.started)], ["Cancelled", String(d.cancelled)], ["Churn", pct(d.churn)], ["Renewals failed", String(d.failed)]];
  return [
    h("div", { class: "tiles" }, tiles.map(([t, v]) => h("div", { class: "card tile" }, h("div", { class: "label", text: t }), h("div", { class: "value", text: v })))),
    h("p", { class: "note", text: "Monthly recurring counts each active plan at its monthly share (a yearly plan as a twelfth). Churn is the members who cancelled in these dates out of those active when they began." }),
    d.list.length ? h("div", { class: "card scroll" }, h("table", { class: "table" },
      h("thead", {}, h("tr", {}, ["Member", "Plan", "Since", "Paid through", "Status"].map((t) => h("th", { text: t })))),
      h("tbody", {}, d.list.map((m) => h("tr", {}, h("td", { text: m.name }), h("td", { text: m.plan + (m.cents ? " · " + money(m.cents) : "") }), h("td", { text: m.started ? prettyDay(m.started) : "" }), h("td", { text: m.through ? prettyDay(m.through) : "" }),
        h("td", {}, h("span", { class: "pill" + (m.state === "renewal failed" ? " bad" : ""), text: m.state })))))))
      : h("p", { class: "empty", text: "No members yet." }),
  ];
}

// ---------- Costs and margin ----------
function costsView(d) {
  const t = d.total;
  const owner = state.me.user.role === "owner";
  const tiles = [["Square and other fees", t.fees - t.etsy], t.etsy ? ["Etsy fees", t.etsy] : null, ["Print cost", t.print], ["Shipping, net", t.shipping - t.shippingCharged], ["Chargebacks", t.chargebacks], ["Your own costs", t.other]].filter(Boolean);
  const error = h("p", { class: "error", role: "alert" });
  const form = owner ? h("form", { class: "card stack", onsubmit: async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try { await send("costs", { note: f.get("note"), dollars: f.get("dollars"), kind: f.get("kind"), at: f.get("at"), until: f.get("until") }); load(); } catch (err) { error.textContent = err.message; }
  } },
    h("h2", { text: "Add a cost" }),
    h("p", { class: "note", text: "Costs outside each sale, like hosting, software or ads. A monthly cost is spread evenly over its days." }),
    h("div", { class: "split" },
      h("label", {}, "What it is", h("input", { name: "note", required: true, placeholder: "Cloudflare" })),
      h("label", {}, "Amount in dollars", h("input", { name: "dollars", type: "number", step: "0.01", min: "0.01", required: true, inputmode: "decimal" })),
      h("label", {}, "How often", h("select", { name: "kind" }, h("option", { value: "monthly", text: "Every month" }), h("option", { value: "once", text: "Once" }))),
      h("label", {}, "Starting", h("input", { name: "at", type: "date", required: true, value: todayIn(tz()).slice(0, 8) + "01" })),
      h("label", {}, "Ending (leave empty if it goes on)", h("input", { name: "until", type: "date" }))),
    error, h("div", {}, h("button", { class: "primary", type: "submit", text: "Add cost" }))) : null;
  const etsy = t.etsy ? h("div", { class: "card scroll" }, h("h2", { text: "Etsy fees" }), h("table", { class: "table" }, h("tbody", {},
    [["Transaction, 6.5% of the order without tax", t.etsyTransaction], ["Payment processing, 3% + $0.25", t.etsyProcessing], ["Listings, $0.20 each", t.etsyListing], ["Currency conversion, 2.5%", t.etsyConversion], ["Offsite Ads", t.etsyOffsite], ["Shop setup, $29 once", t.etsySetup], ["Etsy Plus, $10 a month", t.etsyPlus], ["Etsy Plus listing credits", t.etsyCredits]]
      .filter(([, c]) => c).map(([n, c]) => h("tr", {}, h("td", { text: n }), h("td", { class: "n", text: money(c) }))),
    h("tr", {}, h("td", {}, h("b", { text: "All Etsy fees" })), h("td", { class: "n" }, h("b", { text: money(t.etsy) }))))),
    h("p", { class: "note", text: "Worked out from Etsy's published rates. Refunds give back the transaction fee in proportion. Settings › Etsy changes the rates that vary." })) : null;
  return [
    h("div", { class: "tiles" }, tiles.map(([n, c]) => h("div", { class: "card tile" }, h("div", { class: "label", text: n }), h("div", { class: "value", text: money(c) })))),
    etsy,
    h("div", { class: "card scroll" }, h("h2", { text: "Margin by type" }), d.types.length ? h("table", { class: "table" },
      h("thead", {}, h("tr", {}, ["Type", "Sold", "Sales", "Profit", "Margin"].map((x, i) => h("th", { class: i ? "n" : null, text: x })))),
      h("tbody", {}, d.types.map((r) => h("tr", {}, h("td", { text: r.name }), h("td", { class: "n", text: String(r.units) }), h("td", { class: "n", text: money(r.sales) }), h("td", { class: "n" + (r.profit < 0 ? " neg" : ""), text: money(r.profit) }), h("td", { class: "n", text: pct(r.margin) })))))
      : h("p", { class: "note", text: "Nothing sold in these dates." })),
    form,
    d.manual.length ? h("div", { class: "card scroll" }, h("h2", { text: "Your costs" }), h("table", { class: "table" },
      h("tbody", {}, d.manual.map((c) => h("tr", {}, h("td", { text: c.note }), h("td", { class: "small", text: (c.kind === "once" ? "once, " : "monthly from ") + prettyDay(c.at.slice(0, 10)) + (c.until ? " to " + prettyDay(c.until) : "") }),
        h("td", { class: "n", text: money(c.cents) }), owner ? h("td", { class: "n" }, h("button", { class: "quiet", text: "Remove", "aria-label": "Remove " + c.note, onclick: async () => { await send("costs/" + encodeURIComponent(c.id), {}, "DELETE"); load(); } })) : null)))))
      : null,
  ];
}

// ---------- Trends ----------
function trendsView(d) {
  const by = state.by || "day";
  const seg = h("div", { class: "seg", role: "group", "aria-label": "Group by" }, [["day", "Day"], ["week", "Week"], ["month", "Month"]].map(([id, t]) =>
    h("button", { "aria-pressed": String(by === id), text: t, onclick: () => { state.by = id; load(); } })));
  const series = (key) => [
    { name: "These dates", color: "var(--series-1)", values: d.now.map((p) => ({ key: p.key, value: p[key] })) },
    { name: "The period before", color: "var(--series-2)", dash: "dash", values: d.before.map((p) => ({ key: p.key, value: p[key] })) },
    { name: "A year earlier", color: "var(--series-3)", dash: "dot", values: d.lastYear.map((p) => ({ key: p.key, value: p[key] })) },
  ];
  const sum = (t) => [t.sales, t.profit];
  const totals = h("table", { class: "table" }, h("thead", {}, h("tr", {}, h("th", { text: "" }), h("th", { class: "n", text: "Sales" }), h("th", { class: "n", text: "Profit" }))),
    h("tbody", {}, [["These dates", d.totals.now], ["The period before", d.totals.before], ["A year earlier", d.totals.lastYear]].map(([t, v]) => h("tr", {}, h("td", { text: t }), ...sum(v).map((c) => h("td", { class: "n", text: money(c) }))))));
  const chartCard = (title, key) => h("div", { class: "card" }, h("h2", { text: title }), lineChart({ label: title, series: series(key), axis: true }),
    h("details", {}, h("summary", { text: "Show as a table" }), h("div", { class: "scroll" }, h("table", { class: "table" },
      h("thead", {}, h("tr", {}, h("th", { text: by === "day" ? "Day" : by === "week" ? "Week of" : "Month" }), h("th", { class: "n", text: "These dates" }), h("th", { class: "n", text: "Before" }), h("th", { class: "n", text: "Year earlier" }))),
      h("tbody", {}, d.now.map((p, i) => h("tr", {}, h("td", { text: label(p.key) }), h("td", { class: "n", text: money(p[key]) }), h("td", { class: "n", text: d.before[i] ? money(d.before[i][key]) : "" }), h("td", { class: "n", text: d.lastYear[i] ? money(d.lastYear[i][key]) : "" }))))))));
  return [seg, chartCard("Sales", "sales"), chartCard("Profit", "profit"), h("div", { class: "card" }, totals)];
}
const label = (key) => (key.length === 7 ? new Date(key + "-15T12:00:00Z").toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }) : prettyDay(key));

// ---------- Settings ----------
// ---------- Help windows ----------
// How to set up each connection, opened from its Help button. Each entry is [heading, ...lines]; a line that is an
// array is a list.
const code = (t) => h("code", { text: t });
// Each guide says where to find every key and where it goes. Two places hold keys in Cloudflare:
const STORE_STEPS = ["Cloudflare › Secrets Store (left menu) › your store › Create secret. Use the exact name given, paste the value, set the scope to Workers, and save. The kno.plus worker reads it from there; nothing else to do."];
const WORKER_STEPS = ["Cloudflare › Workers & Pages › knoplus-website › Settings › Variables and Secrets › Add. Choose Secret, use the exact name given, paste the value, and Deploy."];
const HELP = {
  rosewave: () => [
    ["What it brings in", "Orders and memberships from the RoseWave app and the kno.plus store."],
    ["1. The feed password", [
      "Make up a long random value (24+ characters) with your password manager. It isn't from any website; it's what RoseWave and Annex share so they trust each other.",
      ["Save it in the Secrets Store as ", code("ROSEWAVE_ANNEX_KEY"), "."],
      ["Save the same value on the RoseWave worker as a secret named ", code("ANNEX_KEY"), " (Workers & Pages › RoseWave's worker › Settings › Variables and Secrets › Add)."]]],
    ["2. RoseWave's address", [
      "Cloudflare › Workers & Pages › RoseWave's worker. Copy the address under Domains & Routes (it ends in .workers.dev, or is your own domain).",
      "Paste it into this card's RoseWave worker address and press Save."]],
    ["3. Check", ["Press Refresh now under Connections. This card turns green when the feed answers."]],
    ["Where keys go", [...STORE_STEPS]],
  ],
  square: (c, d) => [
    ["What it brings in", "Payments, refunds, Square's fees, subscriptions and disputes."],
    ["1. Access token (needed)", [
      ["Open ", h("a", { href: "https://developer.squareup.com/apps", target: "_blank", rel: "noopener", text: "developer.squareup.com/apps" }), " and open your app."],
      "Choose Sandbox or Production at the top (the same one RoseWave uses), open Credentials, and copy the Access token.",
      ["Save it in the Secrets Store as ", code("SQUARE_TOKEN"), ". RoseWave uses the same one."],
      "Sandbox token? Tick Sandbox on this card and press Save. Untick it when you switch to Production."]],
    ["2. Webhook signature (optional: instant updates)", [
      "Without it, Annex still pulls Square every night and when you press Refresh now.",
      ["In your Square app: Webhooks › Subscriptions (Sandbox or Production, as above) › Add subscription. URL: ", code(d.hook), ". Events: payment, refund, subscription, invoice and dispute. Save."],
      ["Open the subscription and copy its Signature key. Save it on the kno.plus worker as ", code("ROSEWAVE_SQUARE_SIGNATURE"), " (it belongs to this webhook only, so not in the store)."]]],
    ["3. Check", ["Press Refresh now. This card shows the payments it found."]],
    ["Where keys go", [...STORE_STEPS, ...WORKER_STEPS]],
  ],
  prodigi: () => [
    ["What it brings in", "What each print cost at the lab, and its shipping."],
    ["1. Live API key (needed)", [
      ["Sign in at ", h("a", { href: "https://dashboard.prodigi.com", target: "_blank", rel: "noopener", text: "dashboard.prodigi.com" }), ", open Settings, and copy the API key."],
      ["Save it in the Secrets Store as ", code("PRODIGI_KEY"), ". RoseWave uses the same one."]]],
    ["2. Sandbox key (optional: test orders)", [
      "Only if you place test orders. Sign in to Prodigi's sandbox dashboard and copy its API key the same way.",
      ["Save it on the kno.plus worker as ", code("ROSEWAVE_PRODIGI_SANDBOX"), "."]]],
    ["3. Check", ["Press Refresh now. This card shows how many lab orders it found."]],
    ["Where keys go", [...STORE_STEPS, ...WORKER_STEPS]],
  ],
  etsy: (c) => [
    ["What it brings in", "Etsy orders with their items, refunds and fees, and the active listing count."],
    ["1. The app's keys (needed)", [
      ["Open ", h("a", { href: "https://www.etsy.com/developers/your-apps", target: "_blank", rel: "noopener", text: "etsy.com/developers/your-apps" }), " and open your app. Copy the Keystring and the Shared secret."],
      ["Save them on the kno.plus worker as ", code("ETSY_KEY"), " and ", code("ETSY_SECRET"), "."],
      ["In the app's settings, add the callback URL ", code(c.callback), " exactly."]]],
    ["2. Connect", ["Press Connect Etsy, sign in to Etsy and press Allow access. Etsy sends you back here, and orders come in within a minute.", "If Etsy ever ends the link, or ETSY_SECRET changes, press Connect again."]],
    ["3. Webhook (optional: instant updates)", [
      ["In the app's Webhooks, add an endpoint ", code(c.hook), " with the Order and Listing events."],
      ["Copy its signing secret and save it on the kno.plus worker as ", code("ETSY_WEBHOOK_SECRET"), "."]]],
    ["Fees Annex counts", ["6.5% transaction, on the order without tax", "3% + $0.25 payment processing", "$0.20 when a listing renews after a sale, and every 4 months per active listing", "$29 setup fee, unless waived", "Etsy Plus: $10 a month, with 15 listing credits a month off listing fees", "Currency conversion 2.5%, only if your shop's currency differs from your bank's", "Offsite Ads 15% (12% over $10,000 a year), on orders you tick as from an Offsite Ad under Orders"]],
    ["Older sales from a file", ["In Etsy: Shop Manager › Settings › Options › Download Data. Download Orders, then Order Items, and import each with Import a file. Importing again never doubles orders."]],
    ["Where keys go", [...WORKER_STEPS]],
  ],
};
function help(title, sections, secrets) {
  const line = (l) => h("li", {}, Array.isArray(l) ? l : [l]);
  const box = h("dialog", { class: "help-dialog", "aria-label": title + " help", onclose: () => box.remove(), onclick: (e) => { if (e.target === box) box.close(); } },
    h("div", { class: "stack" },
      h("div", { class: "row" }, h("h2", { class: "grow", text: title }), h("button", { class: "quiet", type: "button", text: "Close", onclick: () => box.close() })),
      sections.map(([head, body]) => h("section", { class: "stack" }, h("h3", { text: head }), Array.isArray(body) ? h("ul", {}, body.map(line)) : h("p", { text: body }))),
      secrets.length ? h("section", { class: "stack" }, h("h3", { text: "Your keys" }),
        h("p", { class: "small", text: "Right now, in Cloudflare:" }),
        h("ul", {}, secrets.map((x) => h("li", {}, code(x.name), x.store ? " (Secrets Store)" : " (kno.plus worker)", x.set ? " is set" : x.optional ? " is not set (optional)" : h("span", { class: "neg", text: " is not set" }))))) : null));
  document.body.append(box);
  box.showModal();
}

function settingsView(d) {
  const acct = state.acct || state.me.account;
  const colors = (acct.brand || {}).colors || {};
  const zones = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : [acct.tz];
  const said = h("p", { class: "note", role: "status" });
  const account = h("form", { class: "card stack", onsubmit: async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await send("settings", { name: f.get("name"), tz: f.get("tz"), colors });
      location.reload();
    } catch (err) { said.textContent = err.message; }
  } },
    h("h2", { text: "Sales account" }),
    h("div", { class: "split" },
      h("label", {}, "Business name", h("input", { name: "name", value: acct.name })),
      h("label", {}, "Time zone", h("select", { name: "tz" }, zones.map((z) => h("option", { value: z, selected: z === acct.tz, text: z.replace(/_/g, " ") }))))),
    said, h("div", {}, h("button", { class: "primary", type: "submit", text: "Save" })));

  // Each connection shows only what it is and what can be set; how to set it up lives behind Help.
  const conn = (c) => {
    const msg = h("p", { class: "note", role: "status" });
    const back = c.id === "etsy" && !!etsyNote; // just back from Etsy's sign-in: open this card
    const missing = c.secrets.filter((s) => !s.set && !s.optional).map((s) => s.name);
    const tick = (name, on, text) => h("label", { class: "row tick" }, h("input", { type: "checkbox", name, checked: !!on }), text);
    const fields = [];
    if (c.id === "rosewave") fields.push(h("label", {}, "RoseWave worker address", h("input", { name: "url", type: "url", value: c.config.url || "", placeholder: "https://…workers.dev" })));
    if (c.id === "square") fields.push(tick("sandbox", c.config.sandbox, "Sandbox (test payments only)"));
    if (c.id === "etsy") {
      const since = h("label", { hidden: !c.config.plus }, "Etsy Plus since", h("input", { name: "plusFrom", type: "date", value: c.config.plusFrom || "" }));
      const plus = tick("plus", c.config.plus, "Etsy Plus");
      plus.querySelector("input").addEventListener("change", (e) => { since.hidden = !e.target.checked; });
      fields.push(
        h("div", { class: "split tight" },
          h("label", {}, "Shop opened", h("input", { name: "opened", type: "date", value: c.config.opened || "" })),
          // a linked shop's listings are counted by Etsy, so they're shown, not typed
          c.linked ? h("div", { class: "readout" }, h("span", { class: "small", text: "Active listings (from Etsy)" }), h("strong", { text: String(c.config.listings || 0) }))
            : h("label", {}, "Active listings", h("input", { name: "listings", type: "number", min: "0", step: "1", value: String(c.config.listings || 0) })),
          h("label", {}, "Offsite Ads rate", h("select", { name: "offsiteRate" }, h("option", { value: "15", selected: c.config.offsiteRate !== 12, text: "15%" }), h("option", { value: "12", selected: c.config.offsiteRate === 12, text: "12%" }))),
          since),
        h("div", { class: "row ticks" }, plus, tick("setupWaived", c.config.setupWaived, "Setup fee waived"), tick("conversion", c.config.conversion, "Currency conversion")));
    }
    const status = c.message.startsWith("Problem") ? ["Problem", "bad"] : c.lastOk ? ["Connected", "good"] : ["Not connected", "bad"];
    const form = h("form", { class: "stack", onsubmit: async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await send("connections/" + c.id, { url: f.get("url"), sandbox: f.get("sandbox") === "on", opened: f.get("opened"), listings: f.get("listings"), conversion: f.get("conversion") === "on", offsiteRate: f.get("offsiteRate"), plus: f.get("plus") === "on", plusFrom: f.get("plusFrom"), setupWaived: f.get("setupWaived") === "on" });
        msg.textContent = c.id === "etsy" ? "Saved. Every Etsy order's fees were worked out again." : "Saved. It will pull everything on the next refresh.";
      } catch (err) { msg.textContent = err.message; }
    } },
      h("p", { class: c.message.startsWith("Problem") ? "error" : "note", text: (c.message ? c.message.replace(/\.?$/, ".") : "Not run yet.") + (c.lastOk ? (c.id === "etsy" && !c.linked ? " Last imported " : " Last pulled ") + ago(c.lastOk) + "." : "") }),
      missing.length ? h("p", { class: "error", text: "Missing in Cloudflare: " + missing.join(", ") + ". Help shows where." }) : null,
      c.id === "etsy" ? etsyLink(c, msg) : null,
      ...fields,
      h("div", { class: "row" },
        fields.length ? h("button", { class: "quiet", type: "submit", text: "Save" }) : null,
        c.id === "etsy" ? etsyImport(msg) : null,
        h("button", { class: "quiet help-button", type: "button", text: "Help", onclick: () => help(c.name, HELP[c.id] ? HELP[c.id](c, d) : [], c.secrets) })),
      msg);
    // each connection folds away; the status stays on the closed card, and which ones are open is remembered
    const opened = recall("annex-conn-open") || [];
    return h("details", { class: "card conn", open: opened.includes(c.id) || back, ontoggle: (e) => {
      const now = (recall("annex-conn-open") || []).filter((id) => id !== c.id);
      store("annex-conn-open", e.target.open ? [...now, c.id] : now);
    } },
      h("summary", {}, h("h2", { class: "grow", text: c.name }), h("span", { class: "pill status-" + status[1], text: status[0] }), h("span", { class: "nav-plus", "aria-hidden": "true" })),
      form);
  };
  // Connect Etsy: Etsy asks the owner to allow Annex, then sends them back; orders then come in by themselves
  const etsyLink = (c, said) => {
    if (etsyNote) { said.textContent = etsyNote; etsyNote = ""; }
    const ready = c.secrets.filter((s) => s.name !== "ETSY_WEBHOOK_SECRET").every((s) => s.set);
    const connect = h("button", { class: c.linked ? "quiet" : "primary", type: "button", text: c.linked ? "Connect again" : "Connect Etsy", disabled: !ready, onclick: async () => {
      connect.disabled = true;
      try { location.href = (await send("etsy/connect", {})).url; } catch (err) { said.textContent = err.message; connect.disabled = false; }
    } });
    const off = c.linked ? h("button", { class: "quiet", type: "button", text: "Disconnect", onclick: async () => {
      if (!confirm("Disconnect Etsy? Orders already in Annex stay.")) return;
      try { await send("etsy/disconnect", {}); location.reload(); } catch (err) { said.textContent = err.message; }
    } }) : null;
    return h("div", { class: "row" }, h("span", { class: "grow small", text: c.linked ? `Etsy shop ${c.linked.shop}, linked ${prettyDay(c.linked.at.slice(0, 10))}` : "Not linked to your Etsy shop yet" }), connect, off);
  };
  // Etsy's sales files (Orders, then Order Items): one button that asks for the file and imports it
  const etsyImport = (said) => {
    const file = h("input", { type: "file", accept: ".csv,text/csv", hidden: true, "aria-label": "Etsy file", onchange: async () => {
      if (!file.files[0]) return;
      said.textContent = "Importing…";
      try {
        const r = await send("etsy/import", { csv: await file.files[0].text() });
        said.textContent = r.kind === "items" ? `Filled in what sold for ${plural(r.count, "order")}.` : `Imported ${plural(r.count, "order")} with their Etsy fees.`;
      } catch (err) { said.textContent = err.message; }
      file.value = "";
    } });
    return [file, h("button", { class: "quiet", type: "button", text: "Import a file", onclick: () => file.click() })];
  };

  const sync = h("p", { class: "note", role: "status" });
  const run = (full) => async (e) => {
    e.target.disabled = true;
    sync.textContent = full ? "Pulling everything. This can take a minute…" : "Refreshing…";
    try { const r = await send("sync", { full }); sync.textContent = Object.entries(r.report).map(([k, v]) => k + ": " + v).join(" · "); } catch (err) { sync.textContent = err.message; }
    e.target.disabled = false;
  };
  return [
    account,
    h("div", { class: "card stack" }, h("h2", { text: "Connections" }),
      h("div", { class: "row" }, h("button", { class: "quiet", text: "Refresh now", onclick: run(false) }), h("button", { class: "quiet", text: "Pull all history again", onclick: run(true) })), sync),
    ...d.connections.map(conn),
  ];
}

// ---------- the line chart ----------
// One y axis from zero, thin lines, a crosshair that finds the nearest point and a tooltip listing every series there.
function lineChart({ series, compact = false, axis = false, label: name, format = money }) {
  const box = h("div", { class: "chart", tabindex: "0", role: "img", "aria-label": name + (compact ? "" : ". Use the arrow keys to read each point.") });
  requestAnimationFrame(() => paint(box, series, compact, axis, format));
  return box;
}
function paint(box, series, compact, axis, format) {
  const W = Math.max(200, box.clientWidth || 300), H = compact ? 56 : 220;
  const pad = compact ? { l: 2, r: 2, t: 4, b: 4 } : { l: 56, r: 10, t: 10, b: 24 };
  const n = Math.max(...series.map((s) => s.values.length), 1);
  const all = series.flatMap((s) => s.values.map((v) => v.value));
  let lo = Math.min(0, ...all), hi = Math.max(0, ...all);
  if (hi === lo) hi = lo + 100;
  const ticks = niceTicks(lo, hi);
  lo = Math.min(lo, ticks[0]); hi = Math.max(hi, ticks[ticks.length - 1]);
  const x = (i) => pad.l + (n === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (n - 1));
  const y = (v) => pad.t + ((hi - v) * (H - pad.t - pad.b)) / (hi - lo);
  const svg = h("svg:svg", { viewBox: `0 0 ${W} ${H}`, height: H, "aria-hidden": "true" });
  svg.style.height = H + "px";
  if (!compact) for (const t of ticks) {
    svg.append(h("svg:line", { class: "grid", x1: pad.l, x2: W - pad.r, y1: y(t), y2: y(t) }));
    svg.append(h("svg:text", { class: "axis", x: pad.l - 6, y: y(t) + 4, "text-anchor": "end", text: format === money ? shortMoney(t) : format(t) }));
  }
  if (compact && lo < 0) svg.append(h("svg:line", { class: "grid", x1: 0, x2: W, y1: y(0), y2: y(0) }));
  if (axis) {
    const first = series[0].values;
    for (const i of [0, Math.floor((n - 1) / 2), n - 1]) if (first[i]) svg.append(h("svg:text", { class: "axis", x: x(i), y: H - 6, "text-anchor": i === 0 ? "start" : i === n - 1 ? "end" : "middle", text: label(first[i].key) }));
  }
  for (const s of [...series].reverse()) {
    if (!s.values.length) continue;
    const path = h("svg:polyline", { fill: "none", "stroke-width": "2", "stroke-linejoin": "round", "stroke-linecap": "round", points: s.values.map((v, i) => `${x(i)},${y(v.value)}`).join(" ") });
    path.style.stroke = s.color;
    if (s.dash) path.setAttribute("stroke-dasharray", s.dash === "dash" ? "6 4" : "1.5 4");
    svg.append(path);
    if (s.values.length === 1) { const dot = h("svg:circle", { r: 3.5, cx: x(0), cy: y(s.values[0].value) }); dot.style.fill = s.color; svg.append(dot); }
  }
  const hair = h("svg:line", { class: "hair", y1: pad.t, y2: H - pad.b, visibility: "hidden" });
  const dots = series.map((s) => { const c = h("svg:circle", { r: 4, visibility: "hidden", "stroke-width": 2 }); c.style.fill = s.color; c.style.stroke = "var(--surface)"; return c; });
  svg.append(hair, ...dots);
  const legend = compact ? null : h("ul", { class: "legend" }, series.map((s) => { const k = h("span", { class: "key" + (s.dash ? " " + s.dash : "") }); k.style.borderTopColor = s.color; return h("li", {}, k, s.name); }));
  box.replaceChildren(...[legend, svg].filter(Boolean));
  const show = (i, px, py) => {
    hair.setAttribute("x1", x(i)); hair.setAttribute("x2", x(i)); hair.setAttribute("visibility", "visible");
    series.forEach((s, j) => { const v = s.values[i]; if (v) { dots[j].setAttribute("cx", x(i)); dots[j].setAttribute("cy", y(v.value)); dots[j].setAttribute("visibility", "visible"); } else dots[j].setAttribute("visibility", "hidden"); });
    tip.replaceChildren(h("div", { class: "t", text: label(series[0].values[i] ? series[0].values[i].key : "") }),
      ...series.map((s) => { const v = s.values[i]; if (!v) return null; const k = h("span", { class: "key" + (s.dash ? " " + s.dash : "") }); k.style.borderTopColor = s.color; return h("div", { class: "r" }, k, h("span", { text: series.length > 1 ? s.name + (s !== series[0] ? " (" + label(v.key) + ")" : "") : "" }), h("b", { text: format(v.value) })); }).filter(Boolean));
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    tip.style.left = Math.min(innerWidth - r.width - 8, Math.max(8, px + 14)) + "px";
    tip.style.top = Math.max(8, py - r.height - 12) + "px";
  };
  const hide = () => { tip.hidden = true; hair.setAttribute("visibility", "hidden"); dots.forEach((d) => d.setAttribute("visibility", "hidden")); };
  const nearest = (clientX) => { const b = svg.getBoundingClientRect(); const px = ((clientX - b.left) * W) / b.width; return Math.max(0, Math.min(n - 1, Math.round(n === 1 ? 0 : ((px - pad.l) * (n - 1)) / (W - pad.l - pad.r)))); };
  svg.addEventListener("pointermove", (e) => show(nearest(e.clientX), e.clientX, e.clientY));
  svg.addEventListener("pointerleave", hide);
  let at = n - 1;
  box.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    at = Math.max(0, Math.min(n - 1, at + (e.key === "ArrowRight" ? 1 : -1)));
    const b = svg.getBoundingClientRect();
    show(at, b.left + (x(at) * b.width) / W, b.top + 20);
  });
  box.addEventListener("blur", hide);
}
function niceTicks(lo, hi) {
  const span = hi - lo, raw = span / 3, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const out = [];
  for (let t = Math.floor(lo / step) * step; t <= hi + step * 0.001; t += step) out.push(Math.round(t));
  if (out[out.length - 1] < hi) out.push(out[out.length - 1] + Math.round(step));
  return out;
}
const shortMoney = (c) => (c < 0 ? "-" : "") + (Math.abs(c) >= 100000 ? "$" + Math.round(Math.abs(c) / 100000) + "k" : "$" + Math.round(Math.abs(c) / 100));

boot();
