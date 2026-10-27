// Every program, platform and language on the Experience / Toolkit panel.
// `icon` is a Simple Icons slug (paths live in tool-icons.ts, made by scripts/tool-icons.mjs).
// `image` is a full-colour logo in public/icons/tools/ for products Simple Icons doesn't carry (sources in its README).
// Tools with neither show `mark`, a short monogram, on a square of `color`.
// `color` also overrides a Simple Icons brand colour (Java's logo there is plain black).
export type Tool = { name: string; icon?: string; image?: string; mark?: string; color?: string };
export type ToolGroup = { name: string; tools: Tool[] };

export const toolkit: ToolGroup[] = [
  { name: "Languages", tools: [
    { name: "Python", icon: "python" }, { name: "JavaScript", icon: "javascript" }, { name: "TypeScript", icon: "typescript" },
    { name: "SQL", image: "sql.svg" }, { name: "Kotlin", icon: "kotlin" }, { name: "Java", icon: "openjdk", color: "#ED8B00" },
    { name: "HTML", icon: "html5" }, { name: "CSS", icon: "css" }, { name: "JSON", icon: "json" },
    { name: "Apps Script", icon: "googleappsscript" },
  ] },
  { name: "Commerce & operations", tools: [
    { name: "Shopify", icon: "shopify" }, { name: "ShipStation", mark: "SS", color: "#84C041" }, { name: "HubSpot", icon: "hubspot" },
    { name: "Asana", icon: "asana" }, { name: "Square", icon: "square" }, { name: "FedEx", icon: "fedex" },
    { name: "DHL", icon: "dhl" }, { name: "Discord", icon: "discord" },
  ] },
  { name: "Microsoft 365", tools: [
    { name: "Power Apps", image: "power-apps.svg" }, { name: "Power Automate", image: "power-automate.svg" }, { name: "Power Automate Desktop", image: "power-automate.svg" },
    { name: "SharePoint", image: "sharepoint.webp" }, { name: "Excel", image: "excel.webp" }, { name: "Outlook", image: "outlook.webp" },
    { name: "Teams", image: "teams.webp" }, { name: "OneDrive", image: "onedrive.webp" }, { name: "Forms", image: "forms.webp" },
    { name: "Microsoft Graph", image: "microsoft.svg" },
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
    { name: "Illustrator panels", image: "illustrator.svg" }, { name: "wkhtmltopdf", mark: "wk", color: "#5A6472" },
  ] },
  { name: "Build & run", tools: [
    { name: "Cloudflare Workers", icon: "cloudflareworkers" }, { name: "Cloudflare D1", icon: "cloudflare" },
    { name: "GitHub", icon: "github" }, { name: "Git", icon: "git" }, { name: "Node.js", icon: "nodedotjs" },
    { name: "Gradle", icon: "gradle" }, { name: "PyInstaller", image: "pyinstaller.svg" }, { name: "Inno Setup", image: "inno-setup.svg" },
    { name: "APScheduler", mark: "APS", color: "#3776AB" },
  ] },
];
