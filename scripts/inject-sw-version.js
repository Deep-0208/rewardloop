/* eslint-disable */
const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");

const swPath = path.join(__dirname, "../public/sw.js");
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, "utf8");

  const buildHash = process.env.VERCEL_GIT_COMMIT_SHA
    ? process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7)
    : Date.now().toString(36);

  const versionTag = `rewardloop-v${pkg.version}-${buildHash}`;

  swContent = swContent.replace(
    /const CACHE_NAME = '.*';/,
    `const CACHE_NAME = '${versionTag}';`,
  );

  fs.writeFileSync(swPath, swContent);
  console.log("Injected Service Worker cache version:", versionTag);
} else {
  console.log(
    "Service worker sw.js not found in public/ directory, skipping injection.",
  );
}
