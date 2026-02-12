import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("index.css cursor rules", () => {
  // T040a: "Verify src/index.css does NOT contain cursor: grab or cursor: grabbing rules for [data-tauri-drag-region] selector"
  it("does not contain cursor: grab or cursor: grabbing rules for [data-tauri-drag-region]", () => {
    // Read the index.css file
    const cssPath = path.resolve(__dirname, "../../src/index.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    // Check for cursor: grab or cursor: grabbing in [data-tauri-drag-region] context
    const hasCursorGrab = /\[data-tauri-drag-region\][^\}]*cursor:\s*grab/i.test(cssContent);
    const hasCursorGrabbing = /\[data-tauri-drag-region\][^\}]*cursor:\s*grabbing/i.test(cssContent);

    // Also check for standalone cursor rules that might apply to drag region
    const hasStandaloneCursorGrab = /cursor:\s*grab/.test(cssContent);
    const hasStandaloneCursorGrabbing = /cursor:\s*grabbing/.test(cssContent);

    // Assert no cursor: grab or cursor: grabbing rules exist
    expect(hasCursorGrab).toBe(false);
    expect(hasCursorGrabbing).toBe(false);

    // For US4, we want to ensure these cursor states are completely removed
    // This is a stricter check - no grab/grabbing cursors anywhere in the CSS
    expect(hasStandaloneCursorGrab).toBe(false);
    expect(hasStandaloneCursorGrabbing).toBe(false);
  });
});
