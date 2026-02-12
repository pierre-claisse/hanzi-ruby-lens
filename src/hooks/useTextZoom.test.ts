import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTextZoom } from "./useTextZoom";

describe("useTextZoom", () => {
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
  });

  // --- Default initialization ---

  it("initializes to 100% when no saved preference exists", () => {
    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(100);
    expect(result.current.isMinZoom).toBe(true);
    expect(result.current.isMaxZoom).toBe(false);
  });

  // --- Restore from localStorage ---

  it("restores zoom level from localStorage on mount", () => {
    localStorageMock["textZoomLevel"] = "150";

    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(150);
  });

  it("restores minimum zoom level from localStorage", () => {
    localStorageMock["textZoomLevel"] = "100";

    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(100);
    expect(result.current.isMinZoom).toBe(true);
  });

  it("restores maximum zoom level from localStorage", () => {
    localStorageMock["textZoomLevel"] = "200";

    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(200);
    expect(result.current.isMaxZoom).toBe(true);
  });

  // --- Persistence ---

  it("persists zoom level to localStorage on change", async () => {
    const { result } = renderHook(() => useTextZoom());

    act(() => {
      result.current.zoomIn();
    });

    await vi.waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "textZoomLevel",
        "110"
      );
    });
  });

  // --- Zoom in ---

  it("increases zoom level by 10% on zoomIn", () => {
    const { result } = renderHook(() => useTextZoom());

    act(() => {
      result.current.zoomIn();
    });

    expect(result.current.zoomLevel).toBe(110);
  });

  it("does not exceed maximum zoom (200%) on zoomIn", () => {
    localStorageMock["textZoomLevel"] = "200";

    const { result } = renderHook(() => useTextZoom());

    act(() => {
      result.current.zoomIn();
    });

    expect(result.current.zoomLevel).toBe(200);
    expect(result.current.isMaxZoom).toBe(true);
  });

  // --- Zoom out ---

  it("decreases zoom level by 10% on zoomOut", () => {
    localStorageMock["textZoomLevel"] = "150";

    const { result } = renderHook(() => useTextZoom());

    act(() => {
      result.current.zoomOut();
    });

    expect(result.current.zoomLevel).toBe(140);
  });

  it("does not go below minimum zoom (100%) on zoomOut", () => {
    const { result } = renderHook(() => useTextZoom());

    act(() => {
      result.current.zoomOut();
    });

    expect(result.current.zoomLevel).toBe(100);
    expect(result.current.isMinZoom).toBe(true);
  });

  // --- Keyboard shortcuts ---

  it("zooms in on Ctrl+=", () => {
    const { result } = renderHook(() => useTextZoom());

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "=",
        ctrlKey: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
    });

    expect(result.current.zoomLevel).toBe(110);
  });

  it("zooms in on Ctrl++", () => {
    const { result } = renderHook(() => useTextZoom());

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "+",
        ctrlKey: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
    });

    expect(result.current.zoomLevel).toBe(110);
  });

  it("zooms out on Ctrl+-", () => {
    localStorageMock["textZoomLevel"] = "150";

    const { result } = renderHook(() => useTextZoom());

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "-",
        ctrlKey: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
    });

    expect(result.current.zoomLevel).toBe(140);
  });

  it("calls preventDefault on zoom keyboard shortcuts", () => {
    renderHook(() => useTextZoom());

    const event = new KeyboardEvent("keydown", {
      key: "=",
      ctrlKey: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("does not zoom on non-Ctrl key presses", () => {
    const { result } = renderHook(() => useTextZoom());

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "=", ctrlKey: false })
      );
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "-", ctrlKey: false })
      );
    });

    expect(result.current.zoomLevel).toBe(100);
  });

  it("does not zoom on unrelated Ctrl key combos", () => {
    const { result } = renderHook(() => useTextZoom());

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "a", ctrlKey: true })
      );
    });

    expect(result.current.zoomLevel).toBe(100);
  });

  // --- Keyboard boundary enforcement ---

  it("does not exceed max zoom via keyboard", () => {
    localStorageMock["textZoomLevel"] = "200";

    const { result } = renderHook(() => useTextZoom());

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "=",
          ctrlKey: true,
          cancelable: true,
        })
      );
    });

    expect(result.current.zoomLevel).toBe(200);
  });

  it("does not go below min zoom via keyboard", () => {
    localStorageMock["textZoomLevel"] = "100";

    const { result } = renderHook(() => useTextZoom());

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "-",
          ctrlKey: true,
          cancelable: true,
        })
      );
    });

    expect(result.current.zoomLevel).toBe(100);
  });

  // --- Invalid stored values ---

  it("defaults to 100 for non-numeric stored value", () => {
    localStorageMock["textZoomLevel"] = "abc";

    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(100);
  });

  it("defaults to 100 for non-integer stored value", () => {
    localStorageMock["textZoomLevel"] = "105.5";

    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(100);
  });

  it("defaults to 100 for non-multiple-of-10 stored value", () => {
    localStorageMock["textZoomLevel"] = "95";

    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(100);
  });

  it("defaults to 100 for out-of-range stored value (too high)", () => {
    localStorageMock["textZoomLevel"] = "300";

    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(100);
  });

  it("defaults to 100 for out-of-range stored value (too low)", () => {
    localStorageMock["textZoomLevel"] = "10";

    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(100);
  });

  it("defaults to 100 for empty string stored value", () => {
    localStorageMock["textZoomLevel"] = "";

    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(100);
  });

  // --- Error handling ---

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

    const { result } = renderHook(() => useTextZoom());

    expect(result.current.zoomLevel).toBe(100);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to read text zoom preference:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

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

    const { result } = renderHook(() => useTextZoom());

    act(() => {
      result.current.zoomIn();
    });

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to persist text zoom preference:",
        expect.any(Error)
      );
    });

    // State should still update even if persistence fails
    expect(result.current.zoomLevel).toBe(110);

    consoleErrorSpy.mockRestore();
  });

  // --- Event listener cleanup ---

  it("removes keyboard event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() => useTextZoom());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
