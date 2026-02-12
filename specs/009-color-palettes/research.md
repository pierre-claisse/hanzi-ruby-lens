# Research: Color Palette System (009-color-palettes)

**Date**: 2026-02-12

## 1. Color Application Mechanism

**Decision**: CSS `[data-palette]` attribute selectors on `<html>`

**Rationale**: The existing color system uses CSS custom properties consumed by Tailwind via `rgb(var(--color-X) / <alpha-value>)`. These properties are being renamed to `--color-background`, `--color-text`, `--color-accent` (see §9). The most natural extension is to override these properties per palette using CSS attribute selectors. The hook sets `document.documentElement.dataset.palette` and CSS handles the rest — no JS↔CSS bridge at runtime. Theme switching (`.dark` class) works orthogonally with `.dark[data-palette="..."]` compound selectors.

**Alternatives considered**:
- **JS `setProperty()` per token** — Requires coordinating with theme state; palette hook must know current theme and react to theme changes to set correct variant values. More coupling, more code.
- **Generate CSS at runtime** — Over-engineered for 6 fixed palettes. Adds build complexity for no benefit.
- **Single large CSS class per palette** — Would duplicate all Tailwind utility mappings; not how the existing system works.

## 2. Palette Data Location

**Decision**: TypeScript constant array in `src/data/palettes.ts` (for dropdown UI: names, IDs, hex colors for swatches) plus CSS rules in `src/index.css` (for runtime color application: RGB space-separated values).

**Rationale**: Palette hex values are needed in TypeScript for rendering color swatches in the dropdown. CSS needs the same colors as space-separated RGB for the `rgb()` function. This is minimal, justified duplication — the TS file serves the UI, the CSS file serves the rendering engine. Both are static (6 palettes, never change at runtime).

**Alternatives considered**:
- **Single source in TS, inject via JS** — Eliminates CSS rules but requires JS↔CSS coordination for every palette/theme change. Slower, more complex.
- **CSS-only with no TS data** — Can't render swatches in the dropdown without knowing each palette's colors in JS.

## 3. Palette Toggle Button Icon

**Decision**: `Palette` icon from lucide-react (per user directive)

**Rationale**: User explicitly specified "lucide react 'palette' icon for the palette toggle." Confirmed available in lucide-react 0.563.0 as `import { Palette } from 'lucide-react'`.

**Alternatives considered**: SwatchBook, PaintBucket, Paintbrush — all available but user specified Palette.

## 4. Dropdown Content

**Decision**: Palette name text + 3 small color swatches (primary, secondary, accent). No lucide icons in dropdown items. (Per user directive + FR-007.)

**Rationale**: User said "no icons in the dropdown, only the palette names." FR-007 requires "visual preview of each palette's colors (color swatches for primary, secondary, accent)." Swatches are colored dots, not icons — both requirements satisfied.

## 5. Click-Outside Dismissal

**Decision**: `mousedown` event listener on `document` (added when dropdown is open, removed when closed) with `contains()` check.

**Rationale**: Standard React pattern for click-outside detection. Using `mousedown` (not `click`) ensures the listener fires before the button's `onClick`, preventing the toggle-button-reopening problem. The toggle button uses `onPointerDown` with `stopPropagation()` (matching existing title bar button patterns) which prevents the outside listener from triggering on toggle clicks.

**Alternatives considered**:
- **`onBlur` with `relatedTarget` only** — Works for Tab-away but unreliable for arbitrary outside clicks.
- **External library (react-click-outside)** — Unnecessary dependency for a single use case.

## 6. Keyboard Focus Management

**Decision**: `aria-activedescendant` pattern — DOM focus stays on the container element while a `focusedIndex` state tracks the visually focused item.

**Rationale**: Cleaner than roving tabindex for this use case. DOM focus on the container means Tab naturally moves to the next title bar element (Theme toggle) and triggers the `onBlur` handler to close the dropdown. No need to manually manage tab indices on 7 list items.

**Alternatives considered**:
- **Roving tabindex** — More complex; requires managing `tabIndex={0}` on focused item and `tabIndex={-1}` on others. Tab behavior would need manual handling.

## 7. Theme-Aware Swatches

**Decision**: Lift `useTheme` from ThemeToggle to App. Pass `theme` down through TitleBar to PaletteSelector. ThemeToggle becomes props-driven (like PinyinToggle).

**Rationale**: Edge case #4 in spec: "user switches theme while dropdown is open → colors update immediately." Swatches must show the current theme's color variant. PaletteSelector needs reactive access to the current theme. Lifting useTheme to App is the cleanest pattern — it matches PinyinToggle's existing architecture and eliminates the hidden coupling where ThemeToggle owns shared state internally.

**Alternatives considered**:
- **MutationObserver on `.dark` class** — Reactive but over-engineered for one consumer.
- **Always show light mode swatches** — Violates spec edge case #4; dropdown wouldn't update on theme toggle.
- **PaletteSelector calls useTheme internally** — Creates duplicate hook instances with unsynchronized state.

## 8. localStorage Key and Validation

**Decision**: Key `"colorPalette"`, value is palette ID string (kebab-case slug, e.g., `"jade-garden"`). Validation checks against known palette IDs; unknown values fall back to `"vermillion-scroll"`.

**Rationale**: Follows existing conventions — `"theme"`, `"pinyinVisible"`, `"textZoomLevel"` are all simple key-value pairs in localStorage. Kebab-case IDs are safe for CSS attribute selectors and human-readable in devtools.

## 9. CSS Custom Property and Tailwind Token Rename

**Decision**: Rename CSS custom properties to generic names. Rename Tailwind color tokens to avoid prefix collisions.

| Layer | Old | New |
|-------|-----|-----|
| CSS custom property | `--color-paper` | `--color-background` |
| CSS custom property | `--color-ink` | `--color-text` |
| CSS custom property | `--color-vermillion` | `--color-accent` |
| Tailwind token | `paper` | `surface` |
| Tailwind token | `ink` | `content` |
| Tailwind token | `vermillion` | `accent` |

**Rationale**: With 6 palettes whose colors range from jade green to indigo blue to monochrome grey, "paper/ink/vermillion" are no longer accurate names. Generic names reflect the token's *role* (background, text, accent) rather than a specific palette's colors. Per user directive.

**Why different Tailwind names from CSS names?** Tailwind prefixes like `text-` and `bg-` combine with the token name. Using `--color-text` directly as a Tailwind token would produce `text-text` (text color: text) — ugly and confusing. Similarly `bg-background` is redundant. The Tailwind tokens `surface`/`content`/`accent` produce clean utility classes:
- `bg-surface`, `text-content`, `border-content/20`, `hover:bg-content/5`, `focus:ring-accent`

**Impact**: All existing component files that use `bg-paper`, `text-ink`, `border-ink/*`, `ring-vermillion`, etc. must be updated. This is a find-and-replace refactor scoped to `src/` — no logic changes, only class name strings. The palette data in `palettes.ts` uses fields `background`/`text`/`accent` matching the CSS property names.

**Alternatives considered**:
- **Keep paper/ink/vermillion** — Inaccurate once palettes use jade green or indigo blue. User explicitly rejected.
- **Use CSS names directly as Tailwind tokens** — Produces `text-text` and `bg-background`. Rejected for readability.
