import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TextDisplay } from "../../src/components/TextDisplay";
import type { Text } from "../../src/types/domain";

const testText: Text = {
  segments: [
    { type: "word", word: { characters: "我", pinyin: "wǒ" } },
    { type: "plain", text: "，" },
    { type: "word", word: { characters: "現在", pinyin: "xiànzài" } },
    { type: "word", word: { characters: "覺得", pinyin: "juéde" } },
  ],
};

function getRubyElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll("ruby"));
}

function hasHighlight(el: Element) {
  return el.className.includes("bg-accent/24") && !el.className.includes("hover:bg-accent/24");
}

function hasHoverHighlight(el: Element) {
  return el.className.includes("hover:bg-accent/24");
}

describe("Text Keyboard Navigation Integration", () => {
  // --- US1: Word Navigation ---

  it("highlights first word when text area receives focus", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[0])).toBe(true);
    expect(hasHighlight(rubies[1])).toBe(false);
    expect(hasHighlight(rubies[2])).toBe(false);
  });

  it("uses CSS hover when text area is not focused", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const rubies = getRubyElements(container);

    // All words should have hover:bg-accent/24 when unfocused
    rubies.forEach((ruby) => {
      expect(hasHoverHighlight(ruby)).toBe(true);
    });
  });

  it("moves highlight forward on ArrowRight", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "ArrowRight" });

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[0])).toBe(false);
    expect(hasHighlight(rubies[1])).toBe(true);
  });

  it("moves highlight backward on ArrowLeft", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "ArrowRight" });
    fireEvent.keyDown(textArea, { key: "ArrowLeft" });

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[0])).toBe(true);
  });

  it("does not wrap past the first word on ArrowLeft", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "ArrowLeft" });

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[0])).toBe(true);
  });

  it("does not wrap past the last word on ArrowRight", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    // Navigate to end (3 words)
    fireEvent.keyDown(textArea, { key: "ArrowRight" });
    fireEvent.keyDown(textArea, { key: "ArrowRight" });
    fireEvent.keyDown(textArea, { key: "ArrowRight" });
    fireEvent.keyDown(textArea, { key: "ArrowRight" });

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[2])).toBe(true);
  });

  it("updates tracked position on mouse hover", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);

    const rubies = getRubyElements(container);
    fireEvent.mouseEnter(rubies[2]); // Hover over third word

    expect(hasHighlight(rubies[2])).toBe(true);
    expect(hasHighlight(rubies[0])).toBe(false);
  });

  it("arrow navigation continues from mouse-hovered word", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);

    const rubies = getRubyElements(container);
    fireEvent.mouseEnter(rubies[1]); // Hover second word (index 1)
    fireEvent.keyDown(textArea, { key: "ArrowRight" });

    expect(hasHighlight(rubies[2])).toBe(true);
  });

  it("Space does nothing", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: " " });

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[0])).toBe(true);
  });

  it("restores CSS hover when focus is lost", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.blur(textArea);

    const rubies = getRubyElements(container);
    rubies.forEach((ruby) => {
      expect(hasHoverHighlight(ruby)).toBe(true);
    });
  });

  // --- US2: Context Menu ---

  it("opens context menu on Enter", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });

    const menu = container.querySelector("[role='menu']");
    expect(menu).toBeInTheDocument();

    const items = container.querySelectorAll("[role='menuitem']");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Option 1");
    expect(items[1]).toHaveTextContent("Option 2");
  });

  it("opens context menu on right-click", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);

    const rubies = getRubyElements(container);
    fireEvent.contextMenu(rubies[1]);

    const menu = container.querySelector("[role='menu']");
    expect(menu).toBeInTheDocument();
    expect(hasHighlight(rubies[1])).toBe(true);
  });

  it("navigates menu entries with ArrowDown (wrapping)", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });

    const items = container.querySelectorAll("[role='menuitem']");

    // First entry is focused by default (bg-content/10)
    expect(items[0].className).toContain("bg-content/10");

    // ArrowDown → second entry
    fireEvent.keyDown(textArea, { key: "ArrowDown" });
    expect(items[1].className).toContain("bg-content/10");
    expect(items[0].className).not.toContain("bg-content/10");

    // ArrowDown again → wraps to first
    fireEvent.keyDown(textArea, { key: "ArrowDown" });
    expect(items[0].className).toContain("bg-content/10");
  });

  it("navigates menu entries with ArrowUp (wrapping)", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });

    const items = container.querySelectorAll("[role='menuitem']");

    // ArrowUp from first → wraps to last
    fireEvent.keyDown(textArea, { key: "ArrowUp" });
    expect(items[1].className).toContain("bg-content/10");
  });

  it("Enter on menu entry does nothing (menu stays open)", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu
    fireEvent.keyDown(textArea, { key: "Enter" }); // no-op on entry

    const menu = container.querySelector("[role='menu']");
    expect(menu).toBeInTheDocument();
  });

  it("Escape does nothing (menu stays open)", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });
    fireEvent.keyDown(textArea, { key: "Escape" });

    const menu = container.querySelector("[role='menu']");
    expect(menu).toBeInTheDocument();
  });

  it("ArrowLeft closes menu and shifts word left", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "ArrowRight" }); // move to second word
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu
    fireEvent.keyDown(textArea, { key: "ArrowLeft" }); // close menu + navigate left

    const menu = container.querySelector("[role='menu']");
    expect(menu).not.toBeInTheDocument();

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[0])).toBe(true);
  });

  it("ArrowRight closes menu and shifts word right", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu on first word
    fireEvent.keyDown(textArea, { key: "ArrowRight" }); // close menu + navigate right

    const menu = container.querySelector("[role='menu']");
    expect(menu).not.toBeInTheDocument();

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[1])).toBe(true);
  });

  it("right-click on different word opens menu for that word", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);

    const rubies = getRubyElements(container);
    fireEvent.contextMenu(rubies[2]); // right-click on third word

    expect(hasHighlight(rubies[2])).toBe(true);

    const menu = container.querySelector("[role='menu']");
    expect(menu).toBeInTheDocument();
  });

  it("mouse hover on menu entry highlights it (FR-020)", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });

    const items = container.querySelectorAll("[role='menuitem']");
    expect(items[0].className).toContain("bg-content/10");

    fireEvent.mouseEnter(items[1]); // hover second entry

    expect(items[1].className).toContain("bg-content/10");
    expect(items[0].className).not.toContain("bg-content/10");
  });

  it("mouse hover on different word closes menu (FR-019)", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu on first word

    const menu = container.querySelector("[role='menu']");
    expect(menu).toBeInTheDocument();

    const rubies = getRubyElements(container);
    fireEvent.mouseEnter(rubies[1]); // hover second word

    expect(container.querySelector("[role='menu']")).not.toBeInTheDocument();
    expect(hasHighlight(rubies[1])).toBe(true);
  });

  it("mouse hover on same word keeps menu open", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu on first word

    const rubies = getRubyElements(container);
    fireEvent.mouseEnter(rubies[0]); // hover same word

    expect(container.querySelector("[role='menu']")).toBeInTheDocument();
  });

  it("text area is focusable via tabIndex", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    expect(textArea.getAttribute("tabindex")).toBe("0");
  });
});
