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

  it("initializes theme from OS preference (light)", () => {
    currentMatches = false;
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("light");
  });

  it("initializes theme from OS preference (dark)", () => {
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

  it("detects live OS theme change from light to dark", () => {
    currentMatches = false;
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("light");

    act(() => {
      simulateOsThemeChange(true);
    });

    expect(result.current[0]).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("detects live OS theme change from dark to light", () => {
    currentMatches = true;
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("dark");

    act(() => {
      simulateOsThemeChange(false);
    });

    expect(result.current[0]).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("manual toggle changes theme", () => {
    currentMatches = false;
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("light");

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("OS change overrides manual toggle", () => {
    currentMatches = false;
    const { result } = renderHook(() => useTheme());

    // Manual toggle to dark
    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe("dark");

    // OS changes to light — should override
    act(() => {
      simulateOsThemeChange(false);
    });
    expect(result.current[0]).toBe("light");
  });

  it("does not read from localStorage", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    currentMatches = false;
    renderHook(() => useTheme());
    expect(getItemSpy).not.toHaveBeenCalledWith("theme");
    getItemSpy.mockRestore();
  });

  it("cleans up event listener on unmount", () => {
    currentMatches = false;
    const { unmount } = renderHook(() => useTheme());
    expect(matchMediaListeners).toHaveLength(1);

    unmount();
    // removeEventListener was called — listener removed
    expect(matchMediaListeners).toHaveLength(0);
  });
});
