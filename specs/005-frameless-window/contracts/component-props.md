# Component Props Contract

**Feature**: 005-frameless-window
**Type**: React Component Interfaces
**Date**: 2026-02-11

## Overview

This contract defines the TypeScript interfaces for all components in the frameless window feature.

---

## TitleBar Component

**File**: `src/components/TitleBar.tsx`

**Props Interface**:
```typescript
interface TitleBarProps {
  // No props - self-contained component
}
```

**Children**: Not accepted (fixed structure)

**Usage**:
```tsx
<TitleBar />
```

**Accessibility Attributes**:
- Title text has `user-select: none` to prevent selection
- Entire bar has `data-tauri-drag-region` for window dragging

**CSS Contract**:
- Must use `position: fixed`, `top: 0`, `left: 0`, `right: 0`
- Must have `z-index` high enough to stay above main content
- Height must be exactly 48px (3rem)
- Must apply `cursor: grab` and `active:cursor-grabbing`

---

## FullscreenToggle Component

**File**: `src/components/FullscreenToggle.tsx`

**Props Interface**:
```typescript
interface FullscreenToggleProps {
  // No props - uses useFullscreen hook internally
}
```

**State Dependencies**:
- Uses `useFullscreen()` hook for state and toggle function

**Icon Contract**:
- Windowed state: Show `<Maximize />` icon (diagonal arrows pointing out)
- Fullscreen state: Show `<Minimize />` icon (diagonal arrows pointing in)
- Icon size: `w-5 h-5` (20px × 20px)

**Accessibility Requirements**:
- Must have `aria-label` that describes current action (e.g., "Enter fullscreen" or "Exit fullscreen")
- Must be focusable via Tab key
- Must activate on Enter key press
- Must show focus ring (Tailwind: `focus:ring-2 focus:ring-vermillion`)

**Styling Contract** (copied from ThemeToggle):
```tsx
className="p-2 rounded-lg border border-ink/20 bg-paper text-ink
           hover:bg-ink/5 focus:outline-none focus:ring-2
           focus:ring-vermillion focus:ring-offset-2 transition-colors"
```

**Usage**:
```tsx
<FullscreenToggle />
```

---

## CloseButton Component

**File**: `src/components/CloseButton.tsx`

**Props Interface**:
```typescript
interface CloseButtonProps {
  // No props - stateless action
}
```

**Icon Contract**:
- Always show `<X />` icon (close symbol)
- Icon size: `w-5 h-5` (20px × 20px)

**Accessibility Requirements**:
- Must have `aria-label="Close application"`
- Must be focusable via Tab key (last in tab order)
- Must activate on Enter key press
- Must show focus ring

**Styling Contract** (copied from ThemeToggle):
```tsx
className="p-2 rounded-lg border border-ink/20 bg-paper text-ink
           hover:bg-ink/5 focus:outline-none focus:ring-2
           focus:ring-vermillion focus:ring-offset-2 transition-colors"
```

**Action Contract**:
- On click: Call `getCurrentWindow().close()`
- No confirmation dialog (user can prevent close via OS or future closeRequested handler)

**Usage**:
```tsx
<CloseButton />
```

---

## ThemeToggle Component (Refactored)

**File**: `src/components/ThemeToggle.tsx`

**Props Interface**:
```typescript
interface ThemeToggleProps {
  // No props - existing interface unchanged
}
```

**Changes**:
- **Remove**: `fixed top-6 right-6` positioning classes
- **Replace**: Inline SVG icons with lucide-react `<Sun />` and `<Moon />` components
- **Preserve**: All other styling and functionality
- **Preserve**: Tab focus behavior, aria-label, keyboard activation

**Icon Contract** (updated for consistency):
- Light mode: Show `<Moon />` icon (indicating "switch to dark mode")
- Dark mode: Show `<Sun />` icon (indicating "switch to light mode")
- Icon size: `w-5 h-5` (20px × 20px)
- Must import from lucide-react: `import { Sun, Moon } from 'lucide-react';`

**Consistency Requirement**:
ThemeToggle MUST use lucide-react icons (not inline SVGs) to match FullscreenToggle and CloseButton. All three buttons in the title bar must use the same icon source for visual consistency.

**New Usage Context**:
```tsx
<TitleBar>
  {/* ThemeToggle now rendered inside TitleBar, not as fixed element */}
  <ThemeToggle />
</TitleBar>
```

---

## useFullscreen Hook

**File**: `src/hooks/useFullscreen.ts`

**Return Interface**:
```typescript
interface UseFullscreenReturn {
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
}
```

**Contract**:
```typescript
function useFullscreen(): UseFullscreenReturn
```

**Behavior Contract**:

1. **Initial State**:
   - Reads `localStorage.getItem('fullscreenPreference')`
   - Defaults to `false` if not set or invalid
   - Applies saved state to window on mount

2. **toggleFullscreen()**:
   - Toggles `isFullscreen` state
   - Calls `setResizable(false)` before `setFullscreen(true)` (entering)
   - Calls `setFullscreen(newState)` with new state
   - Calls `setResizable(true)` after `setFullscreen(false)` (exiting)
   - Saves new state to `localStorage.setItem('fullscreenPreference', String(newState))`
   - Returns Promise that resolves when all operations complete

3. **Escape Key Handling**:
   - Listens to document `keydown` events
   - When `event.code === 'Escape'` and `isFullscreen === true`:
     - Calls `toggleFullscreen()`
   - Cleans up listener on unmount

**Usage**:
```typescript
const { isFullscreen, toggleFullscreen } = useFullscreen();
```

---

## Styling Consistency Contract

All three window control buttons (ThemeToggle, FullscreenToggle, CloseButton) must share:

**Button Base Classes**:
```css
p-2                    /* Padding: 8px all sides */
rounded-lg             /* Border radius: 8px */
border                 /* Border width: 1px */
border-ink/20          /* Border color: ink with 20% opacity */
bg-paper               /* Background: paper theme color */
text-ink               /* Text color: ink theme color */
```

**Hover State**:
```css
hover:bg-ink/5         /* Background on hover: ink with 5% opacity */
```

**Focus State**:
```css
focus:outline-none     /* Remove default outline */
focus:ring-2           /* Focus ring width: 2px */
focus:ring-vermillion  /* Focus ring color: vermillion accent */
focus:ring-offset-2    /* Focus ring offset: 2px */
```

**Transition**:
```css
transition-colors      /* Smooth color transitions */
```

**Icon Size**:
```css
w-5 h-5                /* Icon dimensions: 20px × 20px */
```

**Total Button Size**:
- Padding: 8px × 2 = 16px
- Icon: 20px
- Border: 1px × 2 = 2px
- **Total**: ~38px × 38px (approximately)

---

## Tab Order Contract

**Requirement**: FR-013 specifies Tab navigation order

**Implementation**:
```tsx
<TitleBar>
  <h1>Hanzi Ruby Lens</h1>
  <div className="flex gap-2">
    <ThemeToggle />      {/* Tab index 1 */}
    <FullscreenToggle /> {/* Tab index 2 */}
    <CloseButton />      {/* Tab index 3 */}
  </div>
</TitleBar>
```

**Natural Tab Order**: Left-to-right in source order (no explicit `tabIndex` needed)

**Focus Indicators**: All buttons must show visible focus ring when focused

**Keyboard Activation**: All buttons activate on Enter key (native `<button>` behavior)

---

## Theme Integration Contract

**Theme Colors**:
- `bg-paper`: Background color for buttons (light/dark mode aware)
- `text-ink`: Text/icon color (light/dark mode aware)
- `border-ink/20`: Border color with opacity
- `hover:bg-ink/5`: Hover background with opacity
- `focus:ring-vermillion`: Focus ring uses accent color

**Theme Hook** (if used):
```typescript
// Assumed from existing ThemeToggle implementation
const { theme, setTheme } = useTheme();
```

**No theme changes** required for this feature (uses existing theme system)

---

## Testing Contracts

### Component Test Requirements

**TitleBar**:
- ✅ Renders with correct height (48px)
- ✅ Contains title text "Hanzi Ruby Lens"
- ✅ Contains all three buttons
- ✅ Has `data-tauri-drag-region` attribute
- ✅ Has cursor grab classes

**FullscreenToggle**:
- ✅ Renders Maximize icon when not fullscreen
- ✅ Renders Minimize icon when fullscreen
- ✅ Calls `toggleFullscreen()` on click
- ✅ Has correct aria-label based on state
- ✅ Matches ThemeToggle styling

**CloseButton**:
- ✅ Renders X icon
- ✅ Calls `getCurrentWindow().close()` on click
- ✅ Has aria-label "Close application"
- ✅ Matches ThemeToggle styling

**useFullscreen Hook**:
- ✅ Returns initial state from localStorage
- ✅ Toggles state when `toggleFullscreen()` called
- ✅ Persists state to localStorage
- ✅ Calls Tauri window API methods in correct order
- ✅ Handles Escape key when fullscreen

---

## Type Exports

**Public Exports** (from component files):

```typescript
// src/components/TitleBar.tsx
export { TitleBar };

// src/components/FullscreenToggle.tsx
export { FullscreenToggle };

// src/components/CloseButton.tsx
export { CloseButton };

// src/hooks/useFullscreen.ts
export { useFullscreen };
export type { UseFullscreenReturn }; // Optional: for consumers who need the type
```

---

## Breaking Changes

**From Previous Implementation**:

1. **MinWidthOverlay** - Component removed entirely
2. **useMinWidth** - Hook removed entirely
3. **ThemeToggle** - No longer positioned fixed, must be placed inside TitleBar
4. **App.tsx** - Must import and render TitleBar component

**Migration Path**:
```tsx
// OLD (to be removed)
<MinWidthOverlay />
<ThemeToggle />

// NEW (to be implemented)
<TitleBar />
```
