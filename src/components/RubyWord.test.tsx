import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RubyWord } from "./RubyWord";

describe("RubyWord", () => {
  it("renders a <ruby> element with characters and <rt> pinyin", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你好", pinyin: "nǐhǎo" }} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby).toBeInTheDocument();
    expect(ruby).toHaveTextContent("你好");
    const rt = container.querySelector("rt");
    expect(rt).toBeInTheDocument();
    expect(rt).toHaveTextContent("nǐhǎo");
  });

  it("renders multi-character Word with single pinyin unit", () => {
    const { container } = render(
      <RubyWord word={{ characters: "現在", pinyin: "xiànzài" }} />,
    );
    const rt = container.querySelector("rt");
    expect(rt).toHaveTextContent("xiànzài");
    // Single <rt> — not split per character
    const allRt = container.querySelectorAll("rt");
    expect(allRt).toHaveLength(1);
  });

  it("renders single-character Word with pinyin", () => {
    const { container } = render(
      <RubyWord word={{ characters: "我", pinyin: "wǒ" }} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby).toHaveTextContent("我");
    const rt = container.querySelector("rt");
    expect(rt).toHaveTextContent("wǒ");
  });

  it("renders long combined pinyin without extra <rt> elements", () => {
    const { container } = render(
      <RubyWord
        word={{ characters: "乘風破浪", pinyin: "chéngfēngpòlàng" }}
      />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby).toBeInTheDocument();
    const rt = container.querySelector("rt");
    expect(rt).toHaveTextContent("chéngfēngpòlàng");
    // Still a single <rt> — pinyin is one unit
    const allRt = container.querySelectorAll("rt");
    expect(allRt).toHaveLength(1);
  });

  it("has hover transition classes on the ruby element", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你", pinyin: "nǐ" }} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby?.className).toMatch(/transition/);
  });

  it("includes <rp> elements for graceful degradation", () => {
    const { container } = render(
      <RubyWord word={{ characters: "是", pinyin: "shì" }} />,
    );
    const rps = container.querySelectorAll("rp");
    expect(rps).toHaveLength(2);
    expect(rps[0]).toHaveTextContent("(");
    expect(rps[1]).toHaveTextContent(")");
  });

  it("does not apply horizontal padding (authentic Chinese typography)", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你", pinyin: "nǐ" }} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby?.className).not.toMatch(/px-/);
  });

  it("applies vertical padding for pinyin background coverage", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你", pinyin: "nǐ" }} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby?.className).toMatch(/pt-6/);
    expect(ruby?.className).toMatch(/pb-1\.5/);
  });

  it("applies hover styles with increased opacity (24%)", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你", pinyin: "nǐ" }} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby?.className).toMatch(/hover:bg-vermillion\/24/);
  });

  it("applies focus-visible ring for keyboard accessibility", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你", pinyin: "nǐ" }} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby?.className).toMatch(/focus-visible:ring-2/);
    expect(ruby?.className).toMatch(/focus-visible:ring-vermillion/);
  });

  // T010: Always renders <ruby> and <rt> regardless of showPinyin prop
  it("always renders <ruby> and <rt> elements when showPinyin=true", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你好", pinyin: "nǐhǎo" }} showPinyin={true} />,
    );
    const ruby = container.querySelector("ruby");
    const rt = container.querySelector("rt");
    expect(ruby).toBeInTheDocument();
    expect(rt).toBeInTheDocument();
  });

  it("always renders <ruby> and <rt> elements when showPinyin=false", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你好", pinyin: "nǐhǎo" }} showPinyin={false} />,
    );
    const ruby = container.querySelector("ruby");
    const rt = container.querySelector("rt");
    expect(ruby).toBeInTheDocument();
    expect(rt).toBeInTheDocument();
  });

  // T011: When showPinyin=true, <rt> has opacity-100 class
  it("applies opacity-100 class to <rt> when showPinyin=true", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你好", pinyin: "nǐhǎo" }} showPinyin={true} />,
    );
    const rt = container.querySelector("rt");
    expect(rt?.className).toMatch(/opacity-100/);
  });

  // T012: When showPinyin=false, <rt> has opacity-0 class
  it("applies opacity-0 class to <rt> when showPinyin=false", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你好", pinyin: "nǐhǎo" }} showPinyin={false} />,
    );
    const rt = container.querySelector("rt");
    expect(rt?.className).toMatch(/opacity-0/);
  });

  // T012a: <rt> has transition-opacity duration-200 ease-in-out classes
  it("has transition-opacity duration-200 ease-in-out classes on <rt>", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你好", pinyin: "nǐhǎo" }} showPinyin={true} />,
    );
    const rt = container.querySelector("rt");
    expect(rt?.className).toMatch(/transition-opacity/);
    expect(rt?.className).toMatch(/duration-200/);
    expect(rt?.className).toMatch(/ease-in-out/);
  });

  // T013: Always renders Chinese characters
  it("always renders Chinese characters when showPinyin=true", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你好", pinyin: "nǐhǎo" }} showPinyin={true} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby).toHaveTextContent("你好");
  });

  it("always renders Chinese characters when showPinyin=false", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你好", pinyin: "nǐhǎo" }} showPinyin={false} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby).toHaveTextContent("你好");
  });
});
