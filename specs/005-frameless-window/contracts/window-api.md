# Window API Contract

**Feature**: 005-frameless-window
**API**: Tauri 2 Window Control
**Type**: Frontend → Tauri Backend

## Overview

This contract defines the Tauri 2 Window API surface used by the frameless window feature. All methods are provided by `@tauri-apps/api/window`.

---

## Import

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';
```

---

## Methods

### getCurrentWindow()

**Description**: Returns the current window instance

**Signature**:
```typescript
function getCurrentWindow(): Window
```

**Returns**: `Window` object with control methods

**Usage**:
```typescript
const appWindow = getCurrentWindow();
```

---

### Window.setFullscreen()

**Description**: Sets the window to fullscreen or windowed mode

**Signature**:
```typescript
async setFullscreen(fullscreen: boolean): Promise<void>
```

**Parameters**:
- `fullscreen: boolean` - `true` to enter fullscreen, `false` to exit

**Returns**: `Promise<void>` - Resolves when state change complete

**Errors**: Rejects if window cannot enter/exit fullscreen

**Usage**:
```typescript
await appWindow.setFullscreen(true);  // Enter fullscreen
await appWindow.setFullscreen(false); // Exit fullscreen
```

**Side Effects**:
- Window transitions to/from fullscreen mode
- Window decorations hidden/shown (if applicable)
- Window size changes to fill screen (fullscreen) or restore previous size (windowed)

---

### Window.isFullscreen()

**Description**: Checks if the window is currently in fullscreen mode

**Signature**:
```typescript
async isFullscreen(): Promise<boolean>
```

**Returns**: `Promise<boolean>` - `true` if fullscreen, `false` otherwise

**Usage**:
```typescript
const isFullscreen = await appWindow.isFullscreen();
```

---

### Window.setResizable()

**Description**: Sets whether the window can be manually resized

**Signature**:
```typescript
async setResizable(resizable: boolean): Promise<void>
```

**Parameters**:
- `resizable: boolean` - `true` to allow resize, `false` to prevent

**Returns**: `Promise<void>` - Resolves when state change complete

**Usage**:
```typescript
await appWindow.setResizable(false); // Disable resize (for fullscreen)
await appWindow.setResizable(true);  // Enable resize (for windowed)
```

**Note**: Disabling resize does not prevent resized events from DPI scaling or fullscreen transitions

---

### Window.close()

**Description**: Closes the window gracefully, emitting closeRequested event

**Signature**:
```typescript
async close(): Promise<void>
```

**Returns**: `Promise<void>` - Resolves when window close initiated

**Usage**:
```typescript
await appWindow.close();
```

**Side Effects**:
- Emits `closeRequested` event (can be intercepted)
- Window closes if event not prevented
- Application may exit if this is the last window

---

### Window.startDragging()

**Description**: Initiates window dragging from current cursor position (alternative to data-tauri-drag-region)

**Signature**:
```typescript
async startDragging(): Promise<void>
```

**Returns**: `Promise<void>` - Resolves when dragging completes

**Usage**:
```typescript
await appWindow.startDragging();
```

**Note**: This feature uses the declarative `data-tauri-drag-region` attribute instead, so this method is not directly used

---

## Required Permissions

These permissions must be configured in `src-tauri/capabilities/default.json` or `tauri.conf.json`:

```json
{
  "permissions": [
    "core:window:allow-set-fullscreen",
    "core:window:allow-is-fullscreen",
    "core:window:allow-set-resizable",
    "core:window:allow-close",
    "core:window:allow-start-dragging",
    "core:window:default"
  ]
}
```

---

## Error Handling

All async methods return Promises that may reject. Recommended error handling:

```typescript
try {
  await appWindow.setFullscreen(true);
} catch (error) {
  console.error('Failed to set fullscreen:', error);
  // Optionally update UI to reflect failed state change
}
```

---

## Window Configuration Contract

**File**: `src-tauri/tauri.conf.json`

**Schema**:
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

**Property Contracts**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | Yes | Window identifier (must be "main") |
| `title` | string | Yes | Window title (shown in taskbar) |
| `width` | number | Yes | Default window width in pixels |
| `height` | number | Yes | Default window height in pixels |
| `minWidth` | number | Yes | Minimum width (enforced by OS) |
| `minHeight` | number | Yes | Minimum height (enforced by OS) |
| `decorations` | boolean | Yes | `false` to hide native title bar |
| `shadow` | boolean | Yes | `true` to add thin border for resize |
| `resizable` | boolean | Yes | `true` to allow window resizing |

---

## Data Attribute Contract

**Drag Region**: `data-tauri-drag-region`

**Type**: HTML attribute (no value required)

**Behavior**:
- Makes the element act as a window drag region
- Only applies to the element itself (not children)
- Interactive elements inside remain clickable
- Works with mouse, touch, and pen inputs (on Windows)

**Usage**:
```tsx
<div data-tauri-drag-region>
  <h1>Title</h1>
  <button>Click me</button> {/* Still clickable */}
</div>
```

**CSS Requirements**:
- `user-select: none` recommended to prevent text selection
- `cursor: grab` and `cursor: grabbing` for visual feedback

---

## Testing Contract

**Mock Requirements**:

For unit tests, mock the Window API:

```typescript
// Test setup
const mockWindow = {
  setFullscreen: vi.fn().mockResolvedValue(undefined),
  isFullscreen: vi.fn().mockResolvedValue(false),
  setResizable: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => mockWindow,
}));
```

**Contract Tests**:
1. Verify `setFullscreen(true)` is called when entering fullscreen
2. Verify `setFullscreen(false)` is called when exiting fullscreen
3. Verify `setResizable(false)` is called before `setFullscreen(true)`
4. Verify `setResizable(true)` is called after `setFullscreen(false)`
5. Verify `close()` is called when close button clicked
6. Verify `isFullscreen()` is called to check initial state

---

## Versioning

**Tauri Version**: 2.x
**API Package**: `@tauri-apps/api` ^2.0.0

**Breaking Changes**:
- Tauri 1.x used `appWindow` from `@tauri-apps/api/window`
- Tauri 2.x uses `getCurrentWindow()` function instead

**Migration**: Not applicable (project already uses Tauri 2)
