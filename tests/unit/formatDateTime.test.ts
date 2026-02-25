import { describe, it, expect } from "vitest";
import { formatDateTime } from "../../src/utils/formatDateTime";

describe("formatDateTime", () => {
  it("converts ISO string to YYYY-MM-DD HH:mm format", () => {
    expect(formatDateTime("2026-02-25T14:32:00")).toBe("2026-02-25 14:32");
  });

  it("handles ISO string with seconds", () => {
    expect(formatDateTime("2026-02-25T09:05:30")).toBe("2026-02-25 09:05");
  });

  it("handles midnight correctly", () => {
    expect(formatDateTime("2026-01-01T00:00:00")).toBe("2026-01-01 00:00");
  });

  it("handles legacy date-only strings gracefully (appends 00:00)", () => {
    expect(formatDateTime("2026-02-25")).toBe("2026-02-25 00:00");
  });

  it("handles ISO string with timezone offset", () => {
    // Should extract the local time portion regardless of timezone
    expect(formatDateTime("2026-02-25T14:32:00+08:00")).toBe("2026-02-25 14:32");
  });

  it("handles end-of-day time", () => {
    expect(formatDateTime("2026-12-31T23:59:59")).toBe("2026-12-31 23:59");
  });

  it("returns empty string for empty input", () => {
    expect(formatDateTime("")).toBe("");
  });
});
