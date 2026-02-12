import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FullscreenToggle } from "./FullscreenToggle";

// Mock the useFullscreen hook
vi.mock("../hooks/useFullscreen", () => ({
  useFullscreen: vi.fn(() => ({
    isFullscreen: false,
    toggleFullscreen: vi.fn(),
  })),
}));

describe("FullscreenToggle", () => {
  // T029b: "calls e.stopPropagation() on pointerDown event"
  it("calls e.stopPropagation() on pointerDown event", () => {
    render(<FullscreenToggle />);

    const button = screen.getByRole("button", { name: /enter fullscreen/i });

    // Create a mock pointerDown event with stopPropagation
    const mockStopPropagation = vi.fn();
    const pointerDownEvent = new PointerEvent("pointerdown", { bubbles: true });
    Object.defineProperty(pointerDownEvent, "stopPropagation", {
      value: mockStopPropagation,
    });

    // Fire pointerDown event
    fireEvent(button, pointerDownEvent);

    // Verify stopPropagation was called
    expect(mockStopPropagation).toHaveBeenCalled();
  });

  // T034b: "button has p-1.5 padding class and cursor-pointer class"
  it("button has p-1.5 padding class and cursor-pointer class", () => {
    render(<FullscreenToggle />);

    const button = screen.getByRole("button", { name: /enter fullscreen/i });

    // Verify padding is p-1.5 (not p-2)
    expect(button.className).toMatch(/p-1\.5/);

    // Verify cursor-pointer class
    expect(button.className).toMatch(/cursor-pointer/);
  });
});
