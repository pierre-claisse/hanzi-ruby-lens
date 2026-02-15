import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TextDisplay } from "../../src/components/TextDisplay";
import type { Text } from "../../src/types/domain";

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({
  writeText: vi.fn(),
}));

import { openUrl } from "@tauri-apps/plugin-opener";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("opens context menu on Enter with MOE Dictionary, Google Translate, and Copy entries", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });

    const menu = container.querySelector("[role='menu']");
    expect(menu).toBeInTheDocument();

    const items = container.querySelectorAll("[role='menuitem']");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("MOE Dictionary");
    expect(items[1]).toHaveTextContent("Google Translate");
    expect(items[2]).toHaveTextContent("Copy");
  });

  it("renders icons in menu entries", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });

    const items = container.querySelectorAll("[role='menuitem']");
    // Each entry should contain an SVG icon
    items.forEach((item) => {
      expect(item.querySelector("svg")).toBeInTheDocument();
    });
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

  it("navigates menu entries with ArrowDown (wrapping over 3 entries)", () => {
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

    // ArrowDown → third entry
    fireEvent.keyDown(textArea, { key: "ArrowDown" });
    expect(items[2].className).toContain("bg-content/10");
    expect(items[1].className).not.toContain("bg-content/10");

    // ArrowDown again → wraps to first
    fireEvent.keyDown(textArea, { key: "ArrowDown" });
    expect(items[0].className).toContain("bg-content/10");
  });

  it("navigates menu entries with ArrowUp (wrapping over 3 entries)", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });

    const items = container.querySelectorAll("[role='menuitem']");

    // ArrowUp from first → wraps to last (third entry)
    fireEvent.keyDown(textArea, { key: "ArrowUp" });
    expect(items[2].className).toContain("bg-content/10");
  });

  it("Enter on MOE Dictionary triggers openUrl and closes menu", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu on first word ("我")
    fireEvent.keyDown(textArea, { key: "Enter" }); // activate "MOE Dictionary"

    expect(openUrl).toHaveBeenCalledWith(
      `https://dict.revised.moe.edu.tw/search.jsp?md=1&word=${encodeURIComponent("我")}&qMd=0&qCol=1&sound=1#radio_sound_1`
    );

    const menu = container.querySelector("[role='menu']");
    expect(menu).not.toBeInTheDocument();
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

  it("mouse hover on different word keeps menu open (014-ux-bugfixes)", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu on first word

    const menu = container.querySelector("[role='menu']");
    expect(menu).toBeInTheDocument();

    const rubies = getRubyElements(container);
    fireEvent.mouseEnter(rubies[1]); // hover second word

    expect(container.querySelector("[role='menu']")).toBeInTheDocument();
    expect(hasHighlight(rubies[0])).toBe(true);
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

  // --- US3: Context Menu Actions (Dictionary Lookup) ---

  it("clicking MOE Dictionary calls openUrl with correct dictionary URL", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu on first word ("我")

    const items = container.querySelectorAll("[role='menuitem']");
    fireEvent.click(items[0]); // click "MOE Dictionary"

    expect(openUrl).toHaveBeenCalledWith(
      `https://dict.revised.moe.edu.tw/search.jsp?md=1&word=${encodeURIComponent("我")}&qMd=0&qCol=1&sound=1#radio_sound_1`
    );
  });

  it("pressing Enter on focused MOE Dictionary calls openUrl", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "ArrowRight" }); // move to second word ("現在")
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu
    fireEvent.keyDown(textArea, { key: "Enter" }); // activate "MOE Dictionary"

    expect(openUrl).toHaveBeenCalledWith(
      `https://dict.revised.moe.edu.tw/search.jsp?md=1&word=${encodeURIComponent("現在")}&qMd=0&qCol=1&sound=1#radio_sound_1`
    );
  });

  it("MOE Dictionary correctly encodes multi-character words in URL", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "ArrowRight" }); // "現在"
    fireEvent.keyDown(textArea, { key: "Enter" });
    fireEvent.keyDown(textArea, { key: "Enter" });

    const calledUrl = (openUrl as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain(encodeURIComponent("現在"));
  });

  it("menu closes after MOE Dictionary action via click", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });

    const items = container.querySelectorAll("[role='menuitem']");
    fireEvent.click(items[0]); // click "MOE Dictionary"

    expect(container.querySelector("[role='menu']")).not.toBeInTheDocument();
  });

  it("word remains highlighted after MOE Dictionary action", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu on first word
    fireEvent.keyDown(textArea, { key: "Enter" }); // activate "MOE Dictionary"

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[0])).toBe(true);
  });

  // --- US4: Context Menu Actions (Google Translate) ---

  it("clicking Google Translate calls openUrl with zh-TW", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "ArrowRight" }); // move to "現在"
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu

    const items = container.querySelectorAll("[role='menuitem']");
    fireEvent.click(items[1]); // click "Google Translate"

    expect(openUrl).toHaveBeenCalledWith(
      `https://translate.google.com/?sl=zh-TW&tl=en&text=${encodeURIComponent("現在")}`
    );
  });

  it("pressing Enter on focused Google Translate calls openUrl with zh-TW", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "ArrowRight" }); // "現在"
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu
    fireEvent.keyDown(textArea, { key: "ArrowDown" }); // focus "Google Translate"
    fireEvent.keyDown(textArea, { key: "Enter" }); // activate

    expect(openUrl).toHaveBeenCalledWith(
      `https://translate.google.com/?sl=zh-TW&tl=en&text=${encodeURIComponent("現在")}`
    );
  });

  it("Google Translate always uses zh-TW regardless of characters", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    // First word is "我"
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu

    const items = container.querySelectorAll("[role='menuitem']");
    fireEvent.click(items[1]); // click "Google Translate"

    expect(openUrl).toHaveBeenCalledWith(
      `https://translate.google.com/?sl=zh-TW&tl=en&text=${encodeURIComponent("我")}`
    );
  });

  it("menu closes after Google Translate action via click", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });

    const items = container.querySelectorAll("[role='menuitem']");
    fireEvent.click(items[1]); // click "Google Translate"

    expect(container.querySelector("[role='menu']")).not.toBeInTheDocument();
  });

  it("word remains highlighted after Google Translate action", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });
    fireEvent.keyDown(textArea, { key: "ArrowDown" }); // focus "Google Translate"
    fireEvent.keyDown(textArea, { key: "Enter" });

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[0])).toBe(true);
  });

  // --- US5: Context Menu Actions (Copy to Clipboard) ---

  it("clicking Copy calls writeText with characters (not pinyin)", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu on first word ("我", pinyin: "wǒ")

    const items = container.querySelectorAll("[role='menuitem']");
    fireEvent.click(items[2]); // click "Copy" (third entry)

    expect(writeText).toHaveBeenCalledWith("我");
  });

  it("pressing Enter on focused Copy calls writeText with characters", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu
    fireEvent.keyDown(textArea, { key: "ArrowDown" }); // focus "Google Translate"
    fireEvent.keyDown(textArea, { key: "ArrowDown" }); // focus "Copy"
    fireEvent.keyDown(textArea, { key: "Enter" }); // activate "Copy"

    expect(writeText).toHaveBeenCalledWith("我");
  });

  it("Copy on multi-character word copies only characters", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "ArrowRight" }); // navigate to "現在"
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu
    fireEvent.keyDown(textArea, { key: "ArrowDown" }); // "Google Translate"
    fireEvent.keyDown(textArea, { key: "ArrowDown" }); // "Copy"
    fireEvent.keyDown(textArea, { key: "Enter" }); // activate "Copy"

    expect(writeText).toHaveBeenCalledWith("現在");
  });

  it("menu closes after Copy action via click", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" });

    const items = container.querySelectorAll("[role='menuitem']");
    fireEvent.click(items[2]); // click "Copy"

    expect(container.querySelector("[role='menu']")).not.toBeInTheDocument();
  });

  it("word remains highlighted after Copy action", () => {
    const { container } = render(<TextDisplay text={testText} />);
    const textArea = container.firstElementChild as HTMLElement;

    fireEvent.focus(textArea);
    fireEvent.keyDown(textArea, { key: "Enter" }); // open menu on first word
    fireEvent.keyDown(textArea, { key: "ArrowDown" }); // "Google Translate"
    fireEvent.keyDown(textArea, { key: "ArrowDown" }); // "Copy"
    fireEvent.keyDown(textArea, { key: "Enter" }); // activate "Copy"

    const rubies = getRubyElements(container);
    expect(hasHighlight(rubies[0])).toBe(true);
  });

});
