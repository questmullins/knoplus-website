// Every program, platform and language on the Experience / Toolkit panel.
// `icon` is a Simple Icons slug (paths live in tool-icons.ts, made by scripts/tool-icons.mjs).
// Tools without a Simple Icons logo show `mark`, a short monogram, instead.
export type Tool = { name: string; icon?: string; mark?: string };
export type ToolGroup = { name: string; tools: Tool[] };

export const toolkit: ToolGroup[] = [
  { name: "Languages", tools: [
    { name: "Python", icon: "python" }, { name: "JavaScript", icon: "javascript" }, { name: "TypeScript", icon: "typescript" },
    { name: "SQL", mark: "SQL" }, { name: "Kotlin", icon: "kotlin" }, { name: "Java", icon: "openjdk" },
    { name: "HTML", icon: "html5" }, { name: "CSS", icon: "css" }, { name: "JSON", icon: "json" },
    { name: "Apps Script", icon: "googleappsscript" },
  ] },
  { name: "Commerce & operations", tools: [
    { name: "Shopify", icon: "shopify" }, { name: "ShipStation", mark: "SS" }, { name: "HubSpot", icon: "hubspot" },
    { name: "Asana", icon: "asana" }, { name: "Square", icon: "square" }, { name: "FedEx", icon: "fedex" },
    { name: "DHL", icon: "dhl" }, { name: "Discord", icon: "discord" },
  ] },
  { name: "Microsoft 365", tools: [
    { name: "Power Apps", mark: "PA" }, { name: "Power Automate", mark: "PF" }, { name: "Power Automate Desktop", mark: "PD" },
    { name: "SharePoint", mark: "SP" }, { name: "Excel", mark: "X" }, { name: "Outlook", mark: "O" },
    { name: "Teams", mark: "T" }, { name: "OneDrive", mark: "OD" }, { name: "Forms", mark: "F" },
    { name: "Microsoft Graph", mark: "G" },
  ] },
  { name: "Google", tools: [
    { name: "Sheets", icon: "googlesheets" }, { name: "Drive", icon: "googledrive" }, { name: "Gmail", icon: "gmail" },
    { name: "Google Cloud", icon: "googlecloud" }, { name: "Search Console", icon: "googlesearchconsole" },
  ] },
  { name: "Data & integration", tools: [
    { name: "Snowflake", icon: "snowflake" }, { name: "pandas", icon: "pandas" }, { name: "openpyxl", mark: "px" },
    { name: "Plotly", icon: "plotly" }, { name: "Grow", mark: "Gr" }, { name: "Pipedream", mark: "Pd" },
    { name: "GraphQL", icon: "graphql" }, { name: "REST APIs", mark: "API" }, { name: "PDF.co", mark: "PDF" },
  ] },
  { name: "Apps & interfaces", tools: [
    { name: "React", icon: "react" }, { name: "Next.js", icon: "nextdotjs" }, { name: "Android", icon: "android" },
    { name: "Jetpack Compose", icon: "jetpackcompose" }, { name: "PySide6 / Qt", icon: "qt" }, { name: "CustomTkinter", mark: "Tk" },
    { name: "Illustrator panels", mark: "Ai" }, { name: "wkhtmltopdf", mark: "wk" },
  ] },
  { name: "Build & run", tools: [
    { name: "Cloudflare Workers", icon: "cloudflareworkers" }, { name: "Cloudflare D1", icon: "cloudflare" },
    { name: "GitHub", icon: "github" }, { name: "Git", icon: "git" }, { name: "Node.js", icon: "nodedotjs" },
    { name: "Gradle", icon: "gradle" }, { name: "PyInstaller", mark: "PyI" }, { name: "Inno Setup", mark: "IS" },
    { name: "APScheduler", mark: "APS" },
  ] },
];
