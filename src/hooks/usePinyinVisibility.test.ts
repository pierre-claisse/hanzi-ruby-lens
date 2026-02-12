import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePinyinVisibility } from "./usePinyinVisibility";

describe("usePinyinVisibility", () => {
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
  });

  // T001: Returns [true, function] on first run (no saved preference)
  it("returns [true, function] on first run when no saved preference", () => {
    const { result } = renderHook(() => usePinyinVisibility());

    // Should return tuple with default value true and setter function
    expect(result.current[0]).toBe(true);
    expect(typeof result.current[1]).toBe("function");
  });

  // T002: Writes to localStorage on state change
  it("persists to localStorage when state changes", async () => {
    const { result } = renderHook(() => usePinyinVisibility());

    // Initial state should be true
    expect(result.current[0]).toBe(true);

    // Toggle to false
    act(() => {
      result.current[1](false);
    });

    // Wait for useEffect to run
    await vi.waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith("pinyinVisible", "false");
    });

    // Verify state updated
    expect(result.current[0]).toBe(false);

    // Toggle back to true
    act(() => {
      result.current[1](true);
    });

    await vi.waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith("pinyinVisible", "true");
    });

    expect(result.current[0]).toBe(true);
  });

  // T003: Restores from localStorage on subsequent runs
  it("restores preference from localStorage on mount", () => {
    // Pre-populate localStorage with false
    localStorageMock["pinyinVisible"] = "false";

    const { result } = renderHook(() => usePinyinVisibility());

    // Should initialize with stored value (false)
    expect(result.current[0]).toBe(false);
  });

  it("restores true preference from localStorage on mount", () => {
    // Pre-populate localStorage with true
    localStorageMock["pinyinVisible"] = "true";

    const { result } = renderHook(() => usePinyinVisibility());

    // Should initialize with stored value (true)
    expect(result.current[0]).toBe(true);
  });

  // T004: Handles localStorage errors gracefully (returns default true)
  it("handles localStorage read errors gracefully and defaults to true", () => {
    // Mock localStorage.getItem to throw error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    global.localStorage = {
      getItem: vi.fn(() => {
        throw new Error("QuotaExceededError");
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    } as Storage;

    const { result } = renderHook(() => usePinyinVisibility());

    // Should fall back to default (true)
    expect(result.current[0]).toBe(true);

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to read pinyin visibility preference:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("handles localStorage write errors gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock localStorage.setItem to throw error
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn(() => {
        throw new Error("QuotaExceededError");
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    } as Storage;

    const { result } = renderHook(() => usePinyinVisibility());

    // State change should not crash
    act(() => {
      result.current[1](false);
    });

    // Verify error was logged
    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to persist pinyin visibility preference:",
        expect.any(Error)
      );
    });

    // State should still update even if persistence fails
    expect(result.current[0]).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
