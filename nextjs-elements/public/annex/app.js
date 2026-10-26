// Annex: Quest's Kno.plus workspace. One page, drawn from /annex/api. Text from the server is always set as text,
// never as HTML.
const API = "/annex/api/";
const app = document.getElementById("app");
const tip = document.getElementById("tip");
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
const WORKSPACE = /^(me|site|websites|search|assets|clients|guides|overview|setup)\b/;
const scoped = (path) => (state.account && !WORKSPACE.test(path) ? path + (path.includes("?") ? "&" : "?") + "account=" + encodeURIComponent(state.account) : path);
async function get(path) {
  const r = await fetch(API + scoped(path), { credentials: "same-origin" });
  const body = await r.json().catch(() => ({}));
  if (r.status === 401) { state.me.user = null; route(); throw new Error("signed out"); }
  if (!r.ok) throw new Error(body.error || "Something went wrong");
  return body;
}
async function send(path, body, method = "POST") {
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
function rangeDays() {
  const r = state.range, today = todayIn(tz());
  if (r.preset === "custom" && r.from && r.to) return { from: r.from, to: r.to };
  if (r.preset === "today") return { from: today, to: today };
  if (r.preset === "week") { const wd = (new Date(today + "T00:00:00Z").getUTCDay() + 6) % 7; return { from: addDays(today, -wd), to: today }; }
  if (r.preset === "month") return { from: today.slice(0, 8) + "01", to: today };
  if (r.preset === "year") return { from: today.slice(0, 5) + "01-01", to: today };
  if (r.preset === "90") return { from: addDays(today, -89), to: today };
  return { from: addDays(today, -29), to: today };
}
const rangeQuery = () => { const { from, to } = rangeDays(); return `from=${from}&to=${to}`; };
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
  let wait;
  addEventListener("resize", () => { clearTimeout(wait); wait = setTimeout(() => state.data && draw(), 150); });
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
    PAGES.map(([id, name]) => h("a", { href: "#" + id, class: current === id ? "active" : null, "aria-current": current === id ? "page" : null, onclick: () => open(false) }, name, h("span", { class: "nav-plus", "aria-hidden": "true" }))));
  const signOut = h("button", { class: "text-link", text: "Sign out", onclick: async () => {
    await fetch("/api/clients/logout", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" });
    location.reload();
  } });
  document.body.classList.remove("menu-open");
  app.replaceChildren(
    h("div", { class: "mobile-bar" }, h("a", { class: "brand", href: "/", text: "KNOPLUS" }), toggle),
    h("aside", { id: "sidebar" }, h("a", { class: "brand", href: "/", text: "KNOPLUS" }), nav,
      h("div", { class: "aside-bottom" }, h("div", { class: "motto" }, "Know More.", h("br"), "Know Better.", h("br"), "Knoplus."),
        h("p", { class: "small", text: state.me.user.email }), h("div", { class: "row" }, h("a", { class: "text-link", href: "/", text: "kno.plus ↗" }), signOut))),
    h("main", {}, h("header", { class: "crumbs" }, h("span", { id: "crumb", text: crumb() }), h("span", { class: "identity" }, "Owner", h("i"))),
      h("section", { class: "view", id: "view" }, h("p", { class: "loading", text: "Loading…" }))));
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
  const list = await get("assets").catch(() => ({ assets: [] }));
  state.assetRow = list.assets.find((a) => a.id === state.asset) || null;
  state.accounts = list.accounts || [];
  if (state.assetRow && state.assetRow.account) {
    state.account = state.assetRow.account;
    state.acct = (await get("me?account=" + encodeURIComponent(state.account)).catch(() => ({}))).account || null;
  }
}

async function load() {
  const view = document.getElementById("view");
  const page = state.page, tab = state.tab, asset = state.asset, guide = state.guide;
  try {
    let path;
    if (page === "overview") path = "overview";
    else if (page === "assets") path = "assets";
    else if (page === "clients") path = "clients";
    else if (page === "settings") path = "connections";
    else if (page === "guides") {
      const [list, one] = await Promise.all([get("guides"), state.guide && !["new", "import"].includes(state.guide) ? get("guides/" + encodeURIComponent(state.guide)).catch(() => null) : null]);
      return done({ guides: list.guides, sops: list.sops || [], one });
    } else if (page === "websites") {
      const days = state.days;
      const [web, searchData, site] = await Promise.all([get("websites?days=" + days), get("search?days=" + days), get("site?days=" + days)]);
      return done({ web, search: searchData, site });
    } else if (page === "asset") {
      if (!state.assetRow) return view.replaceChildren(h("p", { class: "empty", text: "There's no asset called " + asset + "." }));
      if (!state.account) return done(asset === "websites" ? await get("clients") : null);
      const q = rangeQuery();
      path = { home: "home?" + q, orders: "orders?" + q, best: "best?" + q, members: "members?" + q, costs: "costs?" + q, trends: "trends?" + q + "&by=" + (state.by || "day"), settings: "connections" }[tab] || "home?" + q;
    }
    done(await get(path));
  } catch (err) {
    if (err.message !== "signed out") view.replaceChildren(h("p", { class: "empty", text: err.message }));
  }
  function done(data) {
    if (page !== state.page || tab !== state.tab || asset !== state.asset || guide !== state.guide) return;
    state.data = data;
    draw();
  }
}

// an open ⋯ menu closes when you click anywhere else or press Escape
document.addEventListener("click", (e) => { for (const m of document.querySelectorAll("details.menu[open]")) if (!m.contains(e.target)) m.open = false; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") for (const m of document.querySelectorAll("details.menu[open]")) m.open = false; });
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
  return [intro("Your guides", "What do you need to do?", "Pick a question for the steps and a button that takes you there. Only your owner login can see this page."), search, results];
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
  const breakdown = h("details", {}, h("summary", { text: "How profit is worked out" }),
    h("table", { class: "table" }, h("tbody", {},
      [["Sales", n.sales], ["Shipping charged to buyers", n.shippingCharged], ["Payment fees", -n.fees], ["Print cost at the lab", -n.print], ["Shipping cost at the lab", -n.shipping], ["Chargebacks", -n.chargebacks], ["Your own costs", -n.other]]
        .map(([t, c]) => h("tr", {}, h("td", { text: t }), h("td", { class: "n" + (c < 0 ? " neg" : ""), text: money(c) }))),
      h("tr", {}, h("td", {}, h("b", { text: "Profit" })), h("td", { class: "n" }, h("b", { text: money(n.profit) }))))),
    h("p", { class: "note", text: "Sales leave out sales tax and shipping charged. Shipping counts once: what the lab charged, less what the buyer paid for it. Refunds count on the day they happen." }));
  const refresh = owner ? h("button", { class: "quiet", text: "Refresh", onclick: async (e) => { e.target.disabled = true; e.target.textContent = "Refreshing…"; try { await send("sync", {}); } catch (err) { alert(err.message); } load(); } }) : null;
  return [
    h("div", { class: "heroes" }, hero("Sales", d.sales, "sales"), hero("Profit", d.profit, "profit")),
    h("div", { class: "tiles" },
      [["Orders", String(d.cards.orders)], ["Average order", money(d.cards.average)], ["Active members", String(d.cards.members)], ["Refunds", money(d.cards.refunds)]]
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
  const cards = h("div", { class: "orders narrow" }, d.orders.map((o) => h("article", { class: "card order" },
    h("div", { class: "what", text: what(o) }), h("div", { class: "money", text: money(o.paid) }),
    h("div", { class: "small", text: [prettyDay(o.day), o.customer, o.channel].filter(Boolean).join(" · ") }), h("div", { class: "money small", text: "profit " + money(o.profit) }),
    h("div", {}, pill(o), o.promo ? h("span", { class: "small", text: " code " + o.promo }) : null, o.detail.problem ? h("div", { class: "small", text: o.detail.problem }) : null))));
  const table = h("div", { class: "card scroll wide" }, h("table", { class: "table" },
    h("thead", {}, h("tr", {}, ["Date", "Order", "Customer", "Where", "Status", "Paid", "Costs", "Profit"].map((t, i) => h("th", { class: i > 4 ? "n" : null, text: t })))),
    h("tbody", {}, d.orders.map((o) => h("tr", {},
      h("td", { text: prettyDay(o.day) }),
      h("td", {}, what(o), o.promo ? h("div", { class: "small", text: "code " + o.promo }) : null, o.member ? h("div", { class: "small", text: "member price" }) : null, o.detail.problem ? h("div", { class: "small neg", text: o.detail.problem }) : null),
      h("td", { text: o.customer }), h("td", { text: o.channel }), h("td", {}, pill(o)),
      h("td", { class: "n", text: money(o.paid) }),
      h("td", { class: "n", title: `fee ${money(o.fee)} · print ${money(o.print)} · shipping ${money(o.shipping)}`, text: money(o.cost) }),
      h("td", { class: "n" + (o.profit < 0 ? " neg" : ""), text: money(o.profit) }))))));
  return [h("p", { class: "note", text: plural(d.orders.length, "order") + ", newest first. Costs are the payment fee plus what the lab charged." }), cards, table];
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
  const tiles = [["Payment fees", t.fees], ["Print cost", t.print], ["Shipping, net", t.shipping - t.shippingCharged], ["Chargebacks", t.chargebacks], ["Your own costs", t.other]];
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
  return [
    h("div", { class: "tiles" }, tiles.map(([n, c]) => h("div", { class: "card tile" }, h("div", { class: "label", text: n }), h("div", { class: "value", text: money(c) })))),
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

  const conn = (c) => {
    const msg = h("p", { class: "note", role: "status" });
    const fields = [];
    if (c.id === "rosewave") fields.push(h("label", {}, "RoseWave worker address", h("input", { name: "url", type: "url", value: c.config.url || "", placeholder: "https://…workers.dev" })));
    if (c.id === "square") fields.push(h("label", { class: "row" }, h("input", { type: "checkbox", name: "sandbox", checked: !!c.config.sandbox }), "Square's sandbox (test payments only)"));
    const save = fields.length ? h("button", { class: "quiet", type: "submit", text: "Save" }) : null;
    return h("form", { class: "card stack", onsubmit: async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try { await send("connections/" + c.id, { url: f.get("url"), sandbox: f.get("sandbox") === "on" }); msg.textContent = "Saved. It will pull everything on the next refresh."; } catch (err) { msg.textContent = err.message; }
    } },
      h("div", { class: "row" }, h("h2", { class: "grow", text: c.name }), h("span", { class: "pill" + (c.message.startsWith("Problem") ? " bad" : ""), text: c.lastOk ? "Connected" : c.message.startsWith("Problem") ? "Problem" : "Not connected" })),
      h("p", { class: "note", text: (c.message ? c.message.replace(/\.?$/, ".") : "Not run yet.") + (c.lastOk ? " Last pulled " + ago(c.lastOk) + "." : "") }),
      h("p", { class: "small" }, "Keys are kept in Cloudflare, never here. Worker secrets: ", c.secrets.map((s, i) => [i ? ", " : "", h("code", { text: s.name }), s.set ? " (set)" : " (not set)"])),
      ...fields, save ? h("div", {}, save) : null, msg);
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
      h("p", { class: "note" }, "Square's webhook address (Square Developer › Webhooks, events payment, refund, subscription, invoice and dispute): ", h("code", { text: d.hook })),
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
