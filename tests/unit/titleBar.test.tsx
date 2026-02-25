import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TitleBar } from "../../src/components/TitleBar";

// Mock Tauri window API
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setFullscreen: vi.fn().mockResolvedValue(undefined),
    isFullscreen: vi.fn().mockResolvedValue(false),
    setResizable: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

const defaultProps = {
  pinyinVisible: true,
  onPinyinToggle: vi.fn(),
  zoomLevel: 100,
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  isMinZoom: false,
  isMaxZoom: false,
  palettes: [] as const,
  selectedPaletteId: "default",
  onPaletteSelect: vi.fn(),
  theme: "light" as const,
  onThemeToggle: vi.fn(),
};

describe("TitleBar — US2: Library title", () => {
  it("renders titleText='Library' in the h1", () => {
    render(<TitleBar {...defaultProps} titleText="Library" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Library");
    expect(heading).not.toHaveTextContent("Hanzi Ruby Lens");
  });
});

describe("TitleBar — US3: Reading view title", () => {
  it("renders titleText with Chinese text in the h1", () => {
    render(<TitleBar {...defaultProps} titleText="三國演義" showBack />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("三國演義");
  });

  it("does not render a centered absolute-positioned title element", () => {
    render(<TitleBar {...defaultProps} titleText="三國演義" showBack />);

    // There should be no element with the centered positioning classes
    const centeredElements = document.querySelectorAll(".absolute.left-1\\/2.-translate-x-1\\/2");
    // The only absolute-centered element allowed is the filter bar (showAddButton), not a text title
    for (const el of centeredElements) {
      expect(el.textContent).not.toBe("三國演義");
    }
  });

  it("title appears before the zoom indicator in the DOM", () => {
    render(<TitleBar {...defaultProps} titleText="三國演義" showBack />);

    const heading = screen.getByRole("heading", { level: 1 });
    const zoomIndicator = screen.getByText("(100%)");

    // heading should come before zoom indicator in DOM order
    const headingPos = heading.compareDocumentPosition(zoomIndicator);
    // Node.DOCUMENT_POSITION_FOLLOWING = 4
    expect(headingPos & 4).toBe(4);
  });
});
