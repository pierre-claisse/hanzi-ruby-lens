# Implementation Quickstart: UI Polish & Theme Toggle

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)
**Date**: 2026-02-09

## Overview

This guide provides step-by-step implementation instructions for adding theme toggle functionality and refining visual spacing. All changes are frontend-only (React components, CSS, hooks).

**Estimated Implementation Time**: 2-3 hours (including tests)

---

## Prerequisites

- Feature branch `003-ui-polish-theme-toggle` checked out
- Docker Desktop running (for test execution)
- Node.js + npm installed on host (for local frontend development)

---

## Implementation Steps

### Phase 1: Theme Toggle Infrastructure

#### Step 1.1: Create Theme Hook

**File**: `src/hooks/useTheme.ts` (NEW)

**Purpose**: Manage theme state with localStorage persistence

```typescript
import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme(): [Theme, (theme: Theme) => void] {
  // Lazy initialization: read localStorage once on mount
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch (error) {
      // Handle localStorage unavailable (private browsing, quota exceeded)
      console.error("Failed to read theme preference:", error);
    }
    // Fallback to light mode (per FR-003)
    return "light";
  });

  useEffect(() => {
    // Persist theme preference
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      // Silent fallback (per FR-003)
      console.error("Failed to persist theme preference:", error);
    }

    // Update document root class for Tailwind dark mode
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return [theme, setTheme];
}
```

**Key Points**:
- Lazy initialization with `useState(() => ...)` prevents multiple localStorage reads
- Try-catch handles localStorage failures gracefully (FR-003)
- `classList.toggle()` updates root element for Tailwind's `darkMode: "selector"`

---

#### Step 1.2: Create Theme Toggle Component

**File**: `src/components/ThemeToggle.tsx` (NEW)

**Purpose**: Button component for toggling between light/dark modes

```typescript
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "dark"}
      className="p-2 rounded-lg border border-ink/20 bg-paper text-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 transition-colors"
    >
      {theme === "dark" ? (
        // Sun icon (indicates switching to light mode)
        <svg
          className="w-5 h-5 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42" />
        </svg>
      ) : (
        // Moon icon (indicates switching to dark mode)
        <svg
          className="w-5 h-5 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
```

**Key Points**:
- Native `<button>` element provides Tab/Enter/Space keyboard navigation (FR-006)
- `aria-label` provides accessible description
- `aria-pressed` indicates toggle state for screen readers
- Inline SVG icons (zero dependencies, full Tailwind control)
- Sun icon shown in dark mode (indicates "switch to light")
- Moon icon shown in light mode (indicates "switch to dark")

---

#### Step 1.3: Prevent Flash of Wrong Theme

**File**: `index.html` (MODIFIED)

**Purpose**: Apply dark mode class before React mounts to prevent flash

**Location**: Add in `<head>` section, BEFORE `<script type="module" src="/src/main.tsx"></script>`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hanzi Ruby Lens</title>

    <!-- Theme initialization: prevent flash of wrong theme -->
    <script>
      (function() {
        try {
          const theme = localStorage.getItem("theme");
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          }
        } catch {
          // localStorage unavailable, use light mode default
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Key Points**:
- Synchronous execution BEFORE React loads
- Must use identical logic to `useTheme` hook initialization
- Prevents FOUC (Flash of Unstyled Content)

---

#### Step 1.4: Integrate Theme Toggle in App

**File**: `src/App.tsx` (MODIFIED)

**Purpose**: Position theme toggle button in top-right corner (per FR-001)

```typescript
import { TextDisplay } from "./components/TextDisplay";
import { ThemeToggle } from "./components/ThemeToggle";
import { sampleText } from "./data/sample-text";

function App() {
  return (
    <div className="bg-paper text-ink min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Theme toggle: fixed top-right position */}
        <div className="fixed top-6 right-6 z-10">
          <ThemeToggle />
        </div>

        {/* Main content */}
        <TextDisplay text={sampleText} />
      </div>
    </div>
  );
}

export default App;
```

**Key Points**:
- `fixed` positioning keeps toggle visible during scrolling (per clarification)
- `top-6 right-6` positions in top-right corner
- `z-10` ensures toggle stays above content

**Alternative (Non-Fixed)**:
If fixed positioning interferes with content, use relative positioning:
```typescript
<div className="flex justify-end mb-8">
  <ThemeToggle />
</div>
```

---

### Phase 2: Visual Spacing Refinements

#### Step 2.1: Update Line Height

**File**: `src/components/TextDisplay.tsx` (MODIFIED)

**Purpose**: Reduce line height to address user feedback while staying in optimal range

**Current Implementation**: `leading-[2.8]` on line 12 and 20

**Change**:
```typescript
// Before:
<div className="font-hanzi text-2xl leading-[2.8]">

// After:
<div className="font-hanzi text-2xl leading-[2.5]">
```

**Key Points**:
- Research confirms optimal range for ruby-annotated text is 2.5-3.0
- Reducing from 2.8 → 2.5 addresses user feedback ("lines too far apart") while staying in optimal range
- This creates denser layout without risking ruby annotation overlap
- **Never go below 2.4** with ruby annotations present

**Verification**: Visually test with sample text, particularly long-pinyin words (乘風破浪) to ensure no overlap between lines.

---

#### Step 2.2: Add Word Padding

**File**: `src/components/RubyWord.tsx` (MODIFIED)

**Purpose**: Add horizontal padding for breathing room (FR-008)

**Change**:
```typescript
// Before:
<ruby className="font-hanzi rounded transition-colors duration-200 ease-in-out hover:bg-vermillion/8">

// After:
<ruby className="font-hanzi px-0.5 rounded transition-colors duration-200 ease-in-out hover:bg-vermillion/8">
```

**Key Points**:
- `px-0.5` adds 2px horizontal padding (0.125rem) on each side = 4px total separation
- Subtle enough not to disrupt Chinese typography conventions
- Creates visible separation between adjacent words without excessive whitespace

**Alternative Values** (test visually):
- `px-1` (4px each side = 8px total): More breathing room
- `px-0` (no padding): If research finding "no padding needed" proves correct in practice

---

#### Step 2.3: Increase Hover Opacity

**File**: `src/components/RubyWord.tsx` (MODIFIED)

**Purpose**: Make hover highlight more visible (FR-011)

**Change**:
```typescript
// Before:
<ruby className="font-hanzi px-0.5 rounded transition-colors duration-200 ease-in-out hover:bg-vermillion/8">

// After:
<ruby className="font-hanzi px-0.5 rounded transition-colors duration-200 ease-in-out hover:bg-vermillion/12 focus-visible:ring-2 focus-visible:ring-vermillion">
```

**Key Points**:
- `hover:bg-vermillion/12` increases opacity from 8% to 12% (50% increase in visibility)
- `focus-visible:ring-2` adds keyboard focus indicator (WCAG compliance)
- `focus-visible:ring-vermillion` uses accent color for focus ring
- Transition timing unchanged (200ms per FR-013)

**Tailwind Config Update** (if 12% opacity not available):

**File**: `tailwind.config.ts` (MODIFIED if needed)

```typescript
extend: {
  // ... existing config ...
  opacity: {
    "8": "0.08",
    "12": "0.12",  // ADD THIS if not present
  },
}
```

---

#### Step 2.4: Ruby Vertical Spacing

**File**: `src/index.css` (NO CHANGE)

**Purpose**: Verify ruby annotation vertical spacing is adequate (FR-009)

**Current Implementation**:
```css
ruby {
  ruby-position: over;
  white-space: nowrap;
}

rt {
  color: rgb(var(--color-vermillion));
  ruby-align: center;
}
```

**Decision**: **NO CHANGE NEEDED** - research confirms no CSS property exists for ruby vertical gap. Spacing is controlled by parent container's `line-height: 2.8`, which is already optimal.

**Verification**: Visually test with long-pinyin words (e.g., 乘風破浪/chéngfēngpòlàng) to ensure no overlap.

---

### Phase 3: Testing

#### Step 3.1: Create ThemeToggle Tests

**File**: `src/components/ThemeToggle.test.tsx` (NEW)

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    // Clear localStorage and reset DOM state before each test
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders with moon icon in light mode by default", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Switch to dark mode");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles to dark mode on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(button).toHaveAttribute("aria-label", "Switch to light mode");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles back to light mode on second click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    await user.click(button); // Dark
    await user.click(button); // Light

    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme preference to localStorage", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("is keyboard accessible with Tab and Enter", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    button.focus();

    expect(document.activeElement).toBe(button);

    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("is keyboard accessible with Space", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    button.focus();

    await user.keyboard(" "); // Space key
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("initializes from localStorage if present", () => {
    localStorage.setItem("theme", "dark");

    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("handles localStorage unavailable gracefully", () => {
    // Mock localStorage.getItem to throw error
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("localStorage unavailable");
    };

    // Should not throw, should render in light mode
    expect(() => render(<ThemeToggle />)).not.toThrow();

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");

    // Restore original localStorage
    Storage.prototype.getItem = originalGetItem;
  });
});
```

**Key Points**:
- Tests all acceptance scenarios from spec (FR-001 through FR-006)
- Covers keyboard accessibility (Tab, Enter, Space)
- Tests localStorage persistence and error handling
- Uses `beforeEach` to reset state between tests

---

#### Step 3.2: Update Existing Component Tests

**File**: `src/components/RubyWord.test.tsx` (MODIFIED)

**Purpose**: Update assertions for new padding and hover opacity

```typescript
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RubyWord } from "./RubyWord";

describe("RubyWord", () => {
  const mockWord = { characters: "現在", pinyin: "xiànzài" };

  it("renders Chinese characters and pinyin", () => {
    const { container } = render(<RubyWord word={mockWord} />);
    const ruby = container.querySelector("ruby");
    const rt = container.querySelector("rt");

    expect(ruby?.textContent).toContain("現在");
    expect(rt?.textContent).toBe("xiànzài");
  });

  it("applies padding class for breathing room", () => {
    const { container } = render(<RubyWord word={mockWord} />);
    const ruby = container.querySelector("ruby");

    expect(ruby?.className).toContain("px-0.5");
  });

  it("applies hover styles with increased opacity", () => {
    const { container } = render(<RubyWord word={mockWord} />);
    const ruby = container.querySelector("ruby");

    expect(ruby?.className).toContain("hover:bg-vermillion/12");
  });

  it("applies focus-visible ring for keyboard accessibility", () => {
    const { container } = render(<RubyWord word={mockWord} />);
    const ruby = container.querySelector("ruby");

    expect(ruby?.className).toContain("focus-visible:ring-2");
  });
});
```

---

#### Step 3.3: Update App Tests

**File**: `src/App.test.tsx` (MODIFIED)

**Purpose**: Verify ThemeToggle is rendered

```typescript
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
    const button = screen.getByRole("button", { name: /switch to.*mode/i });
    expect(button).toBeInTheDocument();
  });
});
```

---

#### Step 3.4: Run Tests

**Command**: `npm run test`

**Expected**: All tests pass (including new ThemeToggle tests)

**Docker Execution**: Tests run inside Docker container via `docker-compose.test.yml`

---

### Phase 4: Manual Testing Checklist

#### Theme Toggle Functionality
- [ ] Click toggle button → theme switches immediately (< 100ms perceived delay)
- [ ] Click toggle again → theme switches back
- [ ] Close and reopen app → theme preference persists
- [ ] Toggle works in both light and dark modes
- [ ] Icons change appropriately (sun in dark mode, moon in light mode)

#### Keyboard Accessibility
- [ ] Press Tab → toggle button receives focus with visible focus ring
- [ ] Press Enter while focused → theme toggles
- [ ] Press Space while focused → theme toggles
- [ ] Focus ring is visible (vermillion color, 2px width)

#### Visual Spacing
- [ ] Lines of text have comfortable vertical spacing (not too far apart)
- [ ] Individual Words have subtle horizontal breathing room (visible separation)
- [ ] Ruby annotations (pinyin) have adequate vertical space above characters (no overlap)
- [ ] Long-pinyin words like 乘風破浪 render without overflow or misalignment

#### Hover Visibility
- [ ] Hover over any Word → highlight is clearly visible (not too subtle)
- [ ] Highlight works in both light and dark modes
- [ ] Transition is smooth (200-300ms)
- [ ] Moving cursor between Words → highlight transitions smoothly

#### Edge Cases
- [ ] Rapid clicking toggle (multiple times per second) → no flickering or errors
- [ ] Window below minimum width → toggle remains accessible or gracefully hides
- [ ] Simulate localStorage failure (browser dev tools → disable storage) → app continues to work with session-only theme
- [ ] Private browsing mode → theme toggle works (session-only, no persistence)

---

### Phase 5: Integration & Cleanup

#### Step 5.1: Update Agent Context

**Command**: Run agent context update script

```bash
powershell -ExecutionPolicy Bypass -File .specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

**Purpose**: Add new technologies/patterns to `CLAUDE.md` for future reference

**Expected Changes**:
- Add `useTheme` hook pattern to active technologies
- Document inline SVG icon approach
- Record theme toggle implementation pattern

---

#### Step 5.2: Verify No Regressions

**Checklist**:
- [ ] Existing feature 002-ruby-text-display still works (Chinese text with ruby annotations displays correctly)
- [ ] MinWidthOverlay still appears when window is too narrow
- [ ] All existing tests pass (`npm run test`)
- [ ] No console errors or warnings in browser dev tools

---

#### Step 5.3: Build Verification

**Command**: `npm run build`

**Expected**: Build completes successfully, no errors

**Verify**:
- [ ] Tauri app builds without errors
- [ ] Frontend bundle size has not increased significantly (inline SVG adds <1KB)
- [ ] Theme toggle works in production build

---

## Implementation Notes

### Optional Enhancements (Out of Scope)

These are explicitly **out of scope** per spec but noted for future consideration:

1. **System theme detection**: Automatically match OS dark mode preference
   - Would require `window.matchMedia("(prefers-color-scheme: dark)")` listener
   - Deferred to future feature

2. **Animated theme transitions**: Fade or slide effects during toggle
   - Would require CSS keyframe animations or Framer Motion
   - Deferred per spec (simple instant toggle only)

3. **Customizable spacing presets**: User-selectable compact/comfortable/spacious modes
   - Would require additional UI controls and state management
   - Deferred per spec (single optimized spacing only)

4. **Custom theme colors**: Beyond Ink & Vermillion palette
   - Constitution v1.1.0 locks the palette
   - Requires constitutional amendment

---

## Troubleshooting

### Theme toggle doesn't persist
- **Check**: localStorage is enabled in browser
- **Check**: No errors in browser console
- **Fix**: Ensure try-catch blocks in `useTheme.ts` are present

### Flash of wrong theme on load
- **Check**: Inline script in `index.html` is present and runs BEFORE React script
- **Check**: Logic matches `useTheme` initialization exactly
- **Fix**: Add synchronous theme initialization script to `<head>`

### Focus ring not visible
- **Check**: Tailwind config includes `focus-visible:` variant
- **Check**: Browser supports `:focus-visible` pseudo-class (all modern browsers)
- **Fix**: Add explicit focus styles with sufficient contrast

### Hover highlight too subtle/strong
- **Adjust**: Change opacity value in `hover:bg-vermillion/12` (try 10, 14, 16)
- **Verify**: Test in both light and dark modes
- **Measure**: Use browser dev tools to verify contrast ratio

### Ruby annotations overlapping previous line
- **Check**: Parent container has `leading-[2.8]` class
- **Fix**: Increase to `leading-[3.0]` if overlap persists
- **Verify**: Test with long-pinyin words

---

## Acceptance Criteria Verification

Use this checklist to verify all success criteria (SC-001 through SC-007) from [spec.md](./spec.md):

- [ ] **SC-001**: Theme toggle latency < 100ms perceived delay ✓
- [ ] **SC-002**: Theme preference persists across app restarts (100% retention) ✓
- [ ] **SC-003**: Line spacing approximately 10-15% reduced from 2.8 (NO CHANGE - 2.8 is optimal)
- [ ] **SC-004**: Word padding creates 4-6px horizontal space between adjacent Words ✓
- [ ] **SC-005**: Hover highlight clearly visible in both modes (subjective test) ✓
- [ ] **SC-006**: Hover opacity 50-100% more noticeable than 8% (12% = 50% increase) ✓
- [ ] **SC-007**: Spacing adjustments preserve long-pinyin edge cases (no overflow) ✓

---

## Completion Checklist

- [ ] All files created/modified as documented above
- [ ] All tests pass (`npm run test`)
- [ ] Manual testing checklist complete
- [ ] No console errors or warnings
- [ ] Build verification successful (`npm run build`)
- [ ] Agent context updated
- [ ] All acceptance criteria verified
- [ ] Ready for commit and merge

---

## Next Steps

After implementation is complete:
1. Run `/speckit.analyze` to verify constitution compliance
2. Commit changes with appropriate message referencing spec 003
3. Merge to main branch following git-flow methodology
4. Update release notes if preparing for v1.x release
