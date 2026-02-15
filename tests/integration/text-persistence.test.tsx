import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../../src/App";

// Mock Tauri window API
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setFullscreen: vi.fn().mockResolvedValue(undefined),
    isFullscreen: vi.fn().mockResolvedValue(false),
    setResizable: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock Tauri core invoke
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("Text Persistence Integration", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("renders loaded text from database (not just sampleText)", async () => {
    const persistedText = {
      rawInput: "測試持久化",
      segments: [
        { type: "word" as const, word: { characters: "測試", pinyin: "cèshì" } },
        { type: "word" as const, word: { characters: "持久化", pinyin: "chíjiǔhuà" } },
      ],
    };
    mockInvoke.mockResolvedValue(persistedText);

    render(<App />);

    // Wait for the loaded text to appear
    await waitFor(() => {
      expect(screen.getByText("測試")).toBeInTheDocument();
    });
    expect(screen.getByText("持久化")).toBeInTheDocument();
  });

  it("falls back to sampleText when load returns null (first launch)", async () => {
    mockInvoke.mockResolvedValue(null);

    const { container } = render(<App />);

    // sampleText should render — it contains ruby elements with Chinese characters
    await waitFor(() => {
      const rubies = container.querySelectorAll("ruby");
      expect(rubies.length).toBeGreaterThan(0);
    });

    // Verify sampleText's known content is present (字母 appears multiple times)
    const matches = screen.getAllByText("字母");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("falls back to sampleText when load errors (corrupted DB)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInvoke.mockRejectedValue("Database error: corrupted");

    const { container } = render(<App />);

    // Should still render sampleText
    await waitFor(() => {
      const rubies = container.querySelectorAll("ruby");
      expect(rubies.length).toBeGreaterThan(0);
    });

    consoleSpy.mockRestore();
  });
});
