import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const distDir = ".next-deploy";
const appDir = join(root, "nextjs-elements");

const commandCandidates = process.platform === "win32" ? ["npm.cmd", "npm"] : ["npm"];
let build;

for (const command of commandCandidates) {
  build = spawnSync(command, ["run", "build", "--prefix", "nextjs-elements"], {
    cwd: root,
    env: {
      ...process.env,
      NEXT_DIST_DIR: distDir
    },
    shell: process.platform === "win32",
    stdio: "inherit"
  });

  if (!build.error) {
    break;
  }

  console.warn(`Could not start ${command}: ${build.error.message}`);
}

rmSync(join(appDir, distDir), { force: true, recursive: true });

if (!build || build.error || build.status !== 0) {
  process.exit(build?.status ?? 1);
}

const templateSource = join(appDir, "public", "templates");
const templateOutput = join(appDir, "out", "templates");

if (existsSync(templateSource)) {
  rmSync(templateOutput, { force: true, recursive: true });
  cpSync(templateSource, templateOutput, { recursive: true });
}
