import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";

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

describe("App", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("renders empty state when no text saved", async () => {
    mockInvoke.mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText(/paste chinese text to read with pinyin annotations/i),
      ).toBeInTheDocument();
    });
  });

  it("renders TextDisplay with ruby elements when text has segments", async () => {
    mockInvoke.mockResolvedValue({
      rawInput: "你好世界",
      segments: [
        { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
        { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
      ],
    });

    const { container } = render(<App />);

    await waitFor(() => {
      const rubies = container.querySelectorAll("ruby");
      expect(rubies.length).toBeGreaterThan(0);
    });
  });

  it("renders TitleBar with title", async () => {
    mockInvoke.mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Hanzi Ruby Lens")).toBeInTheDocument();
    });
  });

  it("renders ThemeToggle button inside TitleBar", async () => {
    mockInvoke.mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      const themeToggleButton = screen.getByRole("button", {
        name: /switch to (light|dark) mode/i,
      });
      expect(themeToggleButton).toBeInTheDocument();
    });
  });
});
