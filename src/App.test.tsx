import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders TextDisplay with sample data containing ruby elements", () => {
    const { container } = render(<App />);
    const rubies = container.querySelectorAll("ruby");
    expect(rubies.length).toBeGreaterThan(0);
  });
});
