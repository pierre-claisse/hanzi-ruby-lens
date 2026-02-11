# Quick Start: Frameless Window Implementation

**Feature**: 005-frameless-window
**Estimated Time**: 2-3 hours
**Difficulty**: Intermediate

## Overview

This guide walks through implementing a frameless window with custom title bar, window controls, and fullscreen functionality in a Tauri 2 + React application.

---

## Prerequisites

- Tauri 2 project with React frontend (✅ already set up)
- Docker environment for testing (✅ already configured)
- Existing ThemeToggle component (✅ present at `src/components/ThemeToggle.tsx`)

---

## Implementation Steps

### Step 1: Install Dependencies

Add lucide-react for icon components:

```bash
npm install lucide-react
```

**Time**: 2 minutes

---

### Step 2: Configure Tauri Window

Update `src-tauri/tauri.conf.json`:

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
    ],
    "security": {
      "csp": null,
      "capabilities": [
        {
          "identifier": "main-window",
          "description": "Main window permissions",
          "windows": ["main"],
          "permissions": [
            "core:window:allow-close",
            "core:window:allow-set-fullscreen",
            "core:window:allow-is-fullscreen",
            "core:window:allow-set-resizable",
            "core:window:allow-start-dragging",
            "core:window:default"
          ]
        }
      ]
    }
  }
}
```

**Changes**:
- Set default size to 1024×768
- Add `minWidth: 800`, `minHeight: 600`
- Set `decorations: false` to hide native title bar
- Set `shadow: true` for thin border and resize functionality
- Add window control permissions

**Time**: 5 minutes

---

### Step 3: Create useFullscreen Hook

Create `src/hooks/useFullscreen.ts`:

```typescript
import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
}

export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(() => {
    return localStorage.getItem('fullscreenPreference') === 'true';
  });

  // Apply saved state on mount
  useEffect(() => {
    const appWindow = getCurrentWindow();
    appWindow.setFullscreen(isFullscreen);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.code === 'Escape' && isFullscreen) {
        await toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    const appWindow = getCurrentWindow();
    const newState = !isFullscreen;

    if (newState) {
      await appWindow.setResizable(false);
      await appWindow.setFullscreen(true);
    } else {
      await appWindow.setFullscreen(false);
      await appWindow.setResizable(true);
    }

    setIsFullscreen(newState);
    localStorage.setItem('fullscreenPreference', String(newState));
  };

  return { isFullscreen, toggleFullscreen };
}
```

**Time**: 10 minutes

---

### Step 4: Create FullscreenToggle Component

Create `src/components/FullscreenToggle.tsx`:

```typescript
import { Maximize, Minimize } from 'lucide-react';
import { useFullscreen } from '../hooks/useFullscreen';

export function FullscreenToggle() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <button
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      className="p-2 rounded-lg border border-ink/20 bg-paper text-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 transition-colors"
    >
      {isFullscreen ? (
        <Minimize className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Maximize className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
}
```

**Time**: 5 minutes

---

### Step 5: Create CloseButton Component

Create `src/components/CloseButton.tsx`:

```typescript
import { X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function CloseButton() {
  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  return (
    <button
      onClick={handleClose}
      aria-label="Close application"
      className="p-2 rounded-lg border border-ink/20 bg-paper text-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 transition-colors"
    >
      <X className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}
```

**Time**: 5 minutes

---

### Step 6: Refactor ThemeToggle Component

Edit `src/components/ThemeToggle.tsx`:

**Remove**:
```tsx
className="fixed top-6 right-6 z-10 ..."
```

**Replace with**:
```tsx
className="p-2 rounded-lg border border-ink/20 bg-paper text-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 transition-colors"
```

**Replace inline SVG icons with lucide-react** (for consistency):

```typescript
import { Sun, Moon } from 'lucide-react';

// Replace inline SVGs with:
{theme === "dark" ? (
  <Sun className="w-5 h-5" aria-hidden="true" />
) : (
  <Moon className="w-5 h-5" aria-hidden="true" />
)}
```

**Rationale**: Since we're adding lucide-react as a dependency for the new icons (Maximize, Minimize, X), we should use it consistently for ALL icons including ThemeToggle. This ensures uniform icon sizing, easier maintenance, and better tree-shaking.

**Time**: 5 minutes

---

### Step 7: Create TitleBar Component

Create `src/components/TitleBar.tsx`:

```typescript
import { ThemeToggle } from './ThemeToggle';
import { FullscreenToggle } from './FullscreenToggle';
import { CloseButton } from './CloseButton';

export function TitleBar() {
  return (
    <header
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-12 bg-paper border-b border-ink/10 flex items-center justify-between px-4 z-50 select-none cursor-grab active:cursor-grabbing"
    >
      <h1 className="text-sm text-ink font-medium">Hanzi Ruby Lens</h1>

      <div className="flex gap-2">
        <ThemeToggle />
        <FullscreenToggle />
        <CloseButton />
      </div>
    </header>
  );
}
```

**Time**: 5 minutes

---

### Step 8: Update App.tsx

Edit `src/App.tsx`:

**Add import**:
```typescript
import { TitleBar } from './components/TitleBar';
```

**Remove**:
```typescript
import { MinWidthOverlay } from './components/MinWidthOverlay';
import { ThemeToggle } from './components/ThemeToggle'; // Remove if was imported standalone
```

**Update JSX**:
```tsx
function App() {
  return (
    <>
      <TitleBar />
      {/* Remove: <MinWidthOverlay /> */}
      {/* Remove: <ThemeToggle /> if rendered standalone */}

      <main className="pt-12"> {/* Add padding-top to account for title bar */}
        {/* Existing app content */}
      </main>
    </>
  );
}
```

**Time**: 5 minutes

---

### Step 9: Update Styles (index.css)

Add title bar cursor styles if not already present:

```css
/* Drag region cursor styles */
[data-tauri-drag-region] {
  cursor: grab;
  user-select: none;
}

[data-tauri-drag-region]:active {
  cursor: grabbing;
}
```

**Time**: 2 minutes

---

### Step 10: Delete Obsolete Components

Remove the following files:

```bash
rm src/components/MinWidthOverlay.tsx
rm src/hooks/useMinWidth.ts
```

**Time**: 1 minute

---

### Step 11: Update Tests

Edit `src/App.test.tsx`:

**Remove MinWidthOverlay test** (if exists)

**Update ThemeToggle test**:
```typescript
it("renders ThemeToggle button inside TitleBar", () => {
  render(<App />);
  const themeToggleButton = screen.getByRole("button", {
    name: /switch to (light|dark) mode/i
  });
  expect(themeToggleButton).toBeInTheDocument();
});
```

**Add TitleBar test**:
```typescript
it("renders TitleBar with title and three buttons", () => {
  render(<App />);

  // Check title
  const title = screen.getByText("Hanzi Ruby Lens");
  expect(title).toBeInTheDocument();

  // Check buttons
  const buttons = screen.getAllByRole("button");
  expect(buttons).toHaveLength(3); // Theme, Fullscreen, Close
});
```

**Time**: 10 minutes

---

### Step 12: Test in Docker

Run tests:

```bash
npm run test
```

Build the application:

```bash
npm run build
```

**Time**: 5-10 minutes (depending on build time)

---

## Verification Checklist

After implementation, verify:

- [ ] Application launches without native title bar
- [ ] Window has thin border for resizing
- [ ] Window can be resized using edges/corners
- [ ] Window cannot be resized below 800×600px
- [ ] Title bar displays "Hanzi Ruby Lens" at 14px
- [ ] Hovering over title bar shows grab cursor
- [ ] Clicking and dragging title bar moves window
- [ ] Buttons do not trigger drag when clicked
- [ ] ThemeToggle button works (switches theme)
- [ ] FullscreenToggle button toggles fullscreen
- [ ] CloseButton closes the application
- [ ] Tab key navigates: Theme → Fullscreen → Close
- [ ] Enter key activates focused button
- [ ] Escape key exits fullscreen mode
- [ ] Fullscreen preference persists across app restarts
- [ ] All tests pass

---

## Troubleshooting

### Window doesn't show thin border

**Issue**: `shadow: true` not working on Windows

**Solution**: Check Windows version (works on Win10/11). Try setting `transparent: false` explicitly.

---

### Drag region not working

**Issue**: `data-tauri-drag-region` attribute not recognized

**Solution**: Verify Tauri 2 is installed correctly. Check permissions in `tauri.conf.json`.

---

### Fullscreen not persisting

**Issue**: localStorage not saving

**Solution**: Check browser console for errors. Ensure `localStorage.setItem()` is called after state change.

---

### Tests failing

**Issue**: Tauri window API not mocked

**Solution**: Add mock in test setup:

```typescript
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    setFullscreen: vi.fn().mockResolvedValue(undefined),
    isFullscreen: vi.fn().mockResolvedValue(false),
    setResizable: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));
```

---

## Time Breakdown

| Step | Task | Time |
|------|------|------|
| 1 | Install dependencies | 2 min |
| 2 | Configure Tauri window | 5 min |
| 3 | Create useFullscreen hook | 10 min |
| 4 | Create FullscreenToggle | 5 min |
| 5 | Create CloseButton | 5 min |
| 6 | Refactor ThemeToggle | 5 min |
| 7 | Create TitleBar | 5 min |
| 8 | Update App.tsx | 5 min |
| 9 | Update styles | 2 min |
| 10 | Delete obsolete files | 1 min |
| 11 | Update tests | 10 min |
| 12 | Test in Docker | 10 min |
| **Total** | | **~65 min** |

---

## Next Steps

After completing this feature:

1. Run `/speckit.tasks` to generate implementation task breakdown
2. Run `/speckit.implement` to execute tasks
3. Create git commit with message referencing feature spec
4. Test manually on Windows 10 and Windows 11
5. Verify accessibility with keyboard-only navigation

---

## Reference Files

- **Spec**: [spec.md](spec.md)
- **Research**: [research.md](research.md)
- **Data Model**: [data-model.md](data-model.md)
- **API Contract**: [contracts/window-api.md](contracts/window-api.md)
- **Component Contract**: [contracts/component-props.md](contracts/component-props.md)
