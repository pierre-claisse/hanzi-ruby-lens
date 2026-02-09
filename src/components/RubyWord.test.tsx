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

  it("applies padding class for breathing room", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你", pinyin: "nǐ" }} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby?.className).toMatch(/px-0\.5/);
  });

  it("applies hover styles with increased opacity", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你", pinyin: "nǐ" }} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby?.className).toMatch(/hover:bg-vermillion\/12/);
  });

  it("applies focus-visible ring for keyboard accessibility", () => {
    const { container } = render(
      <RubyWord word={{ characters: "你", pinyin: "nǐ" }} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby?.className).toMatch(/focus-visible:ring-2/);
    expect(ruby?.className).toMatch(/focus-visible:ring-vermillion/);
  });
});
