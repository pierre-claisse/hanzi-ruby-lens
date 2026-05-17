import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TitleBar } from "../../src/components/TitleBar";
import { PALETTES } from "../../src/data/palettes";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({
  writeText: vi.fn(),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setFullscreen: vi.fn().mockResolvedValue(undefined),
    isFullscreen: vi.fn().mockResolvedValue(false),
    setResizable: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

const baseProps = {
  appView: "library" as const,
  pinyinVisible: true,
  onPinyinToggle: vi.fn(),
  zoomLevel: 0,
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  isMinZoom: false,
  isMaxZoom: false,
  palettes: PALETTES,
  selectedPaletteId: "vermillion-scroll",
  onPaletteSelect: vi.fn(),
  theme: "light" as const,
  onThemeToggle: vi.fn(),
  onAddText: vi.fn(),
  onManageTags: vi.fn(),
  tags: [],
  filterTagIds: [] as number[],
  onFilterTagIds: vi.fn(),
  sortAsc: true,
  onToggleSort: vi.fn(),
  onDataImportComplete: vi.fn(),
  onDataResetComplete: vi.fn(),
};

describe("TitleBar device authorization", () => {
  it("hides DataManagementDropdown when isAuthorizedDevice is false", () => {
    render(<TitleBar {...baseProps} isAuthorizedDevice={false} />);
    expect(screen.queryByLabelText("Data management")).not.toBeInTheDocument();
  });

  it("shows DataManagementDropdown when isAuthorizedDevice is true", () => {
    render(<TitleBar {...baseProps} isAuthorizedDevice={true} />);
    expect(screen.getByLabelText("Data management")).toBeInTheDocument();
  });
});
