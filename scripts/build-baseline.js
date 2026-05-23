import { spawnSync } from "node:child_process";

const run = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (run.status !== 0) {
  process.exit(run.status ?? 1);
}

