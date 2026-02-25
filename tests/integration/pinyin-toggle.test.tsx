import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
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

const sampleText: Text = {
  id: 1,
  title: "Pinyin Test",
  createdAt: "2026-02-23T12:00:00",
  modifiedAt: null,
  rawInput: "你好世界",
  segments: [
    { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
    { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
  ],
};

const samplePreviews: TextPreview[] = [
  { id: 1, title: "Pinyin Test", createdAt: "2026-02-23T12:00:00", modifiedAt: null, tags: [] },
];

// Mock Tauri core invoke — route by command
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

/** Navigate from library to reading view by clicking a preview, wait for ruby elements */
async function navigateToReading(user: ReturnType<typeof userEvent.setup>, container: HTMLElement) {
  await waitFor(() => {
    expect(screen.getByText("Pinyin Test")).toBeInTheDocument();
  });
  await user.click(screen.getByText("Pinyin Test"));
  // Wait for reading view to render ruby elements
  await waitFor(() => {
    expect(container.querySelectorAll("rt").length).toBeGreaterThan(0);
  });
}

describe("Pinyin Toggle Integration", () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    mockInvoke.mockReset();
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "list_texts") return Promise.resolve(samplePreviews);
      if (cmd === "list_all_tags") return Promise.resolve([]);
      if (cmd === "load_text") return Promise.resolve(sampleText);
      return Promise.resolve(null);
    });

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

  // T016: End-to-end toggle flow (click → hide → click → show)
  it("toggles Pinyin visibility end-to-end", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await navigateToReading(user, container);

    // Wait for ruby elements
    await waitFor(() => {
      expect(container.querySelectorAll("rt").length).toBeGreaterThan(0);
    });

    // Find the Pinyin toggle button
    const pinyinToggle = screen.getByRole("button", { name: /hide pinyin/i });
    expect(pinyinToggle).toBeInTheDocument();

    // Initially, Pinyin should be visible (opacity-100)
    let rts = container.querySelectorAll("rt");
    rts.forEach((rt) => {
      expect(rt.className).toMatch(/opacity-100/);
    });

    // Click to hide Pinyin
    fireEvent.click(pinyinToggle);

    // Wait for state update and verify Pinyin is hidden (opacity-0)
    await vi.waitFor(() => {
      rts = container.querySelectorAll("rt");
      rts.forEach((rt) => {
        expect(rt.className).toMatch(/opacity-0/);
      });
    });

    // Verify button label changed
    expect(pinyinToggle).toHaveAttribute("aria-label", "Show Pinyin");

    // Click again to show Pinyin
    fireEvent.click(pinyinToggle);

    // Wait for state update and verify Pinyin is visible again
    await vi.waitFor(() => {
      rts = container.querySelectorAll("rt");
      rts.forEach((rt) => {
        expect(rt.className).toMatch(/opacity-100/);
      });
    });

    // Verify button label changed back
    expect(pinyinToggle).toHaveAttribute("aria-label", "Hide Pinyin");
  });

  // T017: Preference persists after simulated page reload
  it("persists Pinyin visibility preference across app reloads", async () => {
    const user = userEvent.setup();
    // First render: Default state (visible)
    let { container } = render(<App />);

    await navigateToReading(user, container);

    // Wait for ruby elements
    await waitFor(() => {
      expect(container.querySelectorAll("rt").length).toBeGreaterThan(0);
    });

    let pinyinToggle = screen.getByRole("button", { name: /hide pinyin/i });

    // Hide Pinyin
    fireEvent.click(pinyinToggle);

    // Wait for localStorage to be updated
    await vi.waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith("pinyinVisible", "false");
    });

    // Simulate page reload: cleanup and re-render
    cleanup();
    ({ container } = render(<App />));

    // Navigate to reading again
    await navigateToReading(user, container);

    // Wait for ruby elements
    await waitFor(() => {
      expect(container.querySelectorAll("rt").length).toBeGreaterThan(0);
    });

    pinyinToggle = screen.getByRole("button", { name: /show pinyin/i });

    // Verify Pinyin remains hidden after reload
    const rts = container.querySelectorAll("rt");
    rts.forEach((rt) => {
      expect(rt.className).toMatch(/opacity-0/);
    });

    // Verify button state matches
    expect(pinyinToggle).toHaveAttribute("aria-label", "Show Pinyin");
    expect(pinyinToggle).toHaveAttribute("aria-pressed", "false");
  });

  // T018: Multiple rapid toggles work correctly (no UI flicker)
  it("handles rapid toggles without UI flicker", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await navigateToReading(user, container);

    // Wait for ruby elements
    await waitFor(() => {
      expect(container.querySelectorAll("rt").length).toBeGreaterThan(0);
    });

    const pinyinToggle = screen.getByRole("button", { name: /hide pinyin/i });

    // Perform 5 rapid clicks
    for (let i = 0; i < 5; i++) {
      fireEvent.click(pinyinToggle);
    }

    // Wait for all state updates to settle
    await vi.waitFor(() => {
      const rts = container.querySelectorAll("rt");

      // After 5 toggles (odd number), Pinyin should be hidden
      rts.forEach((rt) => {
        expect(rt.className).toMatch(/opacity-0/);
      });
    });

    // Verify button is in correct state (hidden)
    expect(pinyinToggle).toHaveAttribute("aria-label", "Show Pinyin");
    expect(pinyinToggle).toHaveAttribute("aria-pressed", "false");

    // Verify <rt> elements are still in DOM (not removed)
    const rts = container.querySelectorAll("rt");
    expect(rts.length).toBeGreaterThan(0);
  });

  it("preserves Chinese characters in DOM during rapid toggles", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await navigateToReading(user, container);

    // Wait for ruby elements
    await waitFor(() => {
      expect(container.querySelectorAll("rt").length).toBeGreaterThan(0);
    });

    const pinyinToggle = screen.getByRole("button", { name: /hide pinyin/i });

    // Get initial Chinese character count
    const initialRubies = container.querySelectorAll("ruby");
    const initialCharacters = Array.from(initialRubies).map((ruby) => ruby.textContent);

    // Perform 10 rapid clicks
    for (let i = 0; i < 10; i++) {
      fireEvent.click(pinyinToggle);
    }

    // Verify Chinese characters are still present and unchanged
    const finalRubies = container.querySelectorAll("ruby");
    const finalCharacters = Array.from(finalRubies).map((ruby) => ruby.textContent);

    expect(initialCharacters).toEqual(finalCharacters);
    expect(finalRubies.length).toBe(initialRubies.length);
  });
});
