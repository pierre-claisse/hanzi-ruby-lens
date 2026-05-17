import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LibraryScreen } from "../../src/components/LibraryScreen";
import type { TextPreview, Tag } from "../../src/types/domain";

const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

const sampleTags: Tag[] = [
  { id: 1, label: "Grammar", color: "blue" },
];

const unlockedPreview: TextPreview = {
  id: 1,
  title: "Unlocked Text",
  createdAt: "2026-01-15T10:30:00",
  modifiedAt: "2026-02-20T14:45:00",
  tags: [],
  locked: false,
  comments: [],
};

const lockedPreview: TextPreview = {
  id: 2,
  title: "Locked Text",
  createdAt: "2026-03-01T08:00:00",
  modifiedAt: null,
  tags: [],
  locked: true,
  comments: [],
};

const defaultProps = {
  onOpenText: vi.fn(),
  onDeleteText: vi.fn(),
  onToggleLock: vi.fn(),
  tags: sampleTags,
  onTagsChanged: vi.fn().mockResolvedValue(undefined),
  filterActive: false,
  isAuthorizedDevice: true,
};

function renderAndOpenContextMenu(previews: TextPreview[], targetIndex = 0) {
  render(<LibraryScreen previews={previews} {...defaultProps} />);
  const cards = screen.getAllByRole("button");
  fireEvent.contextMenu(cards[targetIndex]);
}

describe("LibraryScreen context menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("metadata header (US1)", () => {
    it("displays Created date for right-clicked card", () => {
      renderAndOpenContextMenu([unlockedPreview]);
      expect(screen.getByText("Created: 2026-01-15 10:30")).toBeInTheDocument();
    });

    it("displays Modified date when present", () => {
      renderAndOpenContextMenu([unlockedPreview]);
      expect(screen.getByText("Modified: 2026-02-20 14:45")).toBeInTheDocument();
    });

    it("omits Modified date when null", () => {
      renderAndOpenContextMenu([lockedPreview]);
      expect(screen.getByText("Created: 2026-03-01 08:00")).toBeInTheDocument();
      expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument();
    });
  });

  describe("Lock/Unlock entry (US2)", () => {
    it("shows 'Lock' when right-clicked card is unlocked", () => {
      renderAndOpenContextMenu([unlockedPreview]);
      expect(screen.getByText("Lock")).toBeInTheDocument();
    });

    it("shows 'Unlock' when right-clicked card is locked", () => {
      renderAndOpenContextMenu([lockedPreview]);
      expect(screen.getByText("Unlock")).toBeInTheDocument();
    });

    it("shows 'Lock' when multi-selected cards have mixed lock states", () => {
      render(<LibraryScreen previews={[unlockedPreview, lockedPreview]} {...defaultProps} />);
      const cards = screen.getAllByRole("button");
      // Ctrl+click to multi-select both cards
      fireEvent.click(cards[0], { ctrlKey: true });
      fireEvent.click(cards[1], { ctrlKey: true });
      // Right-click on first card (which is in selection)
      fireEvent.contextMenu(cards[0]);
      expect(screen.getByText("Lock")).toBeInTheDocument();
    });

    it("shows 'Unlock' when all multi-selected cards are locked", () => {
      const locked2: TextPreview = { ...lockedPreview, id: 3, title: "Locked 2" };
      render(<LibraryScreen previews={[lockedPreview, locked2]} {...defaultProps} />);
      const cards = screen.getAllByRole("button");
      fireEvent.click(cards[0], { ctrlKey: true });
      fireEvent.click(cards[1], { ctrlKey: true });
      fireEvent.contextMenu(cards[0]);
      expect(screen.getByText("Unlock")).toBeInTheDocument();
    });

    it("appears after Tags and before Delete in menu order", () => {
      renderAndOpenContextMenu([unlockedPreview]);
      const menu = screen.getByRole("menu");
      const items = menu.querySelectorAll('[role="menuitem"]');
      // Items: Tags, Lock, Delete
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent("Tags");
      expect(items[1]).toHaveTextContent("Lock");
      expect(items[2]).toHaveTextContent("Delete");
    });
  });

  describe("device authorization", () => {
    it("hides Delete when isAuthorizedDevice is false", () => {
      render(<LibraryScreen previews={[unlockedPreview]} {...defaultProps} isAuthorizedDevice={false} />);
      const cards = screen.getAllByRole("button");
      fireEvent.contextMenu(cards[0]);
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });

    it("shows Delete when isAuthorizedDevice is true", () => {
      renderAndOpenContextMenu([unlockedPreview]);
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });
});
