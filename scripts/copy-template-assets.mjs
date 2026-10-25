import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import "./generate-photo-portfolio-manifest.mjs";

const appDir = join(process.cwd(), "nextjs-elements");
const templateSource = join(appDir, "public", "templates");
const templateOutput = join(appDir, "out", "templates");

if (existsSync(templateSource)) {
  rmSync(templateOutput, { force: true, recursive: true });
  cpSync(templateSource, templateOutput, { recursive: true });
}

// Trial files are served only after the Worker checks project access.
const trialSource = join(process.cwd(), "trial-websites");
const trialOutput = join(appDir, "out", "trials");
if (existsSync(trialSource)) cpSync(trialSource, trialOutput, { recursive: true });
