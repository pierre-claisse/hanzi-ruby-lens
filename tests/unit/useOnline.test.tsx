import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnline } from "../../src/hooks/useOnline";

describe("useOnline", () => {
  it("returns navigator.onLine initially", () => {
    const { result } = renderHook(() => useOnline());
    expect(typeof result.current).toBe("boolean");
  });

  it("flips to false when an 'offline' event fires", () => {
    const { result } = renderHook(() => useOnline());
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);
  });

  it("flips back to true when an 'online' event fires", () => {
    const { result } = renderHook(() => useOnline());
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });
});
