import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TextDisplay } from "./TextDisplay";
import type { Text } from "../types/domain";

const sampleText: Text = {
  segments: [
    { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
    { type: "plain", text: "，" },
    { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
    { type: "plain", text: "！" },
  ],
};

describe("TextDisplay", () => {
  it("renders Word segments as RubyWord components with <ruby> elements", () => {
    const { container } = render(<TextDisplay text={sampleText} />);
    const rubies = container.querySelectorAll("ruby");
    expect(rubies).toHaveLength(2);
    expect(rubies[0]).toHaveTextContent("你好");
    expect(rubies[1]).toHaveTextContent("世界");
  });

  it("renders non-Word segments as plain text without <ruby>", () => {
    const { container } = render(<TextDisplay text={sampleText} />);
    // Punctuation should be present in the output
    expect(container).toHaveTextContent("，");
    expect(container).toHaveTextContent("！");
    // But only 2 ruby elements (not 4)
    const rubies = container.querySelectorAll("ruby");
    expect(rubies).toHaveLength(2);
  });

  it("renders Chinese punctuation inline without annotation", () => {
    const punctuationText: Text = {
      segments: [
        { type: "word", word: { characters: "好", pinyin: "hǎo" } },
        { type: "plain", text: "。" },
        { type: "plain", text: "，" },
      ],
    };
    const { container } = render(<TextDisplay text={punctuationText} />);
    const rubies = container.querySelectorAll("ruby");
    expect(rubies).toHaveLength(1);
    expect(container).toHaveTextContent("。");
    expect(container).toHaveTextContent("，");
  });

  it("shows placeholder message when Text is empty", () => {
    const emptyText: Text = { segments: [] };
    render(<TextDisplay text={emptyText} />);
    expect(screen.getByText(/no text/i)).toBeInTheDocument();
  });

  it("has correct line-height and font classes for ruby spacing", () => {
    const { container } = render(<TextDisplay text={sampleText} />);
    const textContainer = container.firstElementChild;
    expect(textContainer?.className).toMatch(/font-hanzi/);
    expect(textContainer?.className).toMatch(/leading-/);
  });

  it("applies line height for comfortable reading", () => {
    const { container } = render(<TextDisplay text={sampleText} />);
    const textContainer = container.firstElementChild;
    expect(textContainer?.className).toMatch(/leading-\[2\.5\]/);
  });

  it("handles long-pinyin words without overflow or misalignment", () => {
    const longPinyinText: Text = {
      segments: [
        { type: "word", word: { characters: "乘風破浪", pinyin: "chéngfēngpòlàng" } },
        { type: "plain", text: "，" },
        { type: "word", word: { characters: "再接再厲", pinyin: "zàijiēzàilì" } },
      ],
    };
    const { container } = render(<TextDisplay text={longPinyinText} />);

    // Verify ruby elements are rendered
    const rubies = container.querySelectorAll("ruby");
    expect(rubies).toHaveLength(2);

    // Verify no visual overflow (ruby elements have proper line-height)
    const textContainer = container.firstElementChild;
    expect(textContainer?.className).toMatch(/leading-\[2\.5\]/);

    // Verify long pinyin is present
    const firstRt = container.querySelector("rt");
    expect(firstRt).toHaveTextContent("chéngfēngpòlàng");
  });

  it("prevents text selection via select-none class", () => {
    const { container } = render(<TextDisplay text={sampleText} />);
    const textContainer = container.firstElementChild;
    expect(textContainer?.className).toMatch(/select-none/);
  });

  it("maintains default cursor state throughout reading area", () => {
    const { container } = render(<TextDisplay text={sampleText} />);
    const textContainer = container.firstElementChild;
    expect(textContainer?.className).toMatch(/cursor-default/);
  });

  // T014: Passes showPinyin prop to all RubyWord components
  it("passes showPinyin prop to all RubyWord components when showPinyin=true", () => {
    const { container } = render(<TextDisplay text={sampleText} showPinyin={true} />);
    const rts = container.querySelectorAll("rt");

    // All <rt> elements should have opacity-100 class
    rts.forEach((rt) => {
      expect(rt.className).toMatch(/opacity-100/);
    });
  });

  it("passes showPinyin prop to all RubyWord components when showPinyin=false", () => {
    const { container } = render(<TextDisplay text={sampleText} showPinyin={false} />);
    const rts = container.querySelectorAll("rt");

    // All <rt> elements should have opacity-0 class
    rts.forEach((rt) => {
      expect(rt.className).toMatch(/opacity-0/);
    });
  });
});
