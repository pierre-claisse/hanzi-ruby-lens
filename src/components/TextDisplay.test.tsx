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
});
