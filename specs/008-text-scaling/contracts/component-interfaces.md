# Component Interface Contracts: Text Scaling Controls

**Date**: 2026-02-12

## C1: useTextZoom Hook

```typescript
interface UseTextZoomReturn {
  /** Current zoom level: 50-200, always a multiple of 10 */
  zoomLevel: number;
  /** Increase zoom by 10%. No-op at MAX_ZOOM (200). */
  zoomIn: () => void;
  /** Decrease zoom by 10%. No-op at MIN_ZOOM (50). */
  zoomOut: () => void;
  /** True when zoomLevel === 50 (minimum boundary) */
  isMinZoom: boolean;
  /** True when zoomLevel === 200 (maximum boundary) */
  isMaxZoom: boolean;
}

function useTextZoom(): UseTextZoomReturn;
```

**Behavioral contract**:
- On mount: reads `localStorage.getItem("textZoomLevel")`, validates (integer, multiple of 10, within [50,200]), defaults to 100 if invalid or missing
- On zoomLevel change: writes `localStorage.setItem("textZoomLevel", String(zoomLevel))`
- Keyboard listener: `document.addEventListener("keydown", ...)` for Ctrl+=/+ (zoom in) and Ctrl+- (zoom out), calls `e.preventDefault()`
- Error handling: try-catch on localStorage read/write, `console.error` on failure, state still updates

## C2: ZoomInButton Component

```typescript
interface ZoomInButtonProps {
  onClick: () => void;
  disabled: boolean;
}

function ZoomInButton({ onClick, disabled }: ZoomInButtonProps): JSX.Element;
```

**Behavioral contract**:
- Renders `ZoomIn` icon from lucide-react (w-5 h-5)
- Uses standard title bar button styling (matches ThemeToggle, PinyinToggle, etc.)
- When `disabled=true`: visually muted (opacity-50), cursor-not-allowed, no click action, excluded from tab order
- Has `onPointerDown={(e) => e.stopPropagation()}` to prevent drag region interference
- `aria-label="Zoom in"`

## C3: ZoomOutButton Component

```typescript
interface ZoomOutButtonProps {
  onClick: () => void;
  disabled: boolean;
}

function ZoomOutButton({ onClick, disabled }: ZoomOutButtonProps): JSX.Element;
```

**Behavioral contract**:
- Renders `ZoomOut` icon from lucide-react (w-5 h-5)
- Uses standard title bar button styling (matches ThemeToggle, PinyinToggle, etc.)
- When `disabled=true`: visually muted (opacity-50), cursor-not-allowed, no click action, excluded from tab order
- Has `onPointerDown={(e) => e.stopPropagation()}` to prevent drag region interference
- `aria-label="Zoom out"`

## C4: TitleBar (modified)

```typescript
interface TitleBarProps {
  pinyinVisible: boolean;
  onPinyinToggle: (visible: boolean) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isMinZoom: boolean;
  isMaxZoom: boolean;
}
```

**Behavioral contract**:
- Renders zoom level indicator `({zoomLevel}%)` next to title in subdued styling
- Button order (left to right): PinyinToggle, ZoomInButton, ZoomOutButton, ThemeToggle, FullscreenToggle, CloseButton
- ZoomInButton receives `onClick=onZoomIn, disabled=isMaxZoom`
- ZoomOutButton receives `onClick=onZoomOut, disabled=isMinZoom`

## C5: TextDisplay (modified)

```typescript
interface TextDisplayProps {
  text: Text;
  showPinyin?: boolean;
  zoomLevel?: number;  // NEW: defaults to 100
}
```

**Behavioral contract**:
- When `zoomLevel` provided: applies `fontSize: ${1.5 * zoomLevel / 100}rem` to root container
- When `zoomLevel` omitted: renders at default size (1.5rem = text-2xl equivalent)
- Ruby annotations (`rt`) scale proportionally via CSS inheritance (~50% of parent)

## C6: App (modified)

**Behavioral contract**:
- Calls `useTextZoom()` hook (alongside existing `usePinyinVisibility()`)
- Passes zoom props to TitleBar: `zoomLevel, onZoomIn, onZoomOut, isMinZoom, isMaxZoom`
- Passes `zoomLevel` to TextDisplay
