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
    it("submits text and transitions to saved state", async () => {
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

      mockInvoke.mockResolvedValue(undefined); // save response
      await user.click(screen.getByRole("button", { name: /submit/i }));

      // Verify save_text was called with correct payload
      expect(mockInvoke).toHaveBeenCalledWith("save_text", {
        text: { rawInput: "你好世界", segments: [] },
      });

      // Should show saved state
      await waitFor(() => {
        expect(screen.getByText(/text saved/i)).toBeInTheDocument();
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
    it("edit from saved state pre-fills textarea with rawInput", async () => {
      const user = userEvent.setup();
      const savedText = { rawInput: "已保存的文字", segments: [] };
      mockInvoke.mockResolvedValue(savedText);

      render(<App />);

      // Should show saved state
      await waitFor(() => {
        expect(screen.getByText(/text saved/i)).toBeInTheDocument();
      });

      // Click edit
      await user.click(screen.getByRole("button", { name: /^edit$/i }));

      // Textarea should be pre-filled
      expect(screen.getByRole("textbox")).toHaveValue("已保存的文字");
    });

    it("modified text replaces previous on submit", async () => {
      const user = userEvent.setup();
      const savedText = { rawInput: "舊文字", segments: [] };
      mockInvoke.mockResolvedValue(savedText);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/text saved/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /^edit$/i }));

      const textarea = screen.getByRole("textbox");
      await user.clear(textarea);
      await user.type(textarea, "新文字");

      mockInvoke.mockResolvedValue(undefined);
      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(mockInvoke).toHaveBeenCalledWith("save_text", {
        text: { rawInput: "新文字", segments: [] },
      });
    });

    it("cancel from edit restores saved state without changes", async () => {
      const user = userEvent.setup();
      const savedText = { rawInput: "不要改", segments: [] };
      mockInvoke.mockResolvedValue(savedText);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/text saved/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /^edit$/i }));
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Should return to saved state
      await waitFor(() => {
        expect(screen.getByText(/text saved/i)).toBeInTheDocument();
      });
    });
  });
});
