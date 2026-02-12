import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("renders moon icon in light mode", () => {
    render(<ThemeToggle theme="light" onToggle={vi.fn()} />);

    const button = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(button).toBeInTheDocument();

    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders sun icon in dark mode", () => {
    render(<ThemeToggle theme="dark" onToggle={vi.fn()} />);

    const button = screen.getByRole("button", { name: /switch to light mode/i });
    expect(button).toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(<ThemeToggle theme="light" onToggle={onToggle} />);

    const button = screen.getByRole("button", { name: /switch to dark mode/i });
    fireEvent.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("has correct aria-label in light mode", () => {
    render(<ThemeToggle theme="light" onToggle={vi.fn()} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Switch to dark mode");
  });

  it("has correct aria-label in dark mode", () => {
    render(<ThemeToggle theme="dark" onToggle={vi.fn()} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Switch to light mode");
  });

  it("has aria-pressed matching dark theme state", () => {
    const { rerender } = render(<ThemeToggle theme="light" onToggle={vi.fn()} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");

    rerender(<ThemeToggle theme="dark" onToggle={vi.fn()} />);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("calls e.stopPropagation() on pointerDown event", () => {
    render(<ThemeToggle theme="light" onToggle={vi.fn()} />);

    const button = screen.getByRole("button", { name: /switch to dark mode/i });

    const mockStopPropagation = vi.fn();
    const pointerDownEvent = new PointerEvent("pointerdown", { bubbles: true });
    Object.defineProperty(pointerDownEvent, "stopPropagation", {
      value: mockStopPropagation,
    });

    fireEvent(button, pointerDownEvent);

    expect(mockStopPropagation).toHaveBeenCalled();
  });

  it("button has p-1.5 padding class and cursor-pointer class", () => {
    render(<ThemeToggle theme="light" onToggle={vi.fn()} />);

    const button = screen.getByRole("button", { name: /switch to dark mode/i });

    expect(button.className).toMatch(/p-1\.5/);
    expect(button.className).toMatch(/cursor-pointer/);
  });
});
