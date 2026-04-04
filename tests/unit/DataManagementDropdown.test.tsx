import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataManagementDropdown } from "../../src/components/DataManagementDropdown";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
  open: vi.fn(),
  message: vi.fn(),
  confirm: vi.fn(),
}));

describe("DataManagementDropdown", () => {
  it("renders Reset entry in red and Export/Import in normal styling", () => {
    render(
      <DataManagementDropdown
        onImportComplete={vi.fn()}
        onResetComplete={vi.fn()}
      />,
    );

    // Open the dropdown
    fireEvent.click(screen.getByLabelText("Data management"));

    const exportOption = screen.getByText("Export");
    const importOption = screen.getByText("Import");
    const resetOption = screen.getByText("Reset");

    expect(resetOption.className).toContain("text-red-500");
    expect(exportOption.className).not.toContain("text-red-500");
    expect(importOption.className).not.toContain("text-red-500");
  });
});
