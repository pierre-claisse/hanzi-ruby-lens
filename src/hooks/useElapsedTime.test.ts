import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { formatElapsed, useElapsedTime } from "./useElapsedTime";

describe("formatElapsed", () => {
  // T003: formatElapsed formatting tests
  it("formats 0 seconds as '0s'", () => {
    expect(formatElapsed(0)).toBe("0s");
  });

  it("formats 1 second as '1s'", () => {
    expect(formatElapsed(1)).toBe("1s");
  });

  it("formats 59 seconds as '59s'", () => {
    expect(formatElapsed(59)).toBe("59s");
  });

  it("formats 60 seconds as '1m 0s'", () => {
    expect(formatElapsed(60)).toBe("1m 0s");
  });

  it("formats 75 seconds as '1m 15s'", () => {
    expect(formatElapsed(75)).toBe("1m 15s");
  });

  it("formats 605 seconds as '10m 5s'", () => {
    expect(formatElapsed(605)).toBe("10m 5s");
  });
});

describe("useElapsedTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // T004: starts at 0 and increments
  it("starts at 0 when isRunning is true", () => {
    const { result } = renderHook(() => useElapsedTime(true));
    expect(result.current.elapsed).toBe(0);
    expect(result.current.formatted).toBe("0s");
  });

  it("increments to 1 after 1 second", () => {
    const { result } = renderHook(() => useElapsedTime(true));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.elapsed).toBe(1);
    expect(result.current.formatted).toBe("1s");
  });

  it("increments to 2 after 2 seconds", () => {
    const { result } = renderHook(() => useElapsedTime(true));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.elapsed).toBe(2);
    expect(result.current.formatted).toBe("2s");
  });

  // T005: does not increment when not running
  it("does not increment when isRunning is false", () => {
    const { result } = renderHook(() => useElapsedTime(false));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.elapsed).toBe(0);
    expect(result.current.formatted).toBe("0s");
  });

  // T006: stops incrementing when isRunning changes to false
  it("stops incrementing when isRunning changes from true to false", () => {
    const { result, rerender } = renderHook(
      ({ isRunning }) => useElapsedTime(isRunning),
      { initialProps: { isRunning: true } },
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.elapsed).toBe(3);

    rerender({ isRunning: false });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.elapsed).toBe(3);
  });

  // T007: cleanup on unmount
  it("cleans up interval on unmount", () => {
    const { unmount } = renderHook(() => useElapsedTime(true));

    unmount();

    // No error should occur — interval was cleared
    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });

  // T012 [US2]: resets to 0 on false→true transition
  it("resets elapsed to 0 when isRunning transitions false→true", () => {
    const { result, rerender } = renderHook(
      ({ isRunning }) => useElapsedTime(isRunning),
      { initialProps: { isRunning: true } },
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.elapsed).toBe(5);

    rerender({ isRunning: false });

    rerender({ isRunning: true });
    expect(result.current.elapsed).toBe(0);
    expect(result.current.formatted).toBe("0s");

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.elapsed).toBe(2);
  });

  it("formats elapsed time correctly at 75 seconds", () => {
    const { result } = renderHook(() => useElapsedTime(true));

    act(() => {
      vi.advanceTimersByTime(75000);
    });

    expect(result.current.elapsed).toBe(75);
    expect(result.current.formatted).toBe("1m 15s");
  });
});
