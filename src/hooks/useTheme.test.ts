import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
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

    // Clear document.documentElement.className before each test
    document.documentElement.className = "";
  });

  // T006: Initialization test verifying default "light" theme (Contract C1)
  it("returns default value 'light' when no saved preference", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current[0]).toBe("light");
    expect(typeof result.current[1]).toBe("function");
  });

  // T007: Restoration test for "dark" theme from localStorage (Contract C2)
  it("restores 'dark' theme from localStorage on mount", () => {
    // Pre-populate localStorage with "dark"
    localStorageMock["theme"] = "dark";

    const { result } = renderHook(() => useTheme());

    // Should initialize with stored value ("dark")
    expect(result.current[0]).toBe("dark");
  });

  // T007: Restoration test for "light" theme from localStorage (Contract C2)
  it("restores 'light' theme from localStorage on mount", () => {
    // Pre-populate localStorage with "light"
    localStorageMock["theme"] = "light";

    const { result } = renderHook(() => useTheme());

    // Should initialize with stored value ("light")
    expect(result.current[0]).toBe("light");
  });

  // T008: Persistence test verifying theme changes are saved to localStorage (Contract C2)
  it("persists theme changes to localStorage", async () => {
    const { result } = renderHook(() => useTheme());

    // Initial state should be "light"
    expect(result.current[0]).toBe("light");

    // Change to "dark"
    act(() => {
      result.current[1]("dark");
    });

    // Wait for useEffect to run
    await vi.waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
    });

    // Verify state updated
    expect(result.current[0]).toBe("dark");

    // Change back to "light"
    act(() => {
      result.current[1]("light");
    });

    await vi.waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith("theme", "light");
    });

    expect(result.current[0]).toBe("light");
  });

  // T009: DOM manipulation test verifying "dark" class is added correctly (Contract C4)
  it("adds 'dark' class to documentElement when theme is 'dark'", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current[1]("dark");
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  // T009: DOM manipulation test verifying "dark" class is removed correctly (Contract C4)
  it("removes 'dark' class from documentElement when theme is 'light'", () => {
    const { result } = renderHook(() => useTheme());

    // First set to dark
    act(() => {
      result.current[1]("dark");
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Then set back to light
    act(() => {
      result.current[1]("light");
    });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  // T010: Error handling test for localStorage.getItem failures (Contract C3)
  it("handles localStorage read errors gracefully and defaults to 'light'", () => {
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

    const { result } = renderHook(() => useTheme());

    // Should fall back to default ("light")
    expect(result.current[0]).toBe("light");

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to read theme preference:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  // T011: Error handling test for localStorage.setItem failures (Contract C3)
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

    const { result } = renderHook(() => useTheme());

    // State change should not crash
    act(() => {
      result.current[1]("dark");
    });

    // Verify error was logged
    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to persist theme preference:",
        expect.any(Error)
      );
    });

    // State should still update even if persistence fails
    expect(result.current[0]).toBe("dark");

    consoleErrorSpy.mockRestore();
  });
});
