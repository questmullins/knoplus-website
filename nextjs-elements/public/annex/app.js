// Annex's dashboard: one page, drawn from /annex/api. Text from the server is always set as text, never as HTML.
const API = "/annex/api/";
const app = document.getElementById("app");
const tip = document.getElementById("tip");
const state = { me: null, tab: "home", range: loadRange(), data: null };

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
async function get(path) {
  const r = await fetch(API + path, { credentials: "same-origin" });
  const body = await r.json().catch(() => ({}));
  if (r.status === 401) { state.me.user = null; render(); throw new Error("signed out"); }
  if (!r.ok) throw new Error(body.error || "Something went wrong");
  return body;
}
async function send(path, body, method = "POST") {
  const r = await fetch(API + path, { method, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  const said = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(said.error || "Something went wrong");
  return said;
}
function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* fine without it */ } }
function recall(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
function loadRange() { return recall("annex-range") || { preset: "30" }; }

// ---------- days, in the account's own time zone ----------
const tz = () => (state.me && state.me.account.tz) || Intl.DateTimeFormat().resolvedOptions().timeZone;
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

// ---------- the account's colors ----------
function applyBrand() {
  const colors = (state.me.account.brand || {}).colors || {};
  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  for (const k of ["ink", "accent", "surface", "page"]) {
    // in dark mode only the accent carries over; the rest would be unreadable
    if (colors[k] && (!dark || k === "accent")) document.documentElement.style.setProperty("--" + k, colors[k]);
    else document.documentElement.style.removeProperty("--" + k);
  }
  document.title = (state.me.account.name || "Annex") + " · Annex";
}

// ---------- start ----------
async function boot() {
  try {
    state.me = await (await fetch(API + "me", { credentials: "same-origin" })).json();
  } catch {
    app.replaceChildren(h("p", { class: "empty", text: "Annex couldn't be reached. Check your connection and reload." }));
    return;
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/annex/sw.js", { scope: "/annex/" }).catch(() => {});
  addEventListener("hashchange", () => { state.tab = location.hash.slice(1) || "home"; render(); });
  let wait;
  addEventListener("resize", () => { clearTimeout(wait); wait = setTimeout(() => state.data && draw(), 150); });
  state.tab = location.hash.slice(1) || "home";
  render();
}

function render() {
  if (!state.me.user) return gate("Annex", "Sign in with your kno.plus administrator account to see your work, your website and your sales.",
    h("a", { class: "primary", href: state.me.signIn || "/clients/?next=/annex/", text: "Sign in" }));
  if (state.me.user.role !== "owner") return gate("Annex", "Annex is for the kno.plus administrator. Your projects are on your client page.",
    h("a", { class: "primary", href: "/clients/", text: "Go to your projects" }));
  applyBrand();
  shell();
  load();
}

function gate(title, words, action) {
  app.replaceChildren(h("section", { class: "gate" }, h("h1", { text: title }), h("p", { text: words }), action));
}

// ---------- the frame: name, date range, tabs ----------
const TABS = [["home", "Sales"], ["site", "Website"], ["orders", "Orders"], ["best", "Best sellers"], ["members", "Members"], ["costs", "Costs and margin"], ["trends", "Trends"], ["settings", "Settings"]];
function shell() {
  const owner = state.me.user.role === "owner";
  const tabs = TABS.filter(([id]) => id !== "settings" || owner);
  if (!tabs.some(([id]) => id === state.tab)) state.tab = "home";
  const preset = h("select", { "aria-label": "Date range", onchange: (e) => { state.range = { ...state.range, preset: e.target.value }; if (e.target.value === "custom") { const d = rangeDays(); state.range.from = state.range.from || d.from; state.range.to = state.range.to || d.to; } store("annex-range", state.range); render(); } },
    PRESETS.map(([v, t]) => h("option", { value: v, selected: state.range.preset === v, text: t })));
  const custom = state.range.preset === "custom" ? [
    h("input", { type: "date", "aria-label": "From", value: rangeDays().from, onchange: (e) => { state.range.from = e.target.value; store("annex-range", state.range); load(); } }),
    h("input", { type: "date", "aria-label": "To", value: rangeDays().to, onchange: (e) => { state.range.to = e.target.value; store("annex-range", state.range); load(); } }),
  ] : [];
  app.replaceChildren(
    h("header", { class: "top" },
      h("div", { class: "bar" }, h("span", { class: "mark", "aria-hidden": "true" }), h("h1", { text: state.tab === "site" ? "kno.plus" : state.me.account.name })),
      state.tab === "settings" ? null : state.tab === "site" ? h("div", { class: "range" }, siteRange()) : h("div", { class: "range" }, preset, custom),
      h("nav", { class: "tabs", "aria-label": "Sections" }, tabs.map(([id, t]) => h("a", { href: "#" + id, "aria-current": state.tab === id ? "page" : null, text: t })),
        h("a", { href: "/clients/", text: "Clients ↗" }), h("a", { href: "/", text: "kno.plus ↗" }))),
    h("section", { class: "view", id: "view" }, h("p", { class: "loading", text: "Loading…" })));
}

async function load() {
  const view = document.getElementById("view");
  const tab = state.tab;
  try {
    const q = rangeQuery();
    const path = { home: "home?" + q, orders: "orders?" + q, best: "best?" + q, members: "members?" + q, costs: "costs?" + q, trends: "trends?" + q + "&by=" + (state.by || "day"), settings: "connections", site: "site?days=" + (state.siteDays || "28") }[tab];
    const data = await get(path);
    if (tab !== state.tab) return;
    state.data = data;
    state.dataTab = tab;
    draw();
  } catch (err) {
    if (err.message !== "signed out") view.replaceChildren(h("p", { class: "empty", text: err.message }));
  }
}

function draw() {
  const view = document.getElementById("view");
  tip.hidden = true;
  if (!view || state.dataTab !== state.tab) return;
  const views = { site: siteView, home: homeView, orders: ordersView, best: bestView, members: membersView, costs: costsView, trends: trendsView, settings: settingsView };
  view.replaceChildren(...[].concat(views[state.tab](state.data)));
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

// ---------- Website ----------
// kno.plus's own numbers: page requests and contact messages, counted by the Worker without keeping who anyone is.
function siteRange() {
  return h("select", { "aria-label": "Period", onchange: (e) => { state.siteDays = e.target.value; load(); } },
    ["7", "28", "90"].map((v) => h("option", { value: v, selected: (state.siteDays || "28") === v, text: "Last " + v + " days" })));
}
function siteView(d) {
  const count = (n) => Number(n || 0).toLocaleString("en-US");
  const shown = d.series.filter((p) => p.count !== null);
  const tiles = [["Page requests", count(d.pageRequests)], ["Contact messages", count(d.contacts)], ["Busiest day", count(Math.max(0, ...shown.map((p) => p.count)))], ["Counting since", prettyDay(d.started.slice(0, 10))]];
  const list = (title, rows, total) => h("div", { class: "card scroll" }, h("h2", { text: title }), rows.length ? h("table", { class: "table" },
    h("tbody", {}, rows.map((r) => h("tr", {}, h("td", { text: r.name }), h("td", { class: "n", text: count(r.count) }), h("td", { class: "n small", text: total ? Math.round((100 * r.count) / total) + "%" : "" })))))
    : h("p", { class: "note", text: "Nothing counted in these days yet." }));
  return [
    h("div", { class: "tiles" }, tiles.map(([t, v]) => h("div", { class: "card tile" }, h("div", { class: "label", text: t }), h("div", { class: "value", text: v })))),
    h("div", { class: "card" }, h("h2", { text: "Page requests by day" }),
      lineChart({ label: "Page requests by day", axis: true, format: count, series: [{ name: "Requests", color: "var(--accent)", values: shown.map((p) => ({ key: p.day, value: p.count })) }] })),
    h("div", { class: "split" }, list("Top pages", d.pages, d.pageRequests), list("Where visitors came from", d.sources, d.pageRequests)),
    h("p", { class: "note", text: "Counts of public pages served, not people. Bots, private pages, query strings and addresses are never counted or kept." }),
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
  const acct = state.me.account;
  const colors = (acct.brand || {}).colors || {};
  const css = getComputedStyle(document.documentElement);
  const zones = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : [acct.tz];
  const said = h("p", { class: "note", role: "status" });
  const account = h("form", { class: "card stack", onsubmit: async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await send("settings", { name: f.get("name"), tz: f.get("tz"), colors: Object.fromEntries(["ink", "accent", "surface", "page"].map((k) => [k, f.get(k)])) });
      location.reload();
    } catch (err) { said.textContent = err.message; }
  } },
    h("h2", { text: "Account" }),
    h("div", { class: "split" },
      h("label", {}, "Business name", h("input", { name: "name", value: acct.name })),
      h("label", {}, "Time zone", h("select", { name: "tz" }, zones.map((z) => h("option", { value: z, selected: z === acct.tz, text: z.replace(/_/g, " ") }))))),
    h("div", { class: "row" }, [["ink", "Text"], ["accent", "Accent"], ["surface", "Cards"], ["page", "Background"]].map(([k, t]) =>
      h("label", {}, t, h("input", { type: "color", name: k, value: colors[k] || css.getPropertyValue("--" + k).trim() || "#000000" })))),
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
    h("div", { class: "row" }, h("span", { class: "note grow", text: "Signed in as " + state.me.user.email }),
      h("button", { class: "quiet", text: "Sign out", onclick: async () => {
        await fetch("/api/clients/logout", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" });
        location.reload();
      } })),
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
