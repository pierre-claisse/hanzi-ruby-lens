import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it('renders "Hanzi Ruby Lens" as a heading', () => {
    render(<App />);
    const heading = screen.getByRole("heading", { name: /hanzi ruby lens/i });
    expect(heading).toBeInTheDocument();
  });
});
