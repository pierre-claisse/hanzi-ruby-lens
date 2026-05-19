import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  let matchMediaListeners: Array<(e: { matches: boolean }) => void>;
  let currentMatches: boolean;

  beforeEach(() => {
    matchMediaListeners = [];
    currentMatches = false;
    document.documentElement.className = "";
    localStorage.clear();

    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: currentMatches,
        media: query,
        addEventListener: vi.fn((_event: string, cb: (e: { matches: boolean }) => void) => {
          matchMediaListeners.push(cb);
        }),
        removeEventListener: vi.fn((_event: string, cb: (e: { matches: boolean }) => void) => {
          matchMediaListeners = matchMediaListeners.filter((l) => l !== cb);
        }),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  function simulateOsThemeChange(isDark: boolean) {
    matchMediaListeners.forEach((cb) => cb({ matches: isDark }));
  }

  it("initializes theme from OS preference when nothing is stored (light)", () => {
    currentMatches = false;
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("light");
  });

  it("initializes theme from OS preference when nothing is stored (dark)", () => {
    currentMatches = true;
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("dark");
  });

  it("adds 'dark' class to documentElement when OS is dark", () => {
    currentMatches = true;
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("does not add 'dark' class when OS is light", () => {
    currentMatches = false;
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("reads the stored theme on init, overriding the OS preference", () => {
    currentMatches = false;
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("follows live OS theme change when no explicit choice has been made", () => {
    currentMatches = false;
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("light");

    act(() => {
      simulateOsThemeChange(true);
    });

    expect(result.current[0]).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("manual toggle persists to localStorage", () => {
    currentMatches = false;
    const { result } = renderHook(() => useTheme());
    expect(localStorage.getItem("theme")).toBeNull();

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("explicit user choice survives OS theme changes (no override)", () => {
    currentMatches = false;
    const { result } = renderHook(() => useTheme());

    // User explicitly picks dark.
    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe("dark");

    // OS flips to light — we keep the user's choice.
    act(() => {
      simulateOsThemeChange(false);
    });
    expect(result.current[0]).toBe("dark");
  });

  it("ignores invalid stored values and falls back to OS pref", () => {
    currentMatches = true;
    localStorage.setItem("theme", "purple-rain");
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("dark");
  });

  it("cleans up event listener on unmount", () => {
    currentMatches = false;
    const { unmount } = renderHook(() => useTheme());
    expect(matchMediaListeners).toHaveLength(1);

    unmount();
    expect(matchMediaListeners).toHaveLength(0);
  });
});
