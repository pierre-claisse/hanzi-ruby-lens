import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CloseButton } from "./CloseButton";

// Mock @tauri-apps/api/window
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    close: vi.fn(),
  })),
}));

describe("CloseButton", () => {
  // T029c: "calls e.stopPropagation() on pointerDown event"
  it("calls e.stopPropagation() on pointerDown event", () => {
    render(<CloseButton />);

    const button = screen.getByRole("button", { name: /close application/i });

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

  // T034c: "button has p-1.5 padding class and cursor-pointer class"
  it("button has p-1.5 padding class and cursor-pointer class", () => {
    render(<CloseButton />);

    const button = screen.getByRole("button", { name: /close application/i });

    // Verify padding is p-1.5 (not p-2)
    expect(button.className).toMatch(/p-1\.5/);

    // Verify cursor-pointer class
    expect(button.className).toMatch(/cursor-pointer/);
  });
});
