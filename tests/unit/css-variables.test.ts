import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const EXPECTED_FONTS: Record<string, string> = {
  "vermillion-scroll": "Cactus Classical Serif",
  "jade-garden": "LXGW WenKai TC",
  "indigo-silk": "Chiron Hei HK Variable",
  "plum-blossom": "Huninn",
  "golden-pavilion": "Chiron Sung HK WS",
  "ink-wash": "Chocolate Classical Sans",
};

describe("palette font CSS variables", () => {
  const cssPath = path.resolve(__dirname, "../../src/index.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  for (const [paletteId, font] of Object.entries(EXPECTED_FONTS)) {
    describe(`[data-palette="${paletteId}"]`, () => {
      // Extract the CSS block for this palette (light mode selector)
      const blockRegex = new RegExp(
        `\\[data-palette="${paletteId}"\\]\\s*\\{([^}]+)\\}`,
      );
      const match = cssContent.match(blockRegex);

      it("has a CSS rule block", () => {
        expect(match).not.toBeNull();
      });

      it(`sets --font-palette to "${font}"`, () => {
        const block = match![1];
        const fontPalette = block.match(/--font-palette:\s*"([^"]+)"/);
        expect(fontPalette).not.toBeNull();
        expect(fontPalette![1]).toBe(font);
      });
    });
  }
});
