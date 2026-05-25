import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const requiredFiles = [
  "README.md",
  "CHANGELOG.md",
  "DEPLOYMENT_GUIDE.md",
  "GO_TO_MARKET.md",
  "BRAND_GUIDELINES.md",
  "SECURITY.md",
  "scripts/test-baseline.js",
  "scripts/build-baseline.js",
];

const missing = requiredFiles.filter((file) => !existsSync(path.join(root, file)));

if (missing.length > 0) {
  console.error("Missing required revvel-standard files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
if (!pkg?.scripts?.test || !pkg?.scripts?.build) {
  console.error("package.json must define both scripts.test and scripts.build");
  process.exit(1);
}

const goToMarketPath = path.join(root, "GO_TO_MARKET.md");
const goToMarket = readFileSync(goToMarketPath, "utf8");
const requiredSections = [
  "## Research engine",
  "## Suggestions",
  "## Assets inventory",
  "## Artifacts inventory",
];

const missingSections = requiredSections.filter((section) => !goToMarket.includes(section));
if (missingSections.length > 0) {
  console.error("GO_TO_MARKET.md is missing required revvel-standard sections:");
  for (const section of missingSections) {
    console.error(`- ${section}`);
  }
  process.exit(1);
}

console.log("Baseline validation passed.");
