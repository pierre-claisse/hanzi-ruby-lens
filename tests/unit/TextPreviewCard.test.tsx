import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TextPreviewCard } from "../../src/components/TextPreviewCard";
import type { TextPreview } from "../../src/types/domain";

const basePreview: TextPreview = {
  id: 1,
  title: "Test Text",
  createdAt: "2026-01-15T10:30:00",
  modifiedAt: null,
  tags: [],
  locked: false,
};

describe("TextPreviewCard", () => {
  const defaultProps = {
    preview: basePreview,
    onClick: vi.fn(),
    onContextMenu: vi.fn(),
  };

  it("does not render an info icon", () => {
    render(<TextPreviewCard {...defaultProps} />);
    expect(screen.queryByLabelText("Details")).not.toBeInTheDocument();
  });

  it("does not render a lock toggle icon", () => {
    render(<TextPreviewCard {...defaultProps} preview={{ ...basePreview, locked: true }} />);
    expect(screen.queryByLabelText("Unlock text")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Lock text")).not.toBeInTheDocument();
  });

  it("applies bg-content/5 class when locked", () => {
    render(<TextPreviewCard {...defaultProps} preview={{ ...basePreview, locked: true }} />);
    const card = screen.getByRole("button");
    expect(card.className).toContain("bg-content/5");
  });

  it("applies bg-surface class when unlocked", () => {
    render(<TextPreviewCard {...defaultProps} preview={{ ...basePreview, locked: false }} />);
    const card = screen.getByRole("button");
    expect(card.className).toContain("bg-surface");
    expect(card.className).not.toMatch(/\bbg-content\/5\b.*\bbg-content\/5\b/);
  });
});
