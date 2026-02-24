import { describe, it, expect } from "vitest";
import { computeMenuPosition, MENU_WIDTH_PX, MENU_ITEM_HEIGHT_PX } from "../../src/components/TextDisplay";

// Helper: build a mock word rect at a given viewport position
function makeWordRect(x: number, y: number, w = 40, h = 30) {
  return { top: y, bottom: y + h, left: x, right: x + w, width: w, height: h };
}

const CONTAINER = { top: 0, left: 0 };
const VP_W = 800;
const VP_H = 600;
const ENTRY_COUNT = 4;
const MENU_HEIGHT = ENTRY_COUNT * MENU_ITEM_HEIGHT_PX + 8; // 4*36 + 8 = 152
const GAP = 4;

describe("computeMenuPosition — quadrant positioning", () => {
  it("top-left quadrant → menu below and to the right of the word", () => {
    // Word center at (120, 100) — well within top-left quadrant
    const word = makeWordRect(100, 85);
    const result = computeMenuPosition(word, CONTAINER, ENTRY_COUNT, VP_W, VP_H);

    expect(result.direction).toBe("below");
    // Menu top = word.bottom + GAP
    expect(result.top).toBe(word.bottom + GAP);
    // Menu left = word.right + GAP (right of word)
    expect(result.left).toBe(word.right + GAP);
  });

  it("top-right quadrant → menu below and to the left of the word", () => {
    // Word center at (620, 100) — top-right quadrant
    const word = makeWordRect(600, 85);
    const result = computeMenuPosition(word, CONTAINER, ENTRY_COUNT, VP_W, VP_H);

    expect(result.direction).toBe("below");
    // Menu top = word.bottom + GAP
    expect(result.top).toBe(word.bottom + GAP);
    // Menu left = word.left - MENU_WIDTH_PX - GAP (left of word)
    expect(result.left).toBe(word.left - MENU_WIDTH_PX - GAP);
  });

  it("bottom-left quadrant → menu above and to the right of the word", () => {
    // Word center at (120, 450) — bottom-left quadrant
    const word = makeWordRect(100, 435);
    const result = computeMenuPosition(word, CONTAINER, ENTRY_COUNT, VP_W, VP_H);

    expect(result.direction).toBe("above");
    // Menu top = word.top - menuHeight - GAP
    expect(result.top).toBe(word.top - MENU_HEIGHT - GAP);
    // Menu left = word.right + GAP (right of word)
    expect(result.left).toBe(word.right + GAP);
  });

  it("bottom-right quadrant → menu above and to the left of the word", () => {
    // Word center at (620, 450) — bottom-right quadrant
    const word = makeWordRect(600, 435);
    const result = computeMenuPosition(word, CONTAINER, ENTRY_COUNT, VP_W, VP_H);

    expect(result.direction).toBe("above");
    // Menu top = word.top - menuHeight - GAP
    expect(result.top).toBe(word.top - MENU_HEIGHT - GAP);
    // Menu left = word.left - MENU_WIDTH_PX - GAP (left of word)
    expect(result.left).toBe(word.left - MENU_WIDTH_PX - GAP);
  });

  it("word exactly at midpoint → treated as top-left (below-right)", () => {
    // Word center exactly at (400, 300) = viewport midpoint
    const word = makeWordRect(380, 285);
    const result = computeMenuPosition(word, CONTAINER, ENTRY_COUNT, VP_W, VP_H);

    // Midpoint tie-break: not strictly greater → top-left behavior
    expect(result.direction).toBe("below");
    expect(result.left).toBe(word.right + GAP);
  });

  it("accounts for non-zero container offset", () => {
    const containerOffset = { top: 50, left: 30 };
    const word = makeWordRect(100, 85); // top-left quadrant
    const result = computeMenuPosition(word, containerOffset, ENTRY_COUNT, VP_W, VP_H);

    expect(result.direction).toBe("below");
    expect(result.top).toBe(word.bottom - containerOffset.top + GAP);
    expect(result.left).toBe(word.right - containerOffset.left + GAP);
  });
});

describe("computeMenuPosition — viewport clamping", () => {
  it("clamps left to 0 when menu would overflow left edge", () => {
    // Word in top-right quadrant, very close to left edge after offset
    // This forces left = word.left - containerRect.left - MENU_WIDTH_PX - GAP < 0
    const word = makeWordRect(500, 85); // top-right quadrant (center X=520 > 400)
    const containerOffset = { top: 0, left: 400 };
    const result = computeMenuPosition(word, containerOffset, ENTRY_COUNT, VP_W, VP_H);

    // Without clamping: 500 - 400 - 192 - 4 = -96 → should be clamped to 0
    expect(result.left).toBeGreaterThanOrEqual(0);
  });

  it("clamps top to 0 when menu would overflow top edge", () => {
    // Word in bottom-left quadrant but very close to top after container offset
    const word = makeWordRect(100, 360); // bottom-left (center Y=375 > 300)
    const containerOffset = { top: 300, left: 0 };
    const result = computeMenuPosition(word, containerOffset, ENTRY_COUNT, VP_W, VP_H);

    // Without clamping: 360 - 300 - 152 - 4 = -96 → should be clamped to 0
    expect(result.top).toBeGreaterThanOrEqual(0);
  });
});
