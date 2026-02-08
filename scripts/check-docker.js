/**
 * Prerequisite check: Docker Desktop must be running in Windows containers mode.
 * Runs before `npm run test` and `npm run build` via the pretest/prebuild hooks.
 */

import { execSync } from "node:child_process";

try {
  const info = execSync("docker info 2>&1", { encoding: "utf-8" });

  if (!info.includes("OSType: windows")) {
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
