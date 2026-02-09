import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders TextDisplay with sample data containing ruby elements", () => {
    const { container } = render(<App />);
    const rubies = container.querySelectorAll("ruby");
    expect(rubies.length).toBeGreaterThan(0);
  });

  it("renders ThemeToggle button", () => {
    render(<App />);
    const themeToggleButton = screen.getByRole("button", { name: /switch to (light|dark) mode/i });
    expect(themeToggleButton).toBeInTheDocument();
  });
});
