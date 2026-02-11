# Data Model: Frameless Window with Custom Title Bar

**Feature**: 005-frameless-window
**Date**: 2026-02-11
**Phase**: 1 - Data & Contracts

## Overview

This feature is primarily a **UI-only change** with minimal state management. No domain model changes are required (no Text or Word entities affected). The only persistent data is a single UI preference.

---

## State Management

### Fullscreen Preference

**Storage**: Browser localStorage
**Key**: `fullscreenPreference`
**Type**: `string` (serialized boolean: `"true"` | `"false"`)
**Scope**: Per-browser profile (not synced across devices)

**Schema**:
```typescript
// No formal schema - simple key-value storage
localStorage.setItem('fullscreenPreference', 'true' | 'false');
const value = localStorage.getItem('fullscreenPreference'); // string | null
```

**Lifecycle**:
- **Created**: First time user toggles fullscreen
- **Updated**: Every time fullscreen state changes (button click or Escape key)
- **Read**: On application mount to restore previous state
- **Deleted**: Never (persists indefinitely unless user clears browser data)

**Validation Rules**:
- Must be parseable as boolean (strict equality check with `'true'`)
- Defaults to `false` if missing or invalid

**Why localStorage?**:
- Simple UI preference (not domain data)
- No need for Tauri Store plugin overhead
- No synchronization across devices required
- Follows existing theme toggle pattern (if theme uses localStorage)

---

## Component State

### TitleBar Component

**Local State**: None (stateless container)

**Props**: None (self-contained)

**Responsibilities**:
- Render title text ("Hanzi Ruby Lens")
- Render three control buttons (ThemeToggle, FullscreenToggle, CloseButton)
- Provide drag region via `data-tauri-drag-region` attribute
- Apply cursor styles (grab/grabbing)

---

### FullscreenToggle Component

**Local State**:
```typescript
interface FullscreenState {
  isFullscreen: boolean; // Current fullscreen state
}
```

**State Source**: `useFullscreen()` custom hook

**State Transitions**:
```
[Windowed] --click button--> [Fullscreen]
[Fullscreen] --click button--> [Windowed]
[Fullscreen] --press Escape--> [Windowed]
```

**Side Effects**:
- State change triggers `getCurrentWindow().setFullscreen(newState)`
- State change triggers `localStorage.setItem('fullscreenPreference', String(newState))`
- Entering fullscreen triggers `getCurrentWindow().setResizable(false)`
- Exiting fullscreen triggers `getCurrentWindow().setResizable(true)`

---

### CloseButton Component

**Local State**: None (stateless)

**Action**: Calls `getCurrentWindow().close()` on click

**Side Effects**: Application window closes, triggering OS shutdown sequence

---

### ThemeToggle Component

**Local State**: Unchanged (existing component)

**Changes**: Only positioning removed (no longer `fixed top-6 right-6`)

---

## Hooks

### useFullscreen Hook

**Return Type**:
```typescript
interface UseFullscreenReturn {
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
}
```

**Internal State**:
```typescript
const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
  return localStorage.getItem('fullscreenPreference') === 'true';
});
```

**Effects**:
1. **Mount Effect**: Apply saved fullscreen state to window
   ```typescript
   useEffect(() => {
     getCurrentWindow().setFullscreen(isFullscreen);
   }, []);
   ```

2. **Escape Key Effect**: Listen for Escape key to exit fullscreen
   ```typescript
   useEffect(() => {
     const handler = (e: KeyboardEvent) => {
       if (e.code === 'Escape' && isFullscreen) {
         toggleFullscreen();
       }
     };
     document.addEventListener('keydown', handler);
     return () => document.removeEventListener('keydown', handler);
   }, [isFullscreen]);
   ```

---

## Entities

### Key Entities (from Spec)

**Title Bar**:
- Type: UI Component
- Properties:
  - Height: 48px (3rem)
  - Title text: "Hanzi Ruby Lens" (14px font size)
  - Position: Fixed to top of window
  - Drag region: Entire bar except buttons
  - Cursor: grab (hover) / grabbing (active)

**Drag Region**:
- Type: UI Behavior
- Properties:
  - Enabled via `data-tauri-drag-region` attribute
  - Excludes interactive elements (buttons)
  - Visual feedback: cursor changes

**Window Control Buttons**:
- Type: UI Components (3 instances)
- Properties:
  - Dimensions: Consistent with existing ThemeToggle (~36px total size)
  - Padding: 8px (p-2)
  - Icon size: 20px (w-5 h-5)
  - States: default, hover, focus, active
  - Tab order: ThemeToggle → FullscreenToggle → CloseButton

---

## Relationships

```
TitleBar
├── Title Text (static, non-selectable)
└── Button Container
    ├── ThemeToggle (existing, refactored)
    ├── FullscreenToggle (new, uses useFullscreen hook)
    └── CloseButton (new, stateless)

useFullscreen Hook
├── reads from: localStorage (on mount)
├── writes to: localStorage (on state change)
└── controls: Tauri window API (setFullscreen, setResizable)
```

---

## No Domain Model Changes

This feature does **not** interact with:
- **Text** aggregate (no changes to Chinese text storage or display)
- **Word** entities (no changes to pinyin or segmentation)
- SQLite database (no persistence layer changes)
- LLM integration (no API calls)

All changes are confined to the **UI/presentation layer**.

---

## Removed Components

### MinWidthOverlay Component
- **Status**: DELETE (per FR-024)
- **Reason**: OS-level minimum size enforcement makes overlay obsolete
- **Impact**: No data migration needed (component was stateless)

### useMinWidth Hook
- **Status**: DELETE (per FR-024)
- **Reason**: No longer needed with OS-level size constraints
- **Impact**: Remove all usage from App.tsx

---

## Migration Notes

**No data migration required** - this is a pure UI feature.

**Breaking changes**: None (existing functionality preserved)

**Rollback safety**: High (can revert by reverting git commits, no persistent data to clean up)
