import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextPreviewCard } from "../../src/components/TextPreviewCard";
import { WordContextMenu } from "../../src/components/WordContextMenu";
import type { MenuEntry } from "../../src/components/WordContextMenu";
import { Lock, Pencil, Scissors, Combine } from "lucide-react";
import type { TextPreview } from "../../src/types/domain";

function makePreview(overrides: Partial<TextPreview> = {}): TextPreview {
  return {
    id: 1,
    title: "Test Text",
    createdAt: "2026-02-25T10:00:00",
    modifiedAt: null,
    tags: [],
    locked: false,
    comments: [],
    ...overrides,
  };
}

describe("TextPreviewCard lock visual", () => {
  it("shows locked tint when text is locked", () => {
    render(
      <TextPreviewCard
        preview={makePreview({ locked: true })}
        onClick={vi.fn()}
        onContextMenu={vi.fn()}
      />,
    );

    const card = screen.getByRole("button");
    expect(card.className).toContain("bg-content/5");
  });

  it("shows default background when text is unlocked", () => {
    render(
      <TextPreviewCard
        preview={makePreview({ locked: false })}
        onClick={vi.fn()}
        onContextMenu={vi.fn()}
      />,
    );

    const card = screen.getByRole("button");
    expect(card.className).toContain("bg-surface");
  });

  it("does not render a lock toggle button on the card", () => {
    render(
      <TextPreviewCard
        preview={makePreview({ locked: true })}
        onClick={vi.fn()}
        onContextMenu={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/lock/i)).not.toBeInTheDocument();
  });
});

describe("WordContextMenu disabled entries", () => {
  const baseEntries: MenuEntry[] = [
    { label: "Edit Pinyin", icon: Pencil, action: { type: "editPinyin" } },
    { label: "Split after 你", icon: Scissors, action: { type: "split", splitAfterIndex: 0 } },
    { label: "Merge with next word", icon: Combine, action: { type: "mergeWithNext" } },
  ];

  it("renders disabled entries with opacity and lock icon", () => {
    const disabledEntries: MenuEntry[] = baseEntries.map((e) => ({
      ...e,
      disabled: true,
      icon: Lock,
    }));

    const { container } = render(
      <WordContextMenu
        entries={disabledEntries}
        focusedIndex={-1}
        position={{ top: 0, left: 0 }}
        onEntryHover={vi.fn()}
        onAction={vi.fn()}
      />,
    );

    const items = container.querySelectorAll("[role='menuitem']");
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.className).toContain("opacity-40");
      expect(item.className).toContain("cursor-not-allowed");
    }
  });

  it("does not fire onAction when clicking a disabled entry", () => {
    const onAction = vi.fn();
    const disabledEntries: MenuEntry[] = baseEntries.map((e) => ({
      ...e,
      disabled: true,
      icon: Lock,
    }));

    const { container } = render(
      <WordContextMenu
        entries={disabledEntries}
        focusedIndex={-1}
        position={{ top: 0, left: 0 }}
        onEntryHover={vi.fn()}
        onAction={onAction}
      />,
    );

    const items = container.querySelectorAll("[role='menuitem']");
    fireEvent.click(items[0]);
    fireEvent.click(items[1]);
    fireEvent.click(items[2]);

    expect(onAction).not.toHaveBeenCalled();
  });

  it("keeps non-disabled entries functional", () => {
    const onAction = vi.fn();
    const mixedEntries: MenuEntry[] = [
      { label: "Copy", icon: Pencil, action: { type: "copy" } },
      { label: "Edit Pinyin", icon: Lock, action: { type: "editPinyin" }, disabled: true },
    ];

    const { container } = render(
      <WordContextMenu
        entries={mixedEntries}
        focusedIndex={-1}
        position={{ top: 0, left: 0 }}
        onEntryHover={vi.fn()}
        onAction={onAction}
      />,
    );

    const items = container.querySelectorAll("[role='menuitem']");
    fireEvent.click(items[0]); // Copy — enabled
    expect(onAction).toHaveBeenCalledOnce();

    fireEvent.click(items[1]); // Edit Pinyin — disabled
    expect(onAction).toHaveBeenCalledOnce(); // still 1
  });
});
