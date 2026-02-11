# Research: Frameless Window with Custom Title Bar

**Feature**: 005-frameless-window
**Date**: 2026-02-11
**Phase**: 0 - Technical Research

## Overview

This document consolidates research findings for implementing a frameless Tauri 2 window with custom title bar, window controls, and fullscreen functionality.

---

## 1. Tauri 2 Frameless Window Configuration

### Decision: Use `decorations: false` with `shadow: true`

**Rationale**:
- `decorations: false` hides native Windows title bar and system buttons
- `shadow: true` provides a thin native border (1-2px) for resize functionality
- On Windows 11: Creates a 1px white border with rounded corners
- On Windows 10: Provides a thin border for resize handles
- This combination achieves the "mostly borderless aesthetic" while preserving native Windows resize behavior

**Configuration** (`src-tauri/tauri.conf.json`):
```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Hanzi Ruby Lens",
        "width": 1024,
        "height": 768,
        "minWidth": 800,
        "minHeight": 600,
        "decorations": false,
        "shadow": true,
        "resizable": true
      }
    ]
  }
}
```

**Alternatives Considered**:
- `transparent: true` with custom border - Rejected because it requires custom resize zone implementation and has DPI scaling issues
- Fully borderless (no shadow) - Rejected because users would have difficulty resizing the window

**Required Permissions**:
```json
{
  "app": {
    "security": {
      "capabilities": [
        {
          "identifier": "main-window",
          "description": "Main window permissions",
          "windows": ["main"],
          "permissions": [
            "core:window:allow-close",
            "core:window:allow-minimize",
            "core:window:allow-maximize",
            "core:window:allow-unmaximize",
            "core:window:allow-toggle-maximize",
            "core:window:allow-start-dragging",
            "core:window:allow-set-fullscreen",
            "core:window:allow-is-fullscreen",
            "core:window:allow-set-resizable",
            "core:window:default"
          ]
        }
      ]
    }
  }
}
```

---

## 2. Window Drag Region Implementation

### Decision: Use `data-tauri-drag-region` attribute

**Rationale**:
- Declarative approach is simpler and more maintainable
- No manual event handling required
- Tauri handles all native drag behavior automatically
- Interactive elements (buttons) inside drag region remain clickable by default

**Implementation Pattern**:
```tsx
<div
  data-tauri-drag-region
  className="h-12 cursor-grab active:cursor-grabbing select-none"
>
  <h1>Hanzi Ruby Lens</h1>
  {/* Buttons remain interactive without special handling */}
</div>
```

**CSS Requirements**:
- `cursor: grab` - Shows open hand when hovering over drag region
- `cursor: grabbing` - Shows closed hand when actively dragging (`:active` pseudo-class)
- `user-select: none` - Prevents text selection during drag
- Title bar must use `position: fixed` with `top: 0` to stick to window top

**Alternatives Considered**:
- `getCurrentWindow().startDragging()` programmatic API - Rejected because it requires manual event handling and provides no benefit for our use case

**Known Windows Issues**:
- Focus toggling when clicking drag regions (minor UX issue)
- Rare stuck dragging state (mitigated by system-level handling)
- DPI scaling quirks when dragging between monitors (acceptable limitation)

---

## 3. Fullscreen Window Management

### Decision: Use `setFullscreen()` with localStorage persistence

**Rationale**:
- `setFullscreen(boolean)` provides simple, platform-agnostic fullscreen toggle
- localStorage is sufficient for UI preference (no need for Tauri Store plugin overhead)
- Manual Escape key handling provides better UX control
- Window resize control (disable in fullscreen) prevents resize artifacts

**Core API Methods**:
```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

// Toggle fullscreen
await appWindow.setFullscreen(true);  // Enter
await appWindow.setFullscreen(false); // Exit

// Check state
const isFullscreen = await appWindow.isFullscreen();

// Control resizing
await appWindow.setResizable(false); // Disable in fullscreen
await appWindow.setResizable(true);  // Enable in windowed
```

**Persistence Strategy**:
```typescript
// Save preference
localStorage.setItem('fullscreenPreference', String(isFullscreen));

// Load on mount
const saved = localStorage.getItem('fullscreenPreference') === 'true';
```

**Escape Key Handling**:
```typescript
useEffect(() => {
  const handleKeyDown = async (event: KeyboardEvent) => {
    if (event.code === 'Escape' && isFullscreen) {
      const appWindow = getCurrentWindow();
      await appWindow.setFullscreen(false);
      // Update state and persistence
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isFullscreen]);
```

**Alternatives Considered**:
- Tauri Store plugin - Rejected as over-engineering for a single boolean preference
- Window State plugin - Rejected because we only need fullscreen state, not window size/position
- `toggleSimpleFullscreen()` (macOS) - Not needed, Windows-only application

---

## 4. Window Close API

### Decision: Use `close()` for graceful shutdown

**Rationale**:
- `close()` emits `closeRequested` event, allowing cleanup before shutdown
- Cannot distinguish between close sources (button vs Alt+F4 vs taskbar), so treat uniformly
- Single cleanup handler for all close scenarios is simpler and more reliable

**Implementation Pattern**:
```typescript
// Close button handler
const handleClose = async () => {
  const appWindow = getCurrentWindow();
  await appWindow.close(); // Triggers closeRequested event
};

// Cleanup listener (optional, for future state persistence)
useEffect(() => {
  const appWindow = getCurrentWindow();

  const setupListener = async () => {
    const unlisten = await appWindow.onCloseRequested(async (event) => {
      // Perform cleanup/save state
      await saveAppState();
    });
    return unlisten;
  };

  let unlistenFn: (() => void) | undefined;
  setupListener().then((fn) => { unlistenFn = fn; });

  return () => {
    if (unlistenFn) unlistenFn();
  };
}, []);
```

**Alternatives Considered**:
- `destroy()` - Rejected because it bypasses cleanup handlers
- Distinguishing close sources - Not supported by Tauri 2 API
- Browser `beforeunload` event - Not supported in Tauri

**Known Limitations**:
- `closeRequested` may not fire on system shutdown or Task Manager kill
- No way to distinguish user-initiated close from OS-initiated close

---

## 5. Icon Library Selection

### Decision: Add lucide-react for icon components

**Rationale**:
- Consistent with existing UI patterns (lightweight, tree-shakeable)
- Provides all needed icons (Maximize, Minimize, X, Sun, Moon)
- Better than inline SVG for maintainability and consistency
- Already used by many Tailwind CSS / React projects

**Required Installation**:
```bash
npm install lucide-react
```

**Icon Mapping**:
- **Fullscreen expand**: `Maximize` (diagonal arrows pointing to corners)
- **Fullscreen compress**: `Minimize` (diagonal arrows pointing to center)
- **Close button**: `X` (simple X symbol)
- **Theme toggle**: `Sun` and `Moon` (MUST replace existing inline SVGs for consistency)

**Import Statement**:
```typescript
import { Maximize, Minimize, X, Sun, Moon } from 'lucide-react';
```

**Usage Pattern**:
```tsx
{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
<X className="w-5 h-5" />
{theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
```

**Alternatives Considered**:
- Keep inline SVGs for ThemeToggle - Rejected for consistency (mixing icon sources is poor practice)
- Use different icon library (heroicons, react-icons) - Rejected because lucide-react is lighter and more widely used with Tailwind

**Consistency Rationale**:
Since lucide-react is being added as a dependency, ALL icons in the title bar must use it. This ensures:
- Uniform icon sizing and stroke width across all buttons
- Single source of truth for icon components
- Better tree-shaking (import only what's needed from one library)
- Easier future icon updates (change library once, not multiple inline SVGs)

---

## 6. Component Architecture

### Decision: Three new components + refactor ThemeToggle

**Components to Create**:

1. **TitleBar.tsx** - Container component
   - Renders title text and control buttons
   - Applies `data-tauri-drag-region` attribute
   - Uses `position: fixed`, `top: 0`, `z-index` for stacking
   - Height: 48px (3rem)

2. **FullscreenToggle.tsx** - Fullscreen button
   - Matches ThemeToggle styling (copied from existing patterns)
   - Uses `useFullscreen` hook for state management
   - Shows Maximize/Minimize icon based on state
   - Accessible: Tab navigation, Enter activation, aria-label

3. **CloseButton.tsx** - Close button
   - Matches ThemeToggle styling
   - Calls `getCurrentWindow().close()`
   - Shows X icon
   - Accessible: Tab navigation, Enter activation, aria-label

**Component to Refactor**:

4. **ThemeToggle.tsx** - Move from fixed positioning
   - Remove `fixed top-6 right-6` classes
   - Become a simple button without positioning
   - Parent (TitleBar) will control layout

**Shared Styling Pattern** (from existing ThemeToggle):
```tsx
className="p-2 rounded-lg border border-ink/20 bg-paper text-ink
           hover:bg-ink/5 focus:outline-none focus:ring-2
           focus:ring-vermillion focus:ring-offset-2 transition-colors"
```

**Hook to Create**:

5. **useFullscreen.ts** - Fullscreen state management
   - Loads persisted preference from localStorage
   - Provides `isFullscreen` state and `toggleFullscreen` function
   - Handles Escape key listener
   - Manages window resizability (disable in fullscreen)

**Components to Remove**:

6. **MinWidthOverlay.tsx** - Delete (FR-024)
7. **useMinWidth.ts** - Delete (FR-024)

**Rationale**:
- Separation of concerns (each button is independent)
- Reusability (buttons can be tested/styled independently)
- Matches existing project structure (components in `src/components/`, hooks in `src/hooks/`)
- Easy to maintain consistent styling across buttons

---

## 7. Test Strategy

### Contract Tests
- Title bar renders with correct height (48px)
- Title text displays "Hanzi Ruby Lens" at 14px font size
- Three buttons present: ThemeToggle, FullscreenToggle, CloseButton
- `data-tauri-drag-region` attribute present on title bar

### Integration Tests
- Clicking fullscreen button toggles state
- Fullscreen preference persists across mounts/unmounts (localStorage)
- Escape key exits fullscreen when in fullscreen mode
- Tab navigation moves through buttons in correct order
- Enter key activates focused button

### Unit Tests
- `useFullscreen` hook returns correct initial state
- `useFullscreen` hook persists state to localStorage
- Each button component renders with correct aria-label
- Cursor classes applied correctly (grab/grabbing)

---

## Sources

- [Window Customization | Tauri v2](https://v2.tauri.app/learn/window-customization/)
- [Configuration Reference | Tauri v2](https://v2.tauri.app/reference/config/)
- [Window API Reference | Tauri v2](https://v2.tauri.app/reference/javascript/api/namespacewindow/)
- [Capabilities Configuration | Tauri v2](https://v2.tauri.app/security/capabilities/)
- [Core Permissions | Tauri v2](https://v2.tauri.app/reference/acl/core-permissions/)
- [Lucide React Icons](https://lucide.dev/guide/packages/lucide-react)
