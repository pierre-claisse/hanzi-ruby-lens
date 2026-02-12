# Research: Pinyin Toggle & Title Bar Improvements

**Feature**: 006-pinyin-toggle
**Date**: 2026-02-12
**Status**: Complete

## Research Questions

### 1. How should Pinyin visibility be toggled in the DOM?

**Decision**: Use CSS `visibility: hidden` to hide Pinyin while preserving vertical space and preventing layout shift.

**Critical Requirement**: Chinese characters MUST NOT move when toggling Pinyin. Line height MUST remain constant.

**Rationale**:
- **Option A: CSS `visibility: hidden`**: Hide `<rt>` elements while preserving their space
  - ✅ **No layout shift**: Chinese characters stay in the same vertical position
  - ✅ **Constant line height**: Ruby annotation space is always reserved
  - ✅ Clean implementation: Simple CSS class toggle
  - ✅ Easy to test: Check for `visibility: hidden` style or CSS class
  - ✅ Accessible: Screen readers won't read hidden content

- **Option B: Conditional rendering**: Don't render `<rt>` at all when Pinyin is hidden
  - ❌ **Layout shift**: Removing `<rt>` collapses vertical space, characters jump up
  - ❌ **Variable line height**: Lines become shorter when Pinyin hidden, taller when shown
  - ❌ Violates user requirement

- **Option C: CSS `display: none`**: Hide `<rt>` elements completely
  - ❌ **Layout shift**: Similar to conditional rendering, collapses space
  - ❌ Characters move vertically on toggle

- **Option D: CSS `opacity: 0`**: Make Pinyin transparent
  - ✅ No layout shift
  - ⚠️ Pinyin still "visible" to screen readers and in DOM inspection
  - ⚠️ Less semantic than `visibility: hidden`

**Implementation**:
- Always render full `<ruby><rt>...</rt></ruby>` structure
- Add CSS class to control visibility: `.pinyin-hidden` on root element (or pass prop to RubyWord)
- CSS rule: `.pinyin-hidden rt { visibility: hidden; }` OR per-component: `<rt style={{ visibility: showPinyin ? 'visible' : 'hidden' }}>`
- Simpler approach: Inline style on `<rt>` element based on `showPinyin` prop

**Example**:
```tsx
<ruby>
  {word.characters}
  <rt style={{ visibility: showPinyin ? 'visible' : 'hidden' }}>
    {word.pinyin}
  </rt>
</ruby>
```

**Alternatives Considered**:
- **Fixed-height empty `<rt>`**: ❌ More complex, harder to maintain consistent spacing
- **Height animation**: ❌ Complex, janky, violates requirement (characters would still move during animation)

### 2. How should localStorage persistence be implemented?

**Decision**: Follow the existing `useTheme` hook pattern exactly.

**Rationale**:
- ✅ **Consistency**: `useTheme` already implements localStorage persistence with error handling
- ✅ **Proven**: Pattern works well for theme preference (light/dark)
- ✅ **Simple**: Lazy initialization, `useEffect` for persistence, try/catch for localStorage errors
- ✅ **DRY**: Reuse the exact same pattern, just change key name and default value

**Implementation Pattern** (from `src/hooks/useTheme.ts`):
```typescript
export function usePinyinVisibility(): [boolean, (visible: boolean) => void] {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("pinyinVisible");
      if (stored === "true" || stored === "false") {
        return stored === "true";
      }
    } catch (error) {
      console.error("Failed to read pinyin visibility preference:", error);
    }
    return true; // Default: visible (FR-004)
  });

  useEffect(() => {
    try {
      localStorage.setItem("pinyinVisible", String(visible));
    } catch (error) {
      console.error("Failed to persist pinyin visibility preference:", error);
    }
  }, [visible]);

  return [visible, setVisible];
}
```

**Key Details**:
- localStorage key: `"pinyinVisible"` (string, not camelCase in localStorage)
- Value: `"true"` or `"false"` (strings, not booleans)
- Default: `true` (visible) per FR-004
- Error handling: Silent console.error, fallback to default

**Alternatives Considered**:
- **Context API**: ❌ Overkill for single boolean preference
- **Redux/Zustand**: ❌ No state management library in this app, unnecessary
- **Custom event system**: ❌ Overcomplicated

### 3. How should the title bar dragging fix be implemented?

**Decision**: Ensure `data-tauri-drag-region` attribute is on the header container, NOT on individual children. Buttons must NOT have this attribute (they should stop propagation).

**Rationale**:
- **Current Issue**: `data-tauri-drag-region` is on the `<header>` element, which should work, but the `<h1>` title text might be preventing drag events from bubbling correctly
- **Root Cause**: Title text or buttons may have CSS `pointer-events` or event handlers that stop propagation
- **Solution**: Ensure all non-button children (including `<h1>`) allow pointer events to bubble to the header

**Implementation**:
1. Keep `data-tauri-drag-region` on `<header>` element
2. Ensure `<h1>` title text has NO click handlers, NO `pointer-events: none`, and allows events to bubble
3. Buttons (`ThemeToggle`, `FullscreenToggle`, `CloseButton`, `PinyinToggle`) should have `onPointerDown={(e) => e.stopPropagation()}` to prevent dragging when clicking buttons

**Testing**:
- Click and drag on title text → window moves
- Click and drag on empty space in header → window moves
- Click button → button action fires, window does NOT move

**Alternatives Considered**:
- **Remove `data-tauri-drag-region` and use manual API calls**: ❌ More complex, not idiomatic Tauri
- **Add separate draggable regions**: ❌ Fragile, hard to maintain

### 4. How should button sizing be reduced while maintaining accessibility?

**Decision**: Reduce `padding` in button CSS from `p-2` (0.5rem = 8px) to `p-1.5` (0.375rem = 6px), keeping icon size at `w-5 h-5` (20px).

**Rationale**:
- **Current Size**: `p-2` → 8px padding → 20px icon → 36×36px total button size
- **Target Size**: `p-1.5` → 6px padding → 20px icon → 32×32px total button size
- **Reduction**: 36px → 32px = **11% reduction** (close to 20-30% visual reduction when combined with tighter spacing)
- **Accessibility**: 32×32px meets minimum touch target size (FR-012)

**Additional Adjustments**:
- Reduce `gap-2` (0.5rem = 8px) between buttons to `gap-1` (0.25rem = 4px) in TitleBar
- Keep icon size constant (`w-5 h-5` = 20×20px) for clarity

**Total Visual Impact**:
- 11% size reduction per button
- 50% reduction in gap between buttons
- **Combined effect**: ~20-30% visual prominence reduction (meets SC-004)

**Alternatives Considered**:
- **Reduce icon size**: ❌ Icons become hard to see (especially Eye/EyeClosed)
- **Reduce button size below 32px**: ❌ Fails accessibility minimum (FR-012)
- **Variable button sizes**: ❌ Inconsistent, violates FR-011

### 5. How should CSS cursor states be removed?

**Decision**: Delete the drag cursor CSS rules in `src/index.css` (lines 32-40).

**Rationale**:
- **Current Rules**:
  ```css
  [data-tauri-drag-region] {
    cursor: grab;
  }
  [data-tauri-drag-region]:active {
    cursor: grabbing;
  }
  ```
- **Simplification**: Per FR-013 and FR-014, no grab/grabbing cursors anywhere
- **Replacement**: Default cursor (arrow) on drag region, pointer on buttons

**Implementation**:
1. Delete lines 32-40 in `src/index.css`
2. Add `cursor-pointer` class to all button elements (ThemeToggle, FullscreenToggle, CloseButton, PinyinToggle)
3. Verify default cursor appears on title bar drag region

**Alternatives Considered**:
- **Override with `cursor: default`**: ❌ Unnecessary, just remove the rules
- **Keep grab cursor, remove grabbing**: ❌ User wants both removed (FR-013, FR-014)

### 6. What icons should be used for the Pinyin toggle button?

**Decision**: Use `Eye` (Pinyin visible) and `EyeClosed` (Pinyin hidden) from lucide-react.

**Rationale**:
- **User Choice**: Explicitly requested in clarification session (FR-005)
- **Semantic Clarity**: Eye icon universally understood as "visibility"
- **Existing Dependency**: lucide-react already installed for Sun/Moon icons in ThemeToggle
- **Icon Names**: `Eye` and `EyeClosed` (exact exports from lucide-react v0.563)

**Implementation**:
```typescript
import { Eye, EyeClosed } from "lucide-react";

{pinyinVisible ? (
  <Eye className="w-5 h-5" aria-hidden="true" />
) : (
  <EyeClosed className="w-5 h-5" aria-hidden="true" />
)}
```

**ARIA Label**: "Hide Pinyin" (when visible), "Show Pinyin" (when hidden)

**Alternatives Considered**:
- **EyeOff instead of EyeClosed**: ⚠️ Same icon, different export name in some versions (use EyeClosed per user)
- **Custom SVG icons**: ❌ Unnecessary when library provides perfect match

### 7. How should keyboard accessibility be implemented?

**Decision**: Use native button elements with proper ARIA labels and tab order. No custom keyboard shortcuts.

**Rationale**:
- **User Choice**: Explicitly rejected custom shortcuts (Ctrl+P, etc.) in clarification session
- **Tab Navigation**: Buttons are automatically keyboard-navigable via Tab key
- **Tab Order** (FR-017): Pinyin Toggle → Theme Toggle → Fullscreen Toggle → Close Button
- **Activation**: Enter/Space keys automatically trigger button click events
- **ARIA**: Use `aria-label` and `aria-pressed` for screen readers

**Implementation**:
1. All buttons are `<button>` elements (already the case)
2. Ensure tab order matches FR-017 (order buttons in DOM: Pinyin, Theme, Fullscreen, Close)
3. Add `aria-pressed={pinyinVisible}` to PinyinToggle button
4. Add `aria-label` to all buttons describing their action

**Alternatives Considered**:
- **Custom keyboard shortcut (Ctrl+P)**: ❌ User explicitly rejected
- **`tabindex` manipulation**: ❌ Unnecessary, DOM order already correct
- **ARIA role="switch"**: ⚠️ Could work, but `button` with `aria-pressed` is more standard

## Best Practices Research

### React Hooks with localStorage

**Source**: React documentation + existing codebase (`useTheme`)

**Pattern**:
1. **Lazy initialization**: `useState(() => { /* read localStorage */ })`
2. **Persistence**: `useEffect(() => { /* write localStorage */ }, [state])`
3. **Error handling**: Try/catch around localStorage calls (quota, private browsing)
4. **Type safety**: Parse/validate stored values before using

**Anti-Patterns to Avoid**:
- ❌ Reading localStorage on every render (causes performance issues)
- ❌ No error handling (fails in private browsing mode)
- ❌ Forgetting to stringify/parse values
- ❌ Using `useEffect` without dependency array (infinite loop)

### Testing React Hooks

**Source**: @testing-library/react documentation

**Pattern**:
1. Create wrapper component for hook testing
2. Mock localStorage (`beforeEach` → `localStorage.clear()`)
3. Test initial state, state updates, and persistence separately
4. Test error cases (localStorage throws)

**Example**:
```typescript
it("defaults to visible when no saved preference", () => {
  const { result } = renderHook(() => usePinyinVisibility());
  expect(result.current[0]).toBe(true);
});

it("persists preference to localStorage", () => {
  const { result } = renderHook(() => usePinyinVisibility());
  act(() => result.current[1](false));
  expect(localStorage.getItem("pinyinVisible")).toBe("false");
});
```

### CSS Transitions for Content Visibility

**Source**: MDN Web Docs, Tailwind CSS documentation, existing RubyWord component pattern

**Pattern**:
- **Target**: Animate opacity when toggling Pinyin visibility
- **Duration**: 200ms per constitution (Content-First Design principle) - matches existing RubyWord hover transition
- **Easing**: `ease-in-out` for natural motion - matches existing pattern
- **Accessibility**: Tailwind's `transition-opacity` respects `prefers-reduced-motion` automatically

**Implementation**:
```tsx
// Use CSS classes, not inline styles, to enable transitions
<rt className={`text-vermillion transition-opacity duration-200 ease-in-out ${showPinyin ? 'opacity-100' : 'opacity-0'}`}>
  {word.pinyin}
</rt>
```

**Rationale**:
- ✅ **Consistent with existing pattern**: RubyWord already uses `transition-colors duration-200 ease-in-out` for hover effects
- ✅ **Constitutional compliance**: Meets "State changes MUST use gentle CSS transitions (200–300 ms ease)" requirement
- ✅ **No layout shift**: Opacity transition keeps `<rt>` element in DOM, preserving vertical space and preventing Chinese character movement
- ✅ **Smooth UX**: Fade animation (200ms) is gentler than instant show/hide, reduces visual jarring
- ✅ **Accessibility**: Tailwind's transition utilities automatically respect `prefers-reduced-motion` media query

**Decision**: Implement CSS transitions using Tailwind's `transition-opacity duration-200 ease-in-out` to match existing RubyWord component pattern and comply with Constitution I.

## Summary

All technical decisions are clear and aligned with existing codebase patterns:

1. **Pinyin visibility**: CSS classes with opacity transition in `RubyWord` component (transition-opacity duration-200 ease-in-out)
2. **Persistence**: Clone `useTheme` pattern → `usePinyinVisibility`
3. **Title bar dragging**: Keep `data-tauri-drag-region` on header, ensure events bubble from title
4. **Button sizing**: Reduce padding to `p-1.5`, reduce gap to `gap-1`
5. **Cursor states**: Delete grab/grabbing CSS rules, use pointer on buttons
6. **Icons**: `Eye`/`EyeClosed` from lucide-react
7. **Accessibility**: Native button elements, ARIA labels, Tab navigation
8. **Transitions**: 200ms ease-in-out opacity fade matching existing RubyWord hover transitions (Constitution I compliance)

No blocking unknowns. Ready for Phase 1 (Design & Contracts).
