#!/usr/bin/env node
/**
 * Downloads the appropriate lua-language-server binary for the current
 * (or target) platform and extracts it into resources/lua-language-server/.
 *
 * Usage:
 *   node build-scripts/download-lua-ls.js
 *   node build-scripts/download-lua-ls.js --version 3.13.6
 *   node build-scripts/download-lua-ls.js --platform win32 --arch x64
 *
 * The script is intentionally self-contained (no extra npm deps beyond
 * Node built-ins + node-fetch which is already a project dependency).
 */

"use strict";

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// ── Configuration ────────────────────────────────────────────────────────────

const LUA_LS_VERSION =
  parseArg("--version") || process.env.LUA_LS_VERSION || "3.13.6";

const platform = parseArg("--platform") || process.platform; // win32 | darwin | linux
const arch = parseArg("--arch") || process.arch; // x64 | arm64

const OUTPUT_DIR = path.resolve(
  __dirname,
  "..",
  "resources",
  "lua-language-server",
);

// ── Platform → asset name mapping ───────────────────────────────────────────

/** Maps Node.js platform/arch to the GitHub release asset suffix. */
function getAssetName(platform, arch, version) {
  const platformMap = {
    win32: { x64: `win32-x64` },
    darwin: { x64: `darwin-x64`, arm64: `darwin-arm64` },
    linux: { x64: `linux-x64` },
  };

  const key = (platformMap[platform] || {})[arch];
  if (!key) {
    throw new Error(
      `Unsupported platform/arch combination: ${platform}/${arch}`,
    );
  }

  const ext = platform === "win32" ? "zip" : "tar.gz";
  return `lua-language-server-${version}-${key}.${ext}`;
}

/** Returns the download URL for the given version and asset name. */
function getDownloadUrl(version, assetName) {
  return `https://github.com/LuaLS/lua-language-server/releases/download/${version}/${assetName}`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseArg(name) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx + 1] : null;
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** Follow HTTP redirects and return the final response. */
function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetch(res.headers.location).then(resolve).catch(reject);
      } else if (res.statusCode !== 200) {
        reject(
          new Error(
            `HTTP ${res.statusCode} while downloading ${url}`,
          ),
        );
      } else {
        resolve(res);
      }
    }).on("error", reject);
  });
}

/** Download url → destPath, showing a simple progress counter. */
async function download(url, destPath) {
  console.log(`  Downloading: ${url}`);
  const res = await fetch(url);
  const total = parseInt(res.headers["content-length"] || "0", 10);
  let received = 0;

  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(destPath);
    res.on("data", (chunk) => {
      received += chunk.length;
      if (total > 0) {
        const pct = Math.round((received / total) * 100);
        process.stdout.write(`\r  Progress: ${pct}%`);
      }
    });
    res.pipe(out);
    out.on("finish", () => {
      process.stdout.write("\n");
      resolve();
    });
    out.on("error", reject);
    res.on("error", reject);
  });
}

/** Extract a .tar.gz archive using the system tar command. */
function extractTarGz(archivePath, destDir) {
  mkdirp(destDir);
  execSync(`tar -xzf "${archivePath}" -C "${destDir}"`);
}

/** Extract a .zip archive using the system unzip / PowerShell. */
function extractZip(archivePath, destDir) {
  mkdirp(destDir);
  if (process.platform === "win32") {
    execSync(
      `powershell -Command "Expand-Archive -Force '${archivePath}' '${destDir}'"`,
    );
  } else {
    execSync(`unzip -o "${archivePath}" -d "${destDir}"`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `\nlua-language-server downloader  (v${LUA_LS_VERSION}  ${platform}/${arch})\n`,
  );

  const assetName = getAssetName(platform, arch, LUA_LS_VERSION);
  const url = getDownloadUrl(LUA_LS_VERSION, assetName);

  // Check if already present
  const binaryName =
    platform === "win32"
      ? "lua-language-server.exe"
      : "lua-language-server";
  const binaryPath = path.join(OUTPUT_DIR, "bin", binaryName);

  if (fs.existsSync(binaryPath)) {
    console.log(`  Already installed: ${binaryPath}`);
    console.log("  Delete resources/lua-language-server/ to force re-download.");
    return;
  }

  // Download
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lua-ls-"));
  const archivePath = path.join(tmpDir, assetName);

  try {
    await download(url, archivePath);

    // Extract into OUTPUT_DIR
    console.log(`  Extracting to: ${OUTPUT_DIR}`);
    if (archivePath.endsWith(".tar.gz")) {
      extractTarGz(archivePath, OUTPUT_DIR);
    } else {
      extractZip(archivePath, OUTPUT_DIR);
    }

    if (!fs.existsSync(binaryPath)) {
      throw new Error(
        `Extraction succeeded but binary not found at: ${binaryPath}`,
      );
    }

    // Make executable on POSIX
    if (platform !== "win32") {
      fs.chmodSync(binaryPath, 0o755);
    }

    console.log(`  ✓ lua-language-server ready: ${binaryPath}`);
  } finally {
    // Clean up temp dir
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("\n✗ Failed to download lua-language-server:", err.message);
  process.exit(1);
});
