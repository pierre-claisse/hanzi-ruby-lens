import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import type { TextPreview } from "./types/domain";

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

  it("renders library empty state when no texts exist", async () => {
    mockInvoke.mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no texts yet/i)).toBeInTheDocument();
    });
  });

  it("renders library with text previews", async () => {
    const previews: TextPreview[] = [
      { id: 1, title: "My Text", createdAt: "2026-02-23T12:00:00", tags: [] },
    ];
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "list_texts") return Promise.resolve(previews);
      if (cmd === "list_all_tags") return Promise.resolve([]);
      return Promise.resolve([]);
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("My Text")).toBeInTheDocument();
    });
  });

  it("renders TitleBar with title", async () => {
    mockInvoke.mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Hanzi Ruby Lens")).toBeInTheDocument();
    });
  });

  it("renders ThemeToggle button inside TitleBar", async () => {
    mockInvoke.mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      const themeToggleButton = screen.getByRole("button", {
        name: /switch to (light|dark) mode/i,
      });
      expect(themeToggleButton).toBeInTheDocument();
    });
  });

  it("renders add text button", async () => {
    mockInvoke.mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add text/i }),
      ).toBeInTheDocument();
    });
  });
});
