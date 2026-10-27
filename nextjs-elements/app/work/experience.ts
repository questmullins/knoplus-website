import { toolkit } from "@/data/toolkit";
import type { ServiceItem } from "./services";

// 2022–2025 business systems work, written up without the company's name, code or internal figures.
// The three strongest projects in each of three groups: Automation (runs behind the scenes), Interactive tools (what
// people look at and type into) and Full builds (complete applications, from code to installer). The full list of
// 42 projects is in git history (commit 50d179b) if any need to come back.
type Group = "automation" | "tools" | "builds";
const groupNames: Record<Group, string> = { automation: "Automation", tools: "Interactive tools", builds: "Full builds" };

const project = (group: Group, id: string, name: string, image: string, description: string, tools: string[], outcome?: string): ServiceItem => ({
  id: `experience--${id}`, name, label: `Experience / ${groupNames[group]} / ${name}`, description, image: `url('/revamp/banners/${image}.webp')`,
  highlights: tools, highlightsLabel: "Tools", ...(outcome ? { sellingPoints: [outcome], sellingPointsLabel: "Outcome" } : {}),
});
const auto = (...args: Parameters<typeof project> extends [Group, ...infer Rest] ? Rest : never) => project("automation", ...args);
const tool = (...args: Parameters<typeof project> extends [Group, ...infer Rest] ? Rest : never) => project("tools", ...args);
const build = (...args: Parameters<typeof project> extends [Group, ...infer Rest] ? Rest : never) => project("builds", ...args);

// `also` lists the smaller projects folded into each one.
const also = (item: ServiceItem, related: string[]): ServiceItem => ({ ...item, note: `Also includes: ${related.join(", ")}.` });

const automation: ServiceItem[] = [
  also(auto("paperwork", "Shipping & document paperwork", "cellese",
    "Every international shipment needed its own declaration, invoice and carrier wording, put together by hand. I built a pipeline that reads pending shipments, checks the data, generates each document, splits and stamps every page with tracking numbers and dates, files it, links it back to the shipment record and tells the team when it’s done. The same approach took over invoices, pick lists and approvals.",
    ["Google Apps Script", "Google Sheets", "PDF.co", "Google Drive", "Gmail", "Power Automate", "SharePoint"], "From over an hour per shipment to a few seconds"),
    ["commercial and military (APO) invoices", "affiliate invoices", "PDF assembly", "warehouse pick lists", "approval routing into Approved and Rejected libraries"]),
  also(auto("commerce-data", "Commerce data", "web-services",
    "Orders lived in Shopify, shipments in ShipStation and customers in HubSpot, and none of them lined up. I built the extractors and models that brought them together: seven stores in one 43-column order history, bundles broken into their parts, system IDs replaced with real names, and the product catalog kept in step for the ordering app. One run pulled in 2,321 draft orders in a single pass.",
    ["Shopify", "ShipStation", "HubSpot", "Asana", "Python", "SQL", "Snowflake", "Pipedream", "Grow"], "One order history everyone could read"),
    ["Snowflake data models", "CRM data", "distributor draft orders", "bundle reporting, rebuilt three times as it grew", "product catalog sync", "production board export", "sales reporting"]),
  also(auto("scheduler", "Automation control", "web-apps",
    "Once there were many scripts, someone had to remember to run them. I built a scheduler that runs each one on its own timetable, in priority order, shows the last and next run, and lets anyone start a job on demand. Exports write safely, so a failed run never leaves a broken file behind.",
    ["Python", "Tkinter", "APScheduler", "Power Automate Desktop"], "Separate automations working as one system"),
    ["order data refreshes", "directory uploads", "timecard reminders"]),
];

const interactive: ServiceItem[] = [
  also(tool("production", "Production tracking", "consulting",
    "Production time was tracked in a spreadsheet anyone could break. I replaced it with an app where people pick their task from a list, required fields can’t be skipped, and breaks, lunch and downtime come off automatically. Edits go through one controlled editor, and managers see progress from the same clean records the floor enters.",
    ["Python", "PySide6", "Qt WebEngine", "CSV"], "Clean records, collected the same way every time"),
    ["manager production view", "end-of-shift notes", "lab QC form", "fulfilment KPIs"]),
  also(tool("dashboards", "Project & team dashboards", "journey",
    "The project tracker became an interactive dashboard: timelines, active and completed counts, turnaround, delivery accuracy, notes per project and a light and dark theme, rebuilt from the workbook with a click. The same thinking went into live views of attendance and hiring.",
    ["Python", "pandas", "Plotly", "HTML", "JavaScript", "Google Sheets"], "Spreadsheets people actually look at"),
    ["six-day attendance tracker", "hiring dashboard"]),
  also(tool("ordering", "Ordering & lookup tools", "process",
    "An app where reps request stock from a controlled allocation: lists hold the stock, roles decide who can do what, and order emails go out on their own. Alongside it, quick lookups so people could find a provider, a distributor’s orders or a stock count without digging.",
    ["Power Apps", "SharePoint Lists", "Power Automate", "Outlook", "Excel"]),
    ["provider locator", "distributor assistant", "inventory and bulk count sheets", "product costing sheet"]),
];

const builds: ServiceItem[] = [
  also(build("returns", "Returns", "process",
    "Returns came in across seven storefronts, and checking them meant searching each one by hand. I built a desktop app for the team that pulls a rolling year of returns from every store, filters by SKU, records what actually arrived, exports the results and drafts the customer email. It shipped with a proper installer, so anyone could set it up.",
    ["Python", "Shopify GraphQL", "Excel", "Outlook", "PyInstaller", "Inno Setup"], "Seven stores, one returns workflow"),
    ["the returns and refunds tracker it replaced", "the companion email utility"]),
  also(build("documents", "Batch documents", "prepress",
    "Manufacturing paperwork was rebuilt by hand for every batch. I built a desktop tool that turns production data into finished, printable batch documents, with quantities, specs and dates filled in and empty steps cleaned out, packaged so it runs on anyone’s computer.",
    ["Python", "Excel", "HTML", "wkhtmltopdf", "PyInstaller", "Inno Setup"], "Variable paperwork, made repeatable"),
    ["the recipe-scaling flow it grew from (Forms, Power Automate, OneDrive, Teams)"]),
  build("distributor-reports", "Distributor reports", "cellese",
    "Pick a distributor and a date range, and this desktop app pulls their orders, links drafts to final orders and produces a branded Excel report with a summary and a tab for every order.",
    ["Python", "CustomTkinter", "pandas", "Shopify"], "Branded reports for any distributor, on demand"),
];

const group = (id: Group, image: string, description: string, children: ServiceItem[]): ServiceItem => ({
  id: `experience--${id}`, name: groupNames[id], label: `Experience / ${groupNames[id]}`, description,
  image: `url('/revamp/banners/${image}.webp')`, highlights: children.map(child => child.name), highlightsLabel: "Projects", children,
});

export const experienceItems: ServiceItem[] = [
  group("automation", "process",
    "Work that runs behind the scenes so people don’t have to: paperwork that makes itself, data that moves between systems on its own, and reports that are ready before anyone asks.",
    automation),
  group("tools", "consulting",
    "Tools people use every day to see what’s happening at a glance and enter what they know, with the checks built in so the information stays right.",
    interactive),
  group("builds", "web-apps",
    "Complete applications, from the first screen to the installer, made to be handed over and used by anyone.",
    builds),
  {
    id: "experience--toolkit", name: "Toolkit", label: "Experience / Toolkit", image: "url('/revamp/banners/web-services.webp')",
    description: "Every program, platform and language I’ve built real, everyday systems with. The tools are how the work gets done, not what you’re buying, but here’s what will feel familiar.",
    tools: toolkit,
  },
];
