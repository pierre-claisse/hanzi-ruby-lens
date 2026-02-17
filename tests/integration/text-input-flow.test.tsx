import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("Text Input Flow", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  // ── US1: Empty State ──

  describe("US1: Empty State", () => {
    it("shows empty state with purpose text and CTA when no text saved", async () => {
      mockInvoke.mockResolvedValue(null);

      render(<App />);

      await waitFor(() => {
        expect(
          screen.getByText(/paste chinese text to read with pinyin annotations/i),
        ).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: /enter text/i })).toBeInTheDocument();
    });

    it("CTA button transitions to input view", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValue(null);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /enter text/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /enter text/i }));

      // Input view should now be visible (textarea)
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });

  // ── US2: Text Entry and Submission ──

  describe("US2: Text Entry and Submission", () => {
    it("submits text and transitions to processing state", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValue(null); // initial load: empty

      render(<App />);

      // Navigate to input view
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /enter text/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /enter text/i }));

      // Type text and submit
      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "你好世界");

      // Mock save_text to succeed, process_text to return processed text
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "save_text") return Promise.resolve(undefined);
        if (cmd === "process_text")
          return Promise.resolve({
            rawInput: "你好世界",
            segments: [
              { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
              { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
            ],
          });
        return Promise.resolve(null);
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));

      // Verify save_text was called with correct payload
      expect(mockInvoke).toHaveBeenCalledWith("save_text", {
        text: { rawInput: "你好世界", segments: [] },
      });

      // Should invoke process_text
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("process_text", {
          rawInput: "你好世界",
        });
      });
    });

    it("accepts empty submit (FR-005)", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValue(null); // initial load: empty

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /enter text/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /enter text/i }));

      // Submit with empty textarea
      mockInvoke.mockResolvedValue(undefined);
      await user.click(screen.getByRole("button", { name: /submit/i }));

      // Empty submit should go to empty state
      expect(mockInvoke).toHaveBeenCalledWith("save_text", {
        text: { rawInput: "", segments: [] },
      });
    });

    it("shows error on save failure and preserves input (FR-010)", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValue(null); // initial load: empty

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /enter text/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /enter text/i }));

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "失敗測試");

      // Make save fail
      mockInvoke.mockRejectedValue("Database write failed");
      await user.click(screen.getByRole("button", { name: /submit/i }));

      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Input should be preserved
      expect(screen.getByRole("textbox")).toHaveValue("失敗測試");
    });

    it("cancel returns to empty state when coming from empty", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValue(null);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /enter text/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /enter text/i }));

      // Cancel
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Should return to empty state
      await waitFor(() => {
        expect(
          screen.getByText(/paste chinese text to read with pinyin annotations/i),
        ).toBeInTheDocument();
      });
    });
  });

  // ── US3: Edit Existing Text ──

  describe("US3: Edit Existing Text", () => {
    it("edit from processing state pre-fills textarea with rawInput", async () => {
      const user = userEvent.setup();
      const unprocessedText = { rawInput: "已保存的文字", segments: [] };
      mockInvoke.mockResolvedValue(unprocessedText);

      render(<App />);

      // Should show processing state (idle: text saved, ready to process)
      await waitFor(() => {
        expect(screen.getByText(/text saved, ready to process/i)).toBeInTheDocument();
      });

      // Click edit
      await user.click(screen.getByRole("button", { name: /^edit$/i }));

      // Textarea should be pre-filled
      expect(screen.getByRole("textbox")).toHaveValue("已保存的文字");
    });

    it("modified text replaces previous on submit", async () => {
      const user = userEvent.setup();
      const unprocessedText = { rawInput: "舊文字", segments: [] };
      mockInvoke.mockResolvedValue(unprocessedText);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/text saved, ready to process/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /^edit$/i }));

      const textarea = screen.getByRole("textbox");
      await user.clear(textarea);
      await user.type(textarea, "新文字");

      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "save_text") return Promise.resolve(undefined);
        if (cmd === "process_text")
          return Promise.resolve({
            rawInput: "新文字",
            segments: [
              { type: "word", word: { characters: "新", pinyin: "xīn" } },
              { type: "word", word: { characters: "文字", pinyin: "wénzì" } },
            ],
          });
        return Promise.resolve(null);
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(mockInvoke).toHaveBeenCalledWith("save_text", {
        text: { rawInput: "新文字", segments: [] },
      });
    });

    it("cancel from edit restores processing state without changes", async () => {
      const user = userEvent.setup();
      const unprocessedText = { rawInput: "不要改", segments: [] };
      mockInvoke.mockResolvedValue(unprocessedText);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/text saved, ready to process/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /^edit$/i }));
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Should return to processing state
      await waitFor(() => {
        expect(screen.getByText(/text saved, ready to process/i)).toBeInTheDocument();
      });
    });
  });

  // ── US4: Processing Flow (016-pinyin-segmentation) ──

  describe("US4: Processing Flow", () => {
    it("submit triggers save then process_text invocation", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValue(null); // initial load: empty

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /enter text/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /enter text/i }));

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "測試");

      const processedText = {
        rawInput: "測試",
        segments: [{ type: "word", word: { characters: "測試", pinyin: "cèshì" } }],
      };

      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "save_text") return Promise.resolve(undefined);
        if (cmd === "process_text") return Promise.resolve(processedText);
        return Promise.resolve(null);
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("process_text", { rawInput: "測試" });
      });
    });

    it("shows processing error when process_text fails", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValue(null); // initial load: empty

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /enter text/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /enter text/i }));

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "失敗");

      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "save_text") return Promise.resolve(undefined);
        if (cmd === "process_text")
          return Promise.reject("Processing error: Claude CLI not found");
        return Promise.resolve(null);
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/claude cli not found/i)).toBeInTheDocument();
      });

      // Retry and Edit buttons should be visible
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
    });

    it("retry re-invokes process_text after failure", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValue(null); // initial load: empty

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /enter text/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /enter text/i }));

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "重試");

      // First: save succeeds, process fails
      let processCallCount = 0;
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "save_text") return Promise.resolve(undefined);
        if (cmd === "process_text") {
          processCallCount++;
          if (processCallCount === 1) {
            return Promise.reject("Processing failed. Please try again.");
          }
          return Promise.resolve({
            rawInput: "重試",
            segments: [{ type: "word", word: { characters: "重試", pinyin: "chóngshì" } }],
          });
        }
        return Promise.resolve(null);
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      });

      // Click retry
      await user.click(screen.getByRole("button", { name: /retry/i }));

      // Should call process_text again
      await waitFor(() => {
        expect(processCallCount).toBe(2);
      });
    });

    it("edit from error state navigates to input with preserved text", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValue(null); // initial load: empty

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /enter text/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /enter text/i }));

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "編輯");

      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "save_text") return Promise.resolve(undefined);
        if (cmd === "process_text")
          return Promise.reject("Processing failed. Please try again.");
        return Promise.resolve(null);
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
      });

      // Click edit
      await user.click(screen.getByRole("button", { name: /^edit$/i }));

      // Should go to input view with preserved rawInput
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toHaveValue("編輯");
      });
    });

    it("app restart with unprocessed text shows process button (Scenario 5)", async () => {
      // Simulate loading text that was saved but never processed
      const unprocessedText = { rawInput: "未處理的文字", segments: [] };
      mockInvoke.mockResolvedValue(unprocessedText);

      render(<App />);

      // Should show idle processing state with Process button
      await waitFor(() => {
        expect(screen.getByText(/text saved, ready to process/i)).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: /process/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
    });

    it("process button triggers processing on restart (Scenario 5)", async () => {
      const user = userEvent.setup();
      const unprocessedText = { rawInput: "未處理", segments: [] };
      mockInvoke.mockResolvedValue(unprocessedText);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /process/i })).toBeInTheDocument();
      });

      // Mock process_text for success
      mockInvoke.mockImplementation((cmd: string) => {
        if (cmd === "process_text")
          return Promise.resolve({
            rawInput: "未處理",
            segments: [
              { type: "word", word: { characters: "未", pinyin: "wèi" } },
              { type: "word", word: { characters: "處理", pinyin: "chǔlǐ" } },
            ],
          });
        return Promise.resolve(unprocessedText);
      });

      await user.click(screen.getByRole("button", { name: /process/i }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("process_text", { rawInput: "未處理" });
      });
    });
  });
});
