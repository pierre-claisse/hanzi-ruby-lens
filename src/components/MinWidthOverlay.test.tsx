import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { MinWidthOverlay } from "./MinWidthOverlay";

function setWindowWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("MinWidthOverlay", () => {
  beforeEach(() => {
    setWindowWidth(1024);
  });

  it("is hidden when window width >= 400px", () => {
    setWindowWidth(400);
    const { container } = render(<MinWidthOverlay />);
    // Overlay should not be visible
    expect(
      screen.queryByText(/increase|widen|window/i),
    ).not.toBeInTheDocument();
  });

  it("is visible when window width < 400px", () => {
    setWindowWidth(399);
    render(<MinWidthOverlay />);
    expect(screen.getByText(/widen|increase|window/i)).toBeInTheDocument();
  });

  it("contains a message asking the user to increase window size", () => {
    setWindowWidth(300);
    render(<MinWidthOverlay />);
    const overlay = screen.getByText(/widen|increase|window/i);
    expect(overlay).toBeInTheDocument();
  });
});
