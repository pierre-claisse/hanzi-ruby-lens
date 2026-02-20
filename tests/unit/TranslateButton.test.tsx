import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TranslateButton } from "../../src/components/TranslateButton";

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn(),
}));

import { openUrl } from "@tauri-apps/plugin-opener";

describe("TranslateButton", () => {
  beforeEach(() => {
    vi.mocked(openUrl).mockClear();
  });

  it("renders the Languages icon", () => {
    render(<TranslateButton rawInput="你好" />);
    const button = screen.getByRole("button", { name: "Translate text" });
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it('has aria-label "Translate text" and title "Google Translate"', () => {
    render(<TranslateButton rawInput="你好" />);
    const button = screen.getByRole("button", { name: "Translate text" });
    expect(button).toHaveAttribute("aria-label", "Translate text");
    expect(button).toHaveAttribute("title", "Google Translate");
  });

  it("calls openUrl with correct Google Translate URL when clicked", async () => {
    const user = userEvent.setup();
    render(<TranslateButton rawInput="你好" />);
    const button = screen.getByRole("button", { name: "Translate text" });

    await user.click(button);

    expect(openUrl).toHaveBeenCalledTimes(1);
    const url = vi.mocked(openUrl).mock.calls[0][0];
    expect(url).toContain("https://translate.google.com/");
    expect(url).toContain("sl=zh-TW");
    expect(url).toContain("tl=en");
    expect(url).toContain(encodeURIComponent("你好"));
  });

  it("is disabled when rawInput is empty", () => {
    render(<TranslateButton rawInput="" />);
    const button = screen.getByRole("button", { name: "Translate text" });
    expect(button).toBeDisabled();
  });

  it("has disabled styling when rawInput is empty", () => {
    render(<TranslateButton rawInput="" />);
    const button = screen.getByRole("button", { name: "Translate text" });
    expect(button.className).toContain("disabled:opacity-50");
    expect(button.className).toContain("disabled:cursor-not-allowed");
  });

  it("does not call openUrl when disabled and clicked", async () => {
    const user = userEvent.setup();
    render(<TranslateButton rawInput="" />);
    const button = screen.getByRole("button", { name: "Translate text" });

    await user.click(button);

    expect(openUrl).not.toHaveBeenCalled();
  });

  it("truncates URL-encoded text exceeding 5,000 characters", async () => {
    const user = userEvent.setup();
    // Chinese characters encode to 9 chars each (%XX%XX%XX), so ~556 chars should exceed 5000
    const longText = "字".repeat(600);
    render(<TranslateButton rawInput={longText} />);
    const button = screen.getByRole("button", { name: "Translate text" });

    await user.click(button);

    expect(openUrl).toHaveBeenCalledTimes(1);
    const url = vi.mocked(openUrl).mock.calls[0][0];
    const textParam = url.split("text=")[1];
    expect(textParam.length).toBeLessThanOrEqual(5000);
  });
});
