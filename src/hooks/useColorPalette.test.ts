import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColorPalette } from "./useColorPalette";

describe("useColorPalette", () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
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

    // Reset dataset between tests
    delete document.documentElement.dataset.palette;
  });

  // 1. Default initialization
  it("initializes to 'vermillion-scroll' when no saved preference exists", () => {
    const { result } = renderHook(() => useColorPalette());

    expect(result.current.paletteId).toBe("vermillion-scroll");
  });

  // 2. Restore valid palette from localStorage
  it("restores valid palette ID from localStorage on mount", () => {
    localStorageMock["colorPalette"] = "jade-garden";

    const { result } = renderHook(() => useColorPalette());

    expect(result.current.paletteId).toBe("jade-garden");
  });

  // 3. Persist on change
  it("persists palette ID to localStorage on change", async () => {
    const { result } = renderHook(() => useColorPalette());

    act(() => {
      result.current.setPalette("indigo-silk");
    });

    await vi.waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "colorPalette",
        "indigo-silk"
      );
    });

    expect(result.current.paletteId).toBe("indigo-silk");
  });

  // 4. Invalid stored value → fallback
  it("falls back to default for invalid stored value", () => {
    localStorageMock["colorPalette"] = "not-a-real-palette";

    const { result } = renderHook(() => useColorPalette());

    expect(result.current.paletteId).toBe("vermillion-scroll");
  });

  // 5. Unknown ID fallback (empty string)
  it("falls back to default for empty string stored value", () => {
    localStorageMock["colorPalette"] = "";

    const { result } = renderHook(() => useColorPalette());

    expect(result.current.paletteId).toBe("vermillion-scroll");
  });

  // 6. dataset.palette update
  it("sets document.documentElement.dataset.palette on change", async () => {
    const { result } = renderHook(() => useColorPalette());

    act(() => {
      result.current.setPalette("plum-blossom");
    });

    await vi.waitFor(() => {
      expect(document.documentElement.dataset.palette).toBe("plum-blossom");
    });
  });

  // 7. localStorage read error
  it("handles localStorage read error gracefully", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

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

    const { result } = renderHook(() => useColorPalette());

    expect(result.current.paletteId).toBe("vermillion-scroll");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to read color palette preference:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  // 8. localStorage write error
  it("handles localStorage write error gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

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

    const { result } = renderHook(() => useColorPalette());

    act(() => {
      result.current.setPalette("golden-pavilion");
    });

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to persist color palette preference:",
        expect.any(Error)
      );
    });

    // State should still update even if persistence fails
    expect(result.current.paletteId).toBe("golden-pavilion");

    consoleErrorSpy.mockRestore();
  });

  // 9. setPalette with unknown ID is no-op
  it("ignores setPalette with unknown palette ID", () => {
    const { result } = renderHook(() => useColorPalette());

    const initialPalette = result.current.paletteId;

    act(() => {
      result.current.setPalette("nonexistent-palette");
    });

    expect(result.current.paletteId).toBe(initialPalette);
  });

  // 10. palettes returns all 6
  it("returns all 6 palettes", () => {
    const { result } = renderHook(() => useColorPalette());

    expect(result.current.palettes).toHaveLength(6);
    expect(result.current.palettes.map((p) => p.id)).toEqual([
      "vermillion-scroll",
      "jade-garden",
      "indigo-silk",
      "plum-blossom",
      "golden-pavilion",
      "ink-wash",
    ]);
  });
});
