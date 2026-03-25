#!/usr/bin/env node
/**
 * Downloads lua-language-server binaries for the current build targets.
 *
 * Usage:
 *   node build-scripts/download-luals.js                          # Auto-detect targets
 *   node build-scripts/download-luals.js darwin-arm64              # Specific target
 *   node build-scripts/download-luals.js darwin-arm64 darwin-x64   # Multiple targets
 *
 * Targets auto-detected per platform:
 *   macOS  → darwin-arm64, darwin-x64  (universal build)
 *   Windows → win32-x64
 *   Linux  → linux-x64
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const LUALS_VERSION = "3.17.1";
const RELEASE_BASE = `https://github.com/LuaLS/lua-language-server/releases/download/${LUALS_VERSION}`;
const BUILD_ASSETS_DIR = path.resolve(__dirname, "..", "build-assets");

const VALID_TARGETS = [
  "darwin-arm64",
  "darwin-x64",
  "win32-x64",
  "win32-ia32",
  "linux-x64",
  "linux-arm64",
];

function getDefaultTargets() {
  switch (process.platform) {
    case "darwin":
      // macOS electron-builder targets both arm64 and x64
      return ["darwin-arm64", "darwin-x64"];
    case "win32":
      return ["win32-x64"];
    case "linux":
      return ["linux-x64"];
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

function getTargets() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const targets = args.length > 0 ? args : getDefaultTargets();

  for (const t of targets) {
    if (!VALID_TARGETS.includes(t)) {
      throw new Error(
        `Invalid target: ${t}\nValid targets: ${VALID_TARGETS.join(", ")}`,
      );
    }
  }

  return targets;
}

function assetFilename(target) {
  const ext = target.startsWith("win32") ? "zip" : "tar.gz";
  return `lua-language-server-${LUALS_VERSION}-${target}.${ext}`;
}

async function downloadFile(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status} ${res.statusText}`);
  }
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function extractArchive(archivePath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  // bsdtar (macOS/Windows) and GNU tar (Linux) both auto-detect format
  execSync(`tar xf "${archivePath}" -C "${destDir}"`, { stdio: "inherit" });
}

async function processTarget(target) {
  const dirName = `lua-language-server-${LUALS_VERSION}-${target}`;
  const destDir = path.join(BUILD_ASSETS_DIR, dirName);

  if (fs.existsSync(destDir)) {
    console.log(`[${target}] Already exists, skipping.`);
    return;
  }

  const filename = assetFilename(target);
  const archivePath = path.join(BUILD_ASSETS_DIR, filename);
  const url = `${RELEASE_BASE}/${filename}`;

  console.log(`[${target}] Downloading ${url}`);
  await downloadFile(url, archivePath);

  console.log(`[${target}] Extracting to ${dirName}/`);
  extractArchive(archivePath, destDir);
  fs.unlinkSync(archivePath);

  // Ensure binary is executable on Unix
  if (!target.startsWith("win32")) {
    const bin = path.join(destDir, "bin", "lua-language-server");
    if (fs.existsSync(bin)) {
      fs.chmodSync(bin, 0o755);
    }
  }

  console.log(`[${target}] Ready.`);
}

async function main() {
  fs.mkdirSync(BUILD_ASSETS_DIR, { recursive: true });
  const targets = getTargets();
  console.log(
    `lua-language-server v${LUALS_VERSION} — targets: ${targets.join(", ")}\n`,
  );

  for (const target of targets) {
    await processTarget(target);
  }

  console.log("\nAll targets downloaded.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
