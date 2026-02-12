import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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

describe("App", () => {
  it("renders TextDisplay with sample data containing ruby elements", () => {
    const { container } = render(<App />);
    const rubies = container.querySelectorAll("ruby");
    expect(rubies.length).toBeGreaterThan(0);
  });

  // T015: Updated to expect 4 buttons (Pinyin, Theme, Fullscreen, Close)
  it("renders TitleBar with title and four buttons", () => {
    render(<App />);

    // Check title
    const title = screen.getByText("Hanzi Ruby Lens");
    expect(title).toBeInTheDocument();

    // Check buttons (Pinyin, Theme, Fullscreen, Close)
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
  });

  it("renders ThemeToggle button inside TitleBar", () => {
    render(<App />);
    const themeToggleButton = screen.getByRole("button", {
      name: /switch to (light|dark) mode/i,
    });
    expect(themeToggleButton).toBeInTheDocument();
  });
});
