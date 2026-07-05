#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const VALID_BUMPS = ["major", "minor", "patch"];
const PACKAGE_FILES = [
  {
    label: "package.json",
    path: path.resolve(__dirname, "..", "package.json"),
  },
  {
    label: "cli/package.json",
    path: path.resolve(__dirname, "..", "cli", "package.json"),
  },
  {
    label: "tests/package.json",
    path: path.resolve(__dirname, "..", "tests", "package.json"),
  },
];

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function printUsage() {
  console.log(`Usage: node scripts/version.js [--major|--minor|--patch]

Bump all package.json versions in sync.

Options:
  --major   Bump major version, e.g. 1.2.1 -> 2.0.0
  --minor   Bump minor version, e.g. 1.2.1 -> 1.3.0
  --patch   Bump patch version, e.g. 1.2.1 -> 1.2.2
  --help    Show this help message

Run without flags for an interactive selector.`);
}

function parseArgs(argv) {
  const flags = argv.slice(2);
  if (flags.includes("--help") || flags.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const unknown = flags.filter(
    (flag) => !["--major", "--minor", "--patch"].includes(flag),
  );
  if (unknown.length > 0) {
    fail(
      `Unknown flag: ${unknown[0]}. Valid flags: --major, --minor, --patch, --help`,
    );
  }

  const bumpFlags = flags
    .filter((flag) => ["--major", "--minor", "--patch"].includes(flag))
    .map((flag) => flag.slice(2));

  if (bumpFlags.length > 1) {
    fail("Use only one of: --major, --minor, --patch");
  }

  return bumpFlags[0] || null;
}

function readPackage(file) {
  let raw;
  try {
    raw = fs.readFileSync(file.path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") fail(`Missing: ${file.label}`);
    if (error.code === "EACCES" || error.code === "EPERM") {
      fail(`Permission denied: ${file.label}`);
    }
    fail(`Cannot read ${file.label}: ${error.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    fail(`Invalid JSON in: ${file.label}`);
  }

  if (typeof data.version !== "string") {
    fail(`Missing or invalid 'version' field in: ${file.label}`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(data.version)) {
    fail(
      `Version '${data.version}' in ${file.label} does not match semver x.y.z`,
    );
  }

  return { ...file, data, version: data.version };
}

function readPackages() {
  const packages = PACKAGE_FILES.map(readPackage);
  const versions = new Set(packages.map((pkg) => pkg.version));
  if (versions.size > 1) {
    const detail = packages
      .map((pkg) => `  ${pkg.label}: ${pkg.version}`)
      .join("\n");
    fail(`Version mismatch across package.json files:\n${detail}`);
  }
  return packages;
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  if (type === "patch") return `${major}.${minor}.${patch + 1}`;
  fail(`Invalid bump type: ${type}`);
}

function formatChoice(type, currentVersion) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return `${label}  ${currentVersion} -> ${bumpVersion(currentVersion, type)}`;
}

function renderMenu(selectedIndex, currentVersion) {
  process.stdout.write("\x1b[2J\x1b[H");
  process.stdout.write("Select the type of version bump:\n");
  process.stdout.write("Use the ↑↓ arrows to select   Enter ↵ to confirm\n");
  VALID_BUMPS.forEach((type, index) => {
    const marker = index === selectedIndex ? ">" : " ";
    process.stdout.write(`${marker} ${formatChoice(type, currentVersion)}\n`);
  });
}

function selectBumpInteractively(currentVersion) {
  if (!process.stdin.isTTY) {
    fail("Interactive mode requires a TTY. Use --major, --minor, or --patch.");
  }

  return new Promise((resolve) => {
    let selectedIndex = 0;
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    renderMenu(selectedIndex, currentVersion);

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("keypress", onKeypress);
    };

    function onKeypress(_str, key) {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.stdout.write("\n");
        process.exit(1);
      }
      if (key.name === "up") {
        selectedIndex =
          (selectedIndex - 1 + VALID_BUMPS.length) % VALID_BUMPS.length;
        renderMenu(selectedIndex, currentVersion);
      } else if (key.name === "down") {
        selectedIndex = (selectedIndex + 1) % VALID_BUMPS.length;
        renderMenu(selectedIndex, currentVersion);
      } else if (key.name === "return") {
        const selected = VALID_BUMPS[selectedIndex];
        cleanup();
        process.stdout.write("\n");
        resolve(selected);
      }
    }

    process.stdin.on("keypress", onKeypress);
  });
}

function writePackages(packages, nextVersion) {
  for (const pkg of packages) {
    pkg.data.version = nextVersion;
  }

  for (const pkg of [...packages].reverse()) {
    try {
      fs.writeFileSync(pkg.path, `${JSON.stringify(pkg.data, null, 2)}\n`);
    } catch (error) {
      if (error.code === "EACCES" || error.code === "EPERM") {
        fail(`Cannot write: ${pkg.label}`);
      }
      if (error.code === "ENOSPC")
        fail(`No space left while writing: ${pkg.label}`);
      fail(`Cannot write ${pkg.label}: ${error.message}`);
    }
  }
}

function verifyWritten(packages, nextVersion) {
  for (const pkg of packages) {
    const reread = readPackage(pkg);
    if (reread.version !== nextVersion) {
      fail(
        `Verification failed for ${pkg.label}: expected ${nextVersion}, got ${reread.version}`,
      );
    }
  }
}

function printSummary(packages, nextVersion) {
  console.log(`All package.json files updated to v${nextVersion}`);
  for (const pkg of packages) {
    console.log(`  ${pkg.label.padEnd(18)} ${pkg.version} -> ${nextVersion}`);
  }
}

async function main() {
  const packages = readPackages();
  const currentVersion = packages[0].version;
  const requestedBump = parseArgs(process.argv);
  const bumpType =
    requestedBump || (await selectBumpInteractively(currentVersion));
  const nextVersion = bumpVersion(currentVersion, bumpType);

  writePackages(packages, nextVersion);
  verifyWritten(packages, nextVersion);
  printSummary(packages, nextVersion);
}

main().catch((error) => fail(error.message || String(error)));
