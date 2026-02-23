import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";
import type { Text, TextPreview } from "../../src/types/domain";

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

const sampleText: Text = {
  id: 1,
  title: "持久化測試",
  createdAt: "2026-02-23T12:00:00",
  rawInput: "測試持久化",
  segments: [
    { type: "word", word: { characters: "測試", pinyin: "cèshì" } },
    { type: "word", word: { characters: "持久化", pinyin: "chíjiǔhuà" } },
  ],
};

const samplePreviews: TextPreview[] = [
  { id: 1, title: "持久化測試", createdAt: "2026-02-23T12:00:00" },
];

describe("Text Persistence Integration", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("renders library with persisted text previews", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "list_texts") return Promise.resolve(samplePreviews);
      return Promise.resolve(null);
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("持久化測試")).toBeInTheDocument();
    });
  });

  it("opens text from library and renders reading view with content", async () => {
    const user = userEvent.setup();
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "list_texts") return Promise.resolve(samplePreviews);
      if (cmd === "load_text") return Promise.resolve(sampleText);
      return Promise.resolve(null);
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("持久化測試")).toBeInTheDocument();
    });

    await user.click(screen.getByText("持久化測試"));

    await waitFor(() => {
      expect(screen.getByText("測試")).toBeInTheDocument();
    });
    expect(screen.getByText("持久化")).toBeInTheDocument();
  });

  it("shows library empty state when no texts exist (first launch)", async () => {
    mockInvoke.mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no texts yet/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /add text/i }),
    ).toBeInTheDocument();
  });

  it("shows library empty state when load errors (corrupted DB)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInvoke.mockRejectedValue("Database error: corrupted");

    render(<App />);

    await waitFor(() => {
      // Library should still render (with empty previews) after error
      expect(
        screen.getByRole("button", { name: /add text/i }),
      ).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
