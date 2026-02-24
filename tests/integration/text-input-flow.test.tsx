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
  title: "Test Title",
  createdAt: "2026-02-23T12:00:00",
  rawInput: "你好世界",
  segments: [
    { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
    { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
  ],
};

const samplePreviews: TextPreview[] = [
  { id: 1, title: "Test Title", createdAt: "2026-02-23T12:00:00", tags: [] },
];

describe("Multi-Text Library Flow", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  // ── US1: Library Screen ──

  describe("US1: Library Screen", () => {
    it("shows library with text previews on launch", async () => {
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "list_texts") return Promise.resolve(samplePreviews);
        if (cmd === "list_all_tags") return Promise.resolve([]);
        return Promise.resolve(null);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Test Title")).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /add text/i }),
      ).toBeInTheDocument();
    });

    it("shows empty state with add button when no texts exist", async () => {
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "list_texts") return Promise.resolve([]);
        if (cmd === "list_all_tags") return Promise.resolve([]);
        return Promise.resolve(null);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/no texts yet/i)).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /add text/i }),
      ).toBeInTheDocument();
    });
  });

  // ── US2: Add Text ──

  describe("US2: Add Text", () => {
    it("add button navigates to input view with title and content fields", async () => {
      const user = userEvent.setup();
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "list_texts") return Promise.resolve([]);
        if (cmd === "list_all_tags") return Promise.resolve([]);
        return Promise.resolve(null);
      });

      render(<App />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /add text/i }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /add text/i }));

      // Should have title input and content textarea
      expect(screen.getByPlaceholderText("Title")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/在此輸入或貼上中文/),
      ).toBeInTheDocument();
    });

    it("submit creates text and transitions to reading view", async () => {
      const user = userEvent.setup();
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "list_texts") return Promise.resolve([]);
        if (cmd === "list_all_tags") return Promise.resolve([]);
        if (cmd === "create_text") return Promise.resolve(sampleText);
        return Promise.resolve(null);
      });

      render(<App />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /add text/i }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /add text/i }));

      await user.type(screen.getByPlaceholderText("Title"), "Test Title");
      await user.type(
        screen.getByPlaceholderText(/在此輸入或貼上中文/),
        "你好世界",
      );

      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("create_text", {
          title: "Test Title",
          rawInput: "你好世界",
        });
      });
    });

    it("submit button is disabled without title or Chinese content", async () => {
      const user = userEvent.setup();
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "list_texts") return Promise.resolve([]);
        if (cmd === "list_all_tags") return Promise.resolve([]);
        return Promise.resolve(null);
      });

      render(<App />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /add text/i }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /add text/i }));

      // Submit should be disabled initially
      expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();

      // Type only title — still disabled
      await user.type(screen.getByPlaceholderText("Title"), "Title");
      expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
    });

    it("cancel returns to library", async () => {
      const user = userEvent.setup();
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "list_texts") return Promise.resolve([]);
        if (cmd === "list_all_tags") return Promise.resolve([]);
        return Promise.resolve(null);
      });

      render(<App />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /add text/i }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /add text/i }));
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.getByText(/no texts yet/i)).toBeInTheDocument();
      });
    });
  });

  // ── US3: Read Text ──

  describe("US3: Read Text", () => {
    it("clicking a preview opens the reading view", async () => {
      const user = userEvent.setup();
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "list_texts") return Promise.resolve(samplePreviews);
        if (cmd === "list_all_tags") return Promise.resolve([]);
        if (cmd === "load_text") return Promise.resolve(sampleText);
        return Promise.resolve(null);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Test Title")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Test Title"));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("load_text", { textId: 1 });
      });
    });

    it("back button returns to library", async () => {
      const user = userEvent.setup();
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "list_texts") return Promise.resolve(samplePreviews);
        if (cmd === "list_all_tags") return Promise.resolve([]);
        if (cmd === "load_text") return Promise.resolve(sampleText);
        return Promise.resolve(null);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText("Test Title")).toBeInTheDocument();
      });

      // Open a text
      await user.click(screen.getByText("Test Title"));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /back to library/i }),
        ).toBeInTheDocument();
      });

      // Click back
      await user.click(
        screen.getByRole("button", { name: /back to library/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /add text/i }),
        ).toBeInTheDocument();
      });
    });
  });
});
