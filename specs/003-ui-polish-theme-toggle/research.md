# Research: UI Polish & Theme Toggle

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Date**: 2026-02-09

## Overview

This document captures research findings for implementing theme toggle functionality and refining visual spacing. All technical unknowns from the Technical Context section have been resolved through codebase analysis and best practices research.

---

## 1. Theme Toggle Implementation Pattern

### Decision: Custom Hook with localStorage Persistence

**Rationale**: React hooks with lazy initialization pattern provides clean separation of concerns, testability, and aligns with existing codebase patterns (see [useMinWidth.ts](../../../src/hooks/useMinWidth.ts)).

**Implementation Pattern**:
```typescript
// Custom hook pattern
const [theme, setTheme] = useState<Theme>(() => {
  // Lazy initialization: read localStorage only once on mount
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Handle localStorage unavailable (private browsing, quota exceeded)
  }
  return "light"; // Default fallback per spec
});

useEffect(() => {
  // Persist theme preference
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Silent fallback per FR-003
  }
  // Update document root class
  document.documentElement.classList.toggle("dark", theme === "dark");
}, [theme]);
```

**Key Benefits**:
- Lazy initialization prevents multiple localStorage reads
- useEffect dependency on `theme` keeps DOM synchronized automatically
- Try-catch blocks handle Safari private mode, quota exceeded errors gracefully
- Single source of truth: React state drives DOM updates

**Alternatives Considered**:
- **Context API**: Rejected - overkill for single toggle, unnecessary prop drilling prevention
- **External library (zustand/jotai)**: Rejected - violates YAGNI principle, adds dependency
- **localStorage only (no React state)**: Rejected - causes hydration mismatches, harder to test

---

## 2. Document Class Toggling Strategy

### Decision: classList.toggle() on document.documentElement

**Rationale**: Tailwind CSS `darkMode: "selector"` (already configured in [tailwind.config.ts](../../../tailwind.config.ts)) expects `.dark` class on root element.

**Implementation**:
```typescript
document.documentElement.classList.toggle("dark", theme === "dark");
```

**Why `document.documentElement` not `document.body`**:
- CSS variables defined at `:root` level (see [index.css](../../../src/index.css) lines 5-14)
- Tailwind's selector mode targets `.dark` at root level
- Global transitions apply consistently

**CSS Foundation Already in Place**:
```css
:root {
  --color-paper: 254 252 243;  /* Light mode */
  --color-ink: 45 45 45;
  --color-vermillion: 200 75 49;
}

.dark {
  --color-paper: 26 26 46;     /* Dark mode */
  --color-ink: 245 240 232;
}
```

No CSS changes needed - foundation exists from feature 002-ruby-text-display.

---

## 3. localStorage Error Handling

### Decision: Defensive Try-Catch with Silent Fallback

**Rationale**: FR-003 specifies "silent fallback to light mode default without user-facing warnings (log errors internally)".

**Error Scenarios Handled**:
1. **QuotaExceededError**: Browser storage is full → continue with session-only state
2. **SecurityError**: localStorage disabled (private browsing mode) → session-only state
3. **TypeError**: Can occur in sandboxed contexts → session-only state

**Implementation Pattern**:
```typescript
const readTheme = (): Theme => {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch (error) {
    console.error("Failed to read theme preference:", error);
  }
  return "light"; // Default fallback
};

const writeTheme = (theme: Theme): void => {
  try {
    localStorage.setItem("theme", theme);
  } catch (error) {
    console.error("Failed to persist theme preference:", error);
    // Continue - session state still works
  }
};
```

**User Experience**: Theme toggle works in-session even if persistence fails. No alerts or warnings shown to user.

---

## 4. Flash of Wrong Theme (FOUT) Prevention

### Decision: Synchronous Inline Script in index.html

**Problem**: Without proper initialization, users briefly see light theme before React mounts and applies dark mode from localStorage.

**Solution**: Add synchronous script in `<head>` before React loads:
```html
<script>
  (function() {
    try {
      const theme = localStorage.getItem("theme");
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      }
    } catch {}
  })();
</script>
```

**Why This Works**:
1. Script runs synchronously BEFORE React hydrates
2. CSS is applied before first paint (no FOUC)
3. Matches React hook's initialization logic (prevents hydration mismatch)

**Critical**: Both inline script and React hook must use identical initialization logic.

---

## 5. Keyboard Accessibility Implementation

### Decision: Native `<button>` Element with ARIA Attributes

**Rationale**: FR-006 requires Tab/Enter/Space keyboard navigation. HTML `<button>` provides this natively.

**Implementation Pattern**:
```typescript
<button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
  aria-pressed={theme === "dark"}
  className="focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2"
>
  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
</button>
```

**Accessibility Features**:
- **Tab navigation**: Native button behavior
- **Enter/Space activation**: Native button behavior (no custom onKeyDown needed unless preventing double-trigger)
- **Screen readers**: `aria-label` announces "Switch to light mode" or "Switch to dark mode"
- **Focus visible**: `focus:ring-2` provides visible focus indicator for keyboard users (WCAG 2.1 compliance)

**Note**: Spec excludes screen reader announcements (clarification Q2 answer: "Keyboard only"), but `aria-label` is still recommended for semantic HTML.

---

## 6. Icon Implementation Strategy

### Decision: Inline SVG Components

**Rationale**: YAGNI principle (constitution IV) dictates simplest approach. Only 2 icons needed (sun/moon).

**Comparison**:

| Approach | Bundle Impact | Dependencies | Complexity | Customizability |
|----------|---------------|--------------|------------|-----------------|
| **Inline SVG** | 0 KB | None | Low | Full (CSS) |
| Lucide React | ~2.5 KB gzipped | 1 npm package | Medium | Full (props + CSS) |
| Heroicons | ~2.5 KB gzipped | 1 npm package | Medium | Full (props + CSS) |
| React Icons | ~0 KB (tree-shaken) | 1 npm package | High (scope creep risk) | Good |
| Unicode Emoji | 0 bytes | None | Low | Limited (size only, no color) |

**Decision Factors**:
1. **Zero dependencies**: No npm package burden
2. **Zero bundle bloat**: Desktop app, but principle still applies
3. **Full control**: Tailwind classes work directly (`fill-current`, `stroke-current`)
4. **No cross-platform inconsistency**: Emoji (☀️🌙) renders differently across OS
5. **Aligned with visual identity**: Clean SVG matches "refined, warm, typographically focused" constitution requirement

**Implementation**:
```typescript
// Sun icon (light mode indicator)
<svg className="w-5 h-5 fill-current text-ink" aria-hidden="true">
  <circle cx="12" cy="12" r="5"/>
  <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42"/>
</svg>

// Moon icon (dark mode indicator)
<svg className="w-5 h-5 fill-current text-ink" aria-hidden="true">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>
```

**Future Migration Path**: If icon count exceeds 5-10, migrate to Lucide React (no lock-in, straightforward refactor).

---

## 7. CSS Spacing Values Research

### Line Height (FR-007)

**Current**: `leading-[2.8]` (line-height: 2.8)

**Research Finding**: Current value is optimal.

**Rationale**:
- CJK typography research recommends **line-height: 2.5–3.0 for ruby-annotated text**
- Without sufficient line-height, ruby annotations (pinyin above characters) overlap with the previous line
- Standard Chinese text uses 1.5–2.0, but ruby annotations require extra vertical clearance
- Current 2.8 falls within optimal range

**Decision**: **Reduce to 2.5** based on user feedback ("lines too far apart vertically"). Research confirms 2.5 is within the optimal range (2.5-3.0) for ruby-annotated text, addressing user concerns while maintaining adequate vertical clearance. **Never go below 2.4** with ruby annotations present.

**Sources**: W3C i18n drafts on ruby styling, CJK typography research

---

### Word Padding (FR-008)

**Current**: No explicit padding on `<ruby>` elements

**Research Finding**: No padding needed - current implementation is correct.

**Rationale**:
- **Chinese writing convention**: No spaces between characters (fundamental characteristic)
- Research shows inter-character spacing **increases cognitive load** and reading time
- Spacing is handled by punctuation/spaces in text content (not CSS padding)
- WCAG 2.1 requires users can increase letter-spacing to 0.12× font size without breakage (current implementation complies via browser zoom)

**Decision**: **Do not add inter-character padding**. If typography feels dense, adjust line-height instead (already optimized).

**Alternative Considered**: `letter-spacing` or `word-spacing` CSS properties → Rejected (violates CJK typography conventions)

**Sources**: Frontiers in Psychology reading studies, Typotheque CJK typesetting principles

---

### Hover Opacity (FR-011)

**Current**: `hover:bg-vermillion/8` (8% opacity)

**Research Finding**: 8% is reasonable for mouse hover; add distinct focus state for keyboard users.

**Rationale**:
- WCAG 2.1 SC 1.4.11 (Non-text Contrast) does NOT mandate specific opacity for hover states when mouse pointer provides additional feedback
- However, keyboard focus (no pointer) MUST reach 3:1 contrast ratio
- Current 8% vermillion wash provides subtle mouse feedback without overwhelming content

**Decision**:
- **Keep 8% for mouse hover** (`hover:bg-vermillion/8`)
- **Add visible focus ring for keyboard** (`focus-visible:ring-2 ring-vermillion`)

**Updated Implementation**:
```typescript
className="hover:bg-vermillion/8 focus-visible:ring-2 focus-visible:ring-vermillion transition-colors duration-200"
```

**Sources**: WCAG 2.1 Understanding SC 1.4.11, WebAIM contrast guidelines

---

### Ruby Vertical Spacing (FR-009)

**Current**: Browser default spacing with `ruby-position: over` and `ruby-align: center`

**Research Finding**: No CSS property exists for ruby vertical gap - current implementation is correct.

**Rationale**:
- CSS Ruby Annotation Layout Module does NOT provide `gap`, `margin`, or `padding` properties for ruby vertical spacing
- Vertical spacing is controlled by **parent container's line-height** (already set to 2.8)
- Browser automatically calculates ruby-to-base spacing based on font sizes (base: 100%, ruby: ~50%)
- `ruby-align: center` controls horizontal alignment only

**Decision**: **No changes needed**. Current line-height of 2.8 provides adequate vertical clearance. If overlap occurs in edge cases, increase to 3.0 (max practical value).

**What NOT to Do**:
- ❌ Adding `margin` or `padding` to `<rt>` - no effect
- ❌ Setting `line-height` on `<rt>` - doesn't apply to ruby annotations
- ❌ Using `gap` property - not applicable to ruby elements

**Sources**: W3C CSS Ruby Module Level 1, MDN ruby-position/ruby-align documentation

---

## 8. Performance Considerations

### Theme Toggle Latency (SC-001)

**Target**: < 100ms perceived delay

**Implementation**:
- React state update triggers immediate re-render
- CSS `transition-colors` on `body` provides smooth 200-300ms transition (existing implementation)
- `classList.toggle()` is synchronous, no async delay
- No network calls involved

**Measurement**: Use React DevTools Profiler to verify render time < 16ms (60 fps target).

---

### Hover Transition Smoothness (FR-013)

**Current**: `transition-colors duration-200 ease-in-out` on RubyWord component

**Target**: 200-300ms (spec requirement)

**Decision**: Keep existing 200ms timing. Research confirms this range provides smooth feedback without feeling sluggish.

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Theme State** | Custom hook with useState + useEffect | Clean, testable, aligns with existing patterns |
| **Persistence** | localStorage with defensive try-catch | Silent fallback per FR-003, graceful degradation |
| **DOM Update** | `classList.toggle()` on documentElement | Tailwind selector mode requirement |
| **Flash Prevention** | Synchronous inline script in index.html | Prevents FOUC, matches React initialization |
| **Keyboard Access** | Native `<button>` with ARIA attributes | Tab/Enter/Space work natively, WCAG compliant |
| **Icons** | Inline SVG components | YAGNI principle, zero dependencies, full control |
| **Line Height** | Reduce from 2.8 to 2.5 | Addresses user feedback while staying in optimal range (2.5-3.0) |
| **Word Padding** | No padding (keep natural spacing) | Respects CJK typography conventions |
| **Hover Opacity** | Keep 8% for mouse + add focus ring | WCAG compliance, multi-modal feedback |
| **Ruby Spacing** | No changes (line-height handles it) | No CSS property exists, current implementation correct |

---

## Next Steps

Proceed to **Phase 1: Design & Contracts** to generate:
1. `data-model.md` - Entity definitions (if any)
2. `contracts/` - API contracts (if any)
3. `quickstart.md` - Implementation guide

**Note**: This feature is purely presentational (UI/CSS). Domain model remains unchanged - no new entities, aggregates, or commands. Phase 1 artifacts will be minimal.
