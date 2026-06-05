import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const distDir = ".next-deploy";
const appDir = join(root, "nextjs-elements");
const npmCli = join(process.execPath, "..", "node_modules", "npm", "bin", "npm-cli.js");

const build = spawnSync(process.execPath, [npmCli, "run", "build", "--prefix", "nextjs-elements"], {
  cwd: root,
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDir
  },
  stdio: "inherit"
});

rmSync(join(appDir, distDir), { force: true, recursive: true });

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const templateSource = join(appDir, "public", "templates");
const templateOutput = join(appDir, "out", "templates");

if (existsSync(templateSource)) {
  rmSync(templateOutput, { force: true, recursive: true });
  cpSync(templateSource, templateOutput, { recursive: true });
}
