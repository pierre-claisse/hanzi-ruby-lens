# Research: Quadrant-Based Context Menu Positioning

## Decision 1: Horizontal Positioning Approach

**Decision**: Extend the existing `getMenuPosition()` callback in TextDisplay.tsx to compute a horizontal midpoint (`window.innerWidth / 2`) alongside the existing vertical midpoint, then branch on both axes to produce 4 quadrant positions.

**Rationale**: The current code already follows this pattern for vertical positioning (comparing `wordCenter` against `viewportMid`). Adding a horizontal axis check is a natural, minimal extension with no new abstractions needed.

**Alternatives considered**:
- **CSS-based positioning** (e.g., `right: 0` instead of `left`): Rejected because the menu is `position: absolute` inside a scrollable container — computing coordinates in JS keeps the logic in one place and avoids CSS specificity conflicts.
- **Separate positioning hook**: Rejected (YAGNI) — the logic is ~15 lines and doesn't warrant a new abstraction.

## Decision 2: Left-Side Menu Positioning Calculation

**Decision**: For words in the right half of the viewport, calculate the menu's `left` as `wordRect.left - containerRect.left - menuWidth` (where `menuWidth` is the Tailwind `w-48` = 192px). This places the menu's right edge at the word's left edge.

**Rationale**: The menu has a fixed width (`w-48` = 12rem = 192px) set in WordContextMenu.tsx. Using this known width to compute the left offset avoids needing to measure the menu DOM element after rendering.

**Alternatives considered**:
- **Measuring menu DOM after render** (useRef + useEffect): Rejected — adds a render cycle and potential flicker. The menu width is fixed by Tailwind class, so hardcoding 192px (or extracting it as a constant) is simpler and flicker-free.
- **CSS `transform: translateX(-100%)`**: Rejected — harder to combine with viewport clamping logic.

## Decision 3: Viewport Overflow Clamping

**Decision**: After computing the quadrant-based position, clamp `left` to `[0, containerWidth - menuWidth]` and `top` to `[0, containerHeight - menuHeight]` to prevent overflow.

**Rationale**: Edge cases (small windows, words very near edges) could push the menu outside the viewport even with quadrant-aware positioning. A final clamp pass is a simple safety net.

**Alternatives considered**:
- **No clamping**: Rejected — words near the midpoint boundary could still produce overflow.
- **Dynamic quadrant switching based on available space**: Over-engineered for the current use case; simple clamping achieves the same result.

## Decision 4: Icon Boldness Fix for Merge Entries

**Decision**: Add an explicit `strokeWidth={1.5}` prop to all icon renders in WordContextMenu.tsx. The Lucide default is 2, but at `size={16}` this can produce inconsistent visual weight depending on icon complexity. Using 1.5 ensures uniform appearance.

**Rationale**: Both "Merge with previous" and "Merge with next" use the same `Combine` icon, yet the second visually appears bolder — likely a sub-pixel rendering artifact. Explicitly setting `strokeWidth` normalizes rendering across all icons in the menu, not just the merge pair.

**Alternatives considered**:
- **Using different icons for the two merge actions**: Rejected — they represent the same operation (merge) in different directions; using the same icon is semantically correct.
- **Adjusting only the bold icon**: Rejected — the inconsistency may be context-dependent (DOM position, antialiasing); a uniform `strokeWidth` on all icons is more robust.
- **CSS `font-weight` or `stroke-width` override**: Rejected — Lucide icons accept `strokeWidth` as a prop which is cleaner than CSS overrides.

## Decision 5: Test Strategy

**Decision**: Extract the quadrant detection logic into a pure function and unit-test it with Vitest. No integration test for DOM positioning (getBoundingClientRect mocking is brittle).

**Rationale**: The core logic (given word center X/Y and viewport midpoints → return quadrant direction) is a pure function. Testing it in isolation is reliable and fast. The DOM wiring (reading getBoundingClientRect, applying the position) is thin enough to verify manually.

**Alternatives considered**:
- **Full integration test with mocked getBoundingClientRect**: Possible but brittle — requires mocking multiple DOM APIs. The ROI is low for a ~20-line function.
- **No tests**: Rejected — Constitution V (Test-First Imperative) requires test coverage.
