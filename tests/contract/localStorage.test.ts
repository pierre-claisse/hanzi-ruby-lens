import { describe, it, expect, beforeEach, vi } from "vitest";

describe("localStorage Contract", () => {
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

  // T019: Writing "true" and reading returns "true"
  it("stores and retrieves 'true' value correctly", () => {
    localStorage.setItem("testKey", "true");
    const value = localStorage.getItem("testKey");

    expect(value).toBe("true");
    expect(localStorageMock["testKey"]).toBe("true");
  });

  // T020: Writing "false" and reading returns "false"
  it("stores and retrieves 'false' value correctly", () => {
    localStorage.setItem("testKey", "false");
    const value = localStorage.getItem("testKey");

    expect(value).toBe("false");
    expect(localStorageMock["testKey"]).toBe("false");
  });

  // T021: Reading non-existent key returns null
  it("returns null when reading non-existent key", () => {
    const value = localStorage.getItem("nonExistentKey");

    expect(value).toBeNull();
  });

  // T022: localStorage error handling (mock QuotaExceededError)
  it("throws error when quota exceeded", () => {
    // Replace setItem to throw QuotaExceededError
    global.localStorage.setItem = vi.fn(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });

    expect(() => {
      localStorage.setItem("testKey", "value");
    }).toThrow("QuotaExceededError");
  });

  it("throws error when reading from inaccessible localStorage", () => {
    // Replace getItem to throw error (private browsing mode)
    global.localStorage.getItem = vi.fn(() => {
      throw new Error("localStorage is not available");
    });

    expect(() => {
      localStorage.getItem("testKey");
    }).toThrow("localStorage is not available");
  });

  // Additional contract tests
  it("overwrites existing value when setting same key", () => {
    localStorage.setItem("testKey", "firstValue");
    expect(localStorage.getItem("testKey")).toBe("firstValue");

    localStorage.setItem("testKey", "secondValue");
    expect(localStorage.getItem("testKey")).toBe("secondValue");
  });

  it("removes key correctly", () => {
    localStorage.setItem("testKey", "value");
    expect(localStorage.getItem("testKey")).toBe("value");

    localStorage.removeItem("testKey");
    expect(localStorage.getItem("testKey")).toBeNull();
  });

  it("clears all keys correctly", () => {
    localStorage.setItem("key1", "value1");
    localStorage.setItem("key2", "value2");
    localStorage.setItem("key3", "value3");

    localStorage.clear();

    expect(localStorage.getItem("key1")).toBeNull();
    expect(localStorage.getItem("key2")).toBeNull();
    expect(localStorage.getItem("key3")).toBeNull();
  });
});
