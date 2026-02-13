import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWordNavigation } from "../../src/hooks/useWordNavigation";

function makeKeyEvent(key: string, overrides: Partial<React.KeyboardEvent> = {}): React.KeyboardEvent {
  const prevented = { current: false };
  return {
    key,
    preventDefault: () => { prevented.current = true; },
    get defaultPrevented() { return prevented.current; },
    ...overrides,
  } as unknown as React.KeyboardEvent;
}

describe("useWordNavigation", () => {
  const WORD_COUNT = 5;

  // --- Initialization ---

  it("initializes trackedIndex to 0", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    expect(result.current.trackedIndex).toBe(0);
  });

  it("initializes isFocused to false", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    expect(result.current.isFocused).toBe(false);
  });

  it("initializes menuOpen to false", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    expect(result.current.menuOpen).toBe(false);
  });

  it("initializes menuFocusedIndex to 0", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    expect(result.current.menuFocusedIndex).toBe(0);
  });

  // --- Focus / Blur ---

  it("sets isFocused to true on handleFocus", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleFocus(); });

    expect(result.current.isFocused).toBe(true);
  });

  it("sets isFocused to false on handleBlur", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleFocus(); });
    act(() => { result.current.handleBlur(); });

    expect(result.current.isFocused).toBe(false);
  });

  it("closes menu on handleBlur", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleFocus(); });
    act(() => { result.current.openMenuForWord(2); });
    expect(result.current.menuOpen).toBe(true);

    act(() => { result.current.handleBlur(); });

    expect(result.current.menuOpen).toBe(false);
  });

  // --- ArrowRight ---

  it("increments trackedIndex on ArrowRight", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowRight")); });

    expect(result.current.trackedIndex).toBe(1);
  });

  it("clamps trackedIndex at wordCount-1 on ArrowRight", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    for (let i = 0; i < WORD_COUNT + 2; i++) {
      act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowRight")); });
    }

    expect(result.current.trackedIndex).toBe(WORD_COUNT - 1);
  });

  it("calls preventDefault on ArrowRight", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    const event = makeKeyEvent("ArrowRight");

    act(() => { result.current.handleKeyDown(event); });

    expect(event.defaultPrevented).toBe(true);
  });

  // --- ArrowLeft ---

  it("decrements trackedIndex on ArrowLeft", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowRight")); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowRight")); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowLeft")); });

    expect(result.current.trackedIndex).toBe(1);
  });

  it("clamps trackedIndex at 0 on ArrowLeft", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowLeft")); });

    expect(result.current.trackedIndex).toBe(0);
  });

  it("calls preventDefault on ArrowLeft", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    const event = makeKeyEvent("ArrowLeft");

    act(() => { result.current.handleKeyDown(event); });

    expect(event.defaultPrevented).toBe(true);
  });

  // --- Space ---

  it("calls preventDefault on Space (does nothing)", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    const event = makeKeyEvent(" ");

    act(() => { result.current.handleKeyDown(event); });

    expect(event.defaultPrevented).toBe(true);
    expect(result.current.trackedIndex).toBe(0);
  });

  // --- Mouse hover ---

  it("sets trackedIndex on handleWordHover", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleWordHover(3); });

    expect(result.current.trackedIndex).toBe(3);
  });

  it("arrow navigation continues from mouse-set position", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleWordHover(2); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowRight")); });

    expect(result.current.trackedIndex).toBe(3);
  });

  // --- Enter opens menu ---

  it("opens menu on Enter in word-navigation mode", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleKeyDown(makeKeyEvent("Enter")); });

    expect(result.current.menuOpen).toBe(true);
    expect(result.current.menuFocusedIndex).toBe(0);
  });

  it("calls preventDefault on Enter in word-navigation mode", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    const event = makeKeyEvent("Enter");

    act(() => { result.current.handleKeyDown(event); });

    expect(event.defaultPrevented).toBe(true);
  });

  // --- openMenuForWord ---

  it("sets trackedIndex and opens menu via openMenuForWord", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(3); });

    expect(result.current.trackedIndex).toBe(3);
    expect(result.current.menuOpen).toBe(true);
    expect(result.current.menuFocusedIndex).toBe(0);
  });

  // --- closeMenu ---

  it("resets menu state on closeMenu", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(2); });
    act(() => { result.current.closeMenu(); });

    expect(result.current.menuOpen).toBe(false);
    expect(result.current.menuFocusedIndex).toBe(0);
  });

  // --- Menu mode: ArrowDown/ArrowUp with wrapping ---

  it("increments menuFocusedIndex on ArrowDown in menu mode", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(0); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowDown")); });

    expect(result.current.menuFocusedIndex).toBe(1);
  });

  it("wraps menuFocusedIndex on ArrowDown past last entry", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(0); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowDown")); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowDown")); });

    expect(result.current.menuFocusedIndex).toBe(0);
  });

  it("decrements menuFocusedIndex on ArrowUp in menu mode", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(0); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowDown")); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowUp")); });

    expect(result.current.menuFocusedIndex).toBe(0);
  });

  it("wraps menuFocusedIndex on ArrowUp past first entry", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(0); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowUp")); });

    expect(result.current.menuFocusedIndex).toBe(1);
  });

  // --- Menu mode: Enter no-op ---

  it("does nothing on Enter in menu mode (menu stays open)", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(0); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("Enter")); });

    expect(result.current.menuOpen).toBe(true);
  });

  // --- Menu mode: Escape no-op ---

  it("does nothing on Escape in menu mode (menu stays open)", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(0); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("Escape")); });

    expect(result.current.menuOpen).toBe(true);
  });

  // --- Menu mode: ArrowLeft/ArrowRight close menu and navigate ---

  it("closes menu and decrements trackedIndex on ArrowLeft in menu mode", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleWordHover(2); });
    act(() => { result.current.openMenuForWord(2); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowLeft")); });

    expect(result.current.menuOpen).toBe(false);
    expect(result.current.trackedIndex).toBe(1);
  });

  it("closes menu and increments trackedIndex on ArrowRight in menu mode", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.handleWordHover(2); });
    act(() => { result.current.openMenuForWord(2); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowRight")); });

    expect(result.current.menuOpen).toBe(false);
    expect(result.current.trackedIndex).toBe(3);
  });

  it("clamps at 0 when ArrowLeft closes menu at first word", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(0); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowLeft")); });

    expect(result.current.menuOpen).toBe(false);
    expect(result.current.trackedIndex).toBe(0);
  });

  it("clamps at last word when ArrowRight closes menu at last word", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(WORD_COUNT - 1); });
    act(() => { result.current.handleKeyDown(makeKeyEvent("ArrowRight")); });

    expect(result.current.menuOpen).toBe(false);
    expect(result.current.trackedIndex).toBe(WORD_COUNT - 1);
  });

  // --- Menu mode: Space still does nothing ---

  it("calls preventDefault on Space in menu mode", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    const event = makeKeyEvent(" ");

    act(() => { result.current.openMenuForWord(0); });
    act(() => { result.current.handleKeyDown(event); });

    expect(event.defaultPrevented).toBe(true);
    expect(result.current.menuOpen).toBe(true);
  });

  // --- Menu mode: mouse hover on entry (FR-020) ---

  it("sets menuFocusedIndex on handleMenuEntryHover", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(0); });
    expect(result.current.menuFocusedIndex).toBe(0);

    act(() => { result.current.handleMenuEntryHover(1); });

    expect(result.current.menuFocusedIndex).toBe(1);
  });

  // --- Menu mode: mouse hover closes menu (FR-019) ---

  it("closes menu when mouse hovers a different word", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(1); });
    expect(result.current.menuOpen).toBe(true);

    act(() => { result.current.handleWordHover(3); });

    expect(result.current.menuOpen).toBe(false);
    expect(result.current.trackedIndex).toBe(3);
  });

  it("keeps menu open when mouse hovers the same word", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));

    act(() => { result.current.openMenuForWord(2); });
    expect(result.current.menuOpen).toBe(true);

    act(() => { result.current.handleWordHover(2); });

    expect(result.current.menuOpen).toBe(true);
    expect(result.current.trackedIndex).toBe(2);
  });

  // --- Unrelated keys ---

  it("ignores unrelated keys in word-navigation mode", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    const event = makeKeyEvent("a");

    act(() => { result.current.handleKeyDown(event); });

    expect(result.current.trackedIndex).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores unrelated keys in menu mode", () => {
    const { result } = renderHook(() => useWordNavigation({ wordCount: WORD_COUNT }));
    const event = makeKeyEvent("a");

    act(() => { result.current.openMenuForWord(0); });
    act(() => { result.current.handleKeyDown(event); });

    expect(result.current.menuOpen).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });
});
