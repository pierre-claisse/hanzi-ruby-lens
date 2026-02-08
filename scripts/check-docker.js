/**
 * Prerequisite check for npm run test / npm run build:
 * 1. Docker Desktop must be running
 * 2. Must be in Windows containers mode
 * 3. Toolchain image must exist (auto-builds with --isolation=process on first run)
 */

import { execSync } from "node:child_process";

const IMAGE_NAME = "hanzi-ruby-lens-toolchain";

// --- Check 1: Docker Desktop running ---
let dockerInfo;
try {
  dockerInfo = execSync("docker info 2>&1", { encoding: "utf-8" });
} catch {
  console.error(
    "\n" +
      "ERROR: Docker Desktop is not running.\n" +
      "\n" +
      "  Please start Docker Desktop and wait for it to finish\n" +
      "  initializing, then run this command again.\n",
  );
  process.exit(1);
}

// --- Check 2: Windows containers mode ---
if (!dockerInfo.includes("OSType: windows")) {
  console.error(
    "\n" +
      "ERROR: Docker Desktop is not in Windows containers mode.\n" +
      "\n" +
      "  Right-click the Docker Desktop tray icon and select\n" +
      '  "Switch to Windows containers..."\n' +
      "\n" +
      "  Then run this command again.\n",
  );
  process.exit(1);
}

// --- Check 3: Toolchain image exists (auto-build if missing) ---
try {
  execSync(`docker image inspect ${IMAGE_NAME}`, { stdio: "pipe" });
} catch {
  console.log(
    "\n" +
      `Toolchain image "${IMAGE_NAME}" not found. Building now...\n` +
      "This is a one-time operation (~15-30 min, ~10-20 GB image).\n",
  );
  try {
    execSync(
      `docker build --isolation=process -t ${IMAGE_NAME} -f docker/Dockerfile docker/`,
      { stdio: "inherit" },
    );
    console.log(`\nImage "${IMAGE_NAME}" built successfully.\n`);
  } catch {
    console.error(
      "\n" +
        "ERROR: Failed to build the toolchain image.\n" +
        "\n" +
        "  Check the output above for details. Common issues:\n" +
        "  - Insufficient disk space (~20 GB needed)\n" +
        "  - Network connectivity (downloads VS Build Tools, Rust, Node.js)\n" +
        "\n" +
        "  You can also try building manually:\n" +
        `  docker build --isolation=process -t ${IMAGE_NAME} -f docker/Dockerfile docker/\n`,
    );
    process.exit(1);
  }
}
