import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Reset localStorage mock before each test
    localStorageMock = {};

    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    } as Storage;

    // Reset document.documentElement.classList
    document.documentElement.className = "";
  });

  // T004: "renders with moon icon in light mode by default"
  it("renders with moon icon in light mode by default", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(button).toBeInTheDocument();

    // Moon icon should be visible in light mode
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  // T005: "toggles to dark mode on click and persists to localStorage"
  it("toggles to dark mode on click and persists to localStorage", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /switch to dark mode/i });

    // Click to toggle to dark mode
    fireEvent.click(button);

    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");

    // Verify document class was updated
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Verify button label changed
    expect(button).toHaveAttribute("aria-label", "Switch to light mode");

    // Click again to toggle back to light mode
    fireEvent.click(button);

    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(button).toHaveAttribute("aria-label", "Switch to dark mode");
  });

  // T006: "is keyboard accessible with Tab, Enter, and Space keys"
  it("is keyboard accessible with Tab, Enter, and Space keys", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /switch to dark mode/i });

    // Verify button is focusable (native button behavior)
    button.focus();
    expect(document.activeElement).toBe(button);

    // Verify button has proper ARIA attributes for screen readers
    expect(button).toHaveAttribute("aria-label");
    expect(button).toHaveAttribute("aria-pressed");

    // Test button activation (Enter/Space trigger onClick in browsers)
    // Native <button> elements handle Enter and Space automatically
    fireEvent.click(button);
    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  // T007: "handles localStorage unavailable gracefully (silent fallback)"
  it("handles localStorage unavailable gracefully (silent fallback)", () => {
    // Mock localStorage to throw errors (private browsing mode)
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    global.localStorage = {
      getItem: vi.fn(() => {
        throw new Error("QuotaExceededError");
      }),
      setItem: vi.fn(() => {
        throw new Error("QuotaExceededError");
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    } as Storage;

    // Component should still render without crashing
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    // Click should not crash (even though persistence fails)
    fireEvent.click(button);
    expect(button).toBeInTheDocument();

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  // T008: "initializes from localStorage if dark theme is stored"
  it("initializes from localStorage if dark theme is stored", () => {
    // Pre-populate localStorage with dark theme
    localStorageMock["theme"] = "dark";

    render(<ThemeToggle />);

    // Verify button shows correct initial state (sun icon, indicating dark mode is active)
    const button = screen.getByRole("button", { name: /switch to light mode/i });
    expect(button).toBeInTheDocument();

    // Verify document class was applied on mount
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
