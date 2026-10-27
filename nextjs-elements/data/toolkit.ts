// Every program, platform and language on the Experience / Toolkit panel.
// `icon` is a Simple Icons slug (paths live in tool-icons.ts, made by scripts/tool-icons.mjs).
// Tools without a Simple Icons logo show `mark`, a short monogram, on a square of `color`.
// `color` also overrides a Simple Icons brand colour (Java's logo there is plain black).
export type Tool = { name: string; icon?: string; mark?: string; color?: string };
export type ToolGroup = { name: string; tools: Tool[] };

export const toolkit: ToolGroup[] = [
  { name: "Languages", tools: [
    { name: "Python", icon: "python" }, { name: "JavaScript", icon: "javascript" }, { name: "TypeScript", icon: "typescript" },
    { name: "SQL", mark: "SQL", color: "#336791" }, { name: "Kotlin", icon: "kotlin" }, { name: "Java", icon: "openjdk", color: "#ED8B00" },
    { name: "HTML", icon: "html5" }, { name: "CSS", icon: "css" }, { name: "JSON", icon: "json" },
    { name: "Apps Script", icon: "googleappsscript" },
  ] },
  { name: "Commerce & operations", tools: [
    { name: "Shopify", icon: "shopify" }, { name: "ShipStation", mark: "SS", color: "#84C041" }, { name: "HubSpot", icon: "hubspot" },
    { name: "Asana", icon: "asana" }, { name: "Square", icon: "square" }, { name: "FedEx", icon: "fedex" },
    { name: "DHL", icon: "dhl" }, { name: "Discord", icon: "discord" },
  ] },
  { name: "Microsoft 365", tools: [
    { name: "Power Apps", mark: "PA", color: "#742774" }, { name: "Power Automate", mark: "PF", color: "#0066FF" }, { name: "Power Automate Desktop", mark: "PD", color: "#0066FF" },
    { name: "SharePoint", mark: "SP", color: "#038387" }, { name: "Excel", mark: "X", color: "#217346" }, { name: "Outlook", mark: "O", color: "#0078D4" },
    { name: "Teams", mark: "T", color: "#6264A7" }, { name: "OneDrive", mark: "OD", color: "#0364B8" }, { name: "Forms", mark: "F", color: "#008272" },
    { name: "Microsoft Graph", mark: "G", color: "#0078D4" },
  ] },
  { name: "Google", tools: [
    { name: "Sheets", icon: "googlesheets" }, { name: "Drive", icon: "googledrive" }, { name: "Gmail", icon: "gmail" },
    { name: "Google Cloud", icon: "googlecloud" }, { name: "Search Console", icon: "googlesearchconsole" },
  ] },
  { name: "Data & integration", tools: [
    { name: "Snowflake", icon: "snowflake" }, { name: "pandas", icon: "pandas" }, { name: "openpyxl", mark: "px", color: "#217346" },
    { name: "Plotly", icon: "plotly" }, { name: "Grow", mark: "Gr", color: "#6A4CFF" }, { name: "Pipedream", mark: "Pd", color: "#1F9D55" },
    { name: "GraphQL", icon: "graphql" }, { name: "REST APIs", mark: "API", color: "#5A6472" }, { name: "PDF.co", mark: "PDF", color: "#E5252A" },
  ] },
  { name: "Apps & interfaces", tools: [
    { name: "React", icon: "react" }, { name: "Next.js", icon: "nextdotjs" }, { name: "Android", icon: "android" },
    { name: "Jetpack Compose", icon: "jetpackcompose" }, { name: "PySide6 / Qt", icon: "qt" }, { name: "CustomTkinter", mark: "Tk", color: "#3776AB" },
    { name: "Illustrator panels", mark: "Ai", color: "#FF9A00" }, { name: "wkhtmltopdf", mark: "wk", color: "#5A6472" },
  ] },
  { name: "Build & run", tools: [
    { name: "Cloudflare Workers", icon: "cloudflareworkers" }, { name: "Cloudflare D1", icon: "cloudflare" },
    { name: "GitHub", icon: "github" }, { name: "Git", icon: "git" }, { name: "Node.js", icon: "nodedotjs" },
    { name: "Gradle", icon: "gradle" }, { name: "PyInstaller", mark: "PyI", color: "#3776AB" }, { name: "Inno Setup", mark: "IS", color: "#2B5797" },
    { name: "APScheduler", mark: "APS", color: "#3776AB" },
  ] },
];
