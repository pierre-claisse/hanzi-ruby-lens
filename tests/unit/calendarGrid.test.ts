import { describe, it, expect } from "vitest";
import {
  buildCalendarGrid,
  shiftMonth,
  monthName,
  compareDates,
  formatDateLong,
} from "../../src/utils/calendarGrid";

describe("buildCalendarGrid", () => {
  it("returns exactly 42 cells", () => {
    const grid = buildCalendarGrid(2026, 5);
    expect(grid).toHaveLength(42);
  });

  it("starts on a Monday", () => {
    // May 2026 — May 1st is a Friday (UTC: 2026-05-01 -> getUTCDay() = 5)
    // Monday-first weekday(Fri)=4, so 4 prev-month cells.
    const grid = buildCalendarGrid(2026, 5);
    expect(grid[0].date).toBe("2026-04-27"); // Monday Apr 27
    expect(grid[0].inMonth).toBe(false);
  });

  it("includes the first day of month in the correct slot", () => {
    const grid = buildCalendarGrid(2026, 5);
    const firstMay = grid.find((c) => c.date === "2026-05-01");
    expect(firstMay).toBeDefined();
    expect(firstMay?.inMonth).toBe(true);
  });

  it("includes the last day of month", () => {
    const grid = buildCalendarGrid(2026, 5);
    const lastMay = grid.find((c) => c.date === "2026-05-31");
    expect(lastMay?.inMonth).toBe(true);
  });

  it("overflow days at the end are out of month", () => {
    const grid = buildCalendarGrid(2026, 5);
    const last = grid[41];
    expect(last.inMonth).toBe(false);
    expect(last.date.startsWith("2026-06")).toBe(true);
  });

  it("handles February in a leap year (2024)", () => {
    const grid = buildCalendarGrid(2024, 2);
    const feb29 = grid.find((c) => c.date === "2024-02-29");
    expect(feb29).toBeDefined();
    expect(feb29?.inMonth).toBe(true);
  });

  it("handles February in a non-leap year (2025)", () => {
    const grid = buildCalendarGrid(2025, 2);
    const feb29 = grid.find((c) => c.date === "2025-02-29");
    expect(feb29).toBeUndefined();
  });

  it("handles January (rolls back to previous year)", () => {
    const grid = buildCalendarGrid(2026, 1);
    expect(grid[0].date.startsWith("2025-12") || grid[0].date.startsWith("2026-01"))
      .toBe(true);
  });

  it("handles December (rolls forward to next year)", () => {
    const grid = buildCalendarGrid(2026, 12);
    const last = grid[41];
    expect(last.date.startsWith("2026-12") || last.date.startsWith("2027-01"))
      .toBe(true);
  });
});

describe("shiftMonth", () => {
  it("moves forward within a year", () => {
    expect(shiftMonth(2026, 5, 1)).toEqual({ year: 2026, month: 6 });
  });

  it("moves backward within a year", () => {
    expect(shiftMonth(2026, 5, -1)).toEqual({ year: 2026, month: 4 });
  });

  it("rolls forward across year boundary", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("rolls backward across year boundary", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("handles large deltas", () => {
    expect(shiftMonth(2026, 5, 14)).toEqual({ year: 2027, month: 7 });
    expect(shiftMonth(2026, 5, -14)).toEqual({ year: 2025, month: 3 });
  });
});

describe("monthName", () => {
  it("January", () => expect(monthName(1)).toBe("January"));
  it("December", () => expect(monthName(12)).toBe("December"));
});

describe("compareDates", () => {
  it("a < b returns -1", () => expect(compareDates("2026-05-01", "2026-05-02")).toBe(-1));
  it("a > b returns 1", () => expect(compareDates("2026-05-02", "2026-05-01")).toBe(1));
  it("equal returns 0", () => expect(compareDates("2026-05-01", "2026-05-01")).toBe(0));
});

describe("formatDateLong", () => {
  it("formats 2026-05-15 as Friday, 15 May 2026", () => {
    expect(formatDateLong("2026-05-15")).toBe("Friday, 15 May 2026");
  });
});
