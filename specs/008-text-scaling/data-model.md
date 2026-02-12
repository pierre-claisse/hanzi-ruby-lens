# Data Model: Text Scaling Controls (008-text-scaling)

**Date**: 2026-02-12

## Entities

### TextZoomLevel (UI State)

A single integer value representing the current text zoom percentage. This is a **UI preference**, not a domain entity — it lives in the presentation layer alongside theme and fullscreen preferences.

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| zoomLevel | integer | 100 ≤ value ≤ 200, must be multiple of 10 | 100 |

**Validation rules**:
- Must be an integer (no floating point)
- Must be a multiple of 10: {100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200}
- Values outside [100, 200] are invalid → fall back to 100
- Non-multiple-of-10 values are invalid → fall back to 100
- Non-numeric stored values are invalid → fall back to 100

**Persistence**:
- Storage: Browser localStorage
- Key: `"textZoomLevel"`
- Format: String representation of integer (e.g., `"150"`)
- Read: On hook initialization (lazy `useState` initializer)
- Write: On every zoom level change (`useEffect` watching `zoomLevel`)

### Relationship to Existing Entities

```text
App (root component)
├── usePinyinVisibility() → [pinyinVisible, setPinyinVisible]
├── useTextZoom()         → { zoomLevel, zoomIn, zoomOut, isMinZoom, isMaxZoom }  ← NEW
│
├── TitleBar
│   ├── title + ZoomLevelIndicator (zoomLevel)              ← NEW
│   ├── PinyinToggle (pinyinVisible, onPinyinToggle)
│   ├── ZoomInButton (onClick=zoomIn, disabled=isMaxZoom)   ← NEW
│   ├── ZoomOutButton (onClick=zoomOut, disabled=isMinZoom)  ← NEW
│   ├── ThemeToggle (self-contained)
│   ├── FullscreenToggle (self-contained)
│   └── CloseButton (self-contained)
│
└── TextDisplay (text, showPinyin, zoomLevel)                ← MODIFIED
```

**Note on Domain Language**: "Text" in "Text Scaling" refers to the visual rendering of content, not the domain `Text` aggregate root defined in the constitution. The `TextZoomLevel` is purely a presentation concern with no impact on the domain model (Word, Text entities are unchanged).

## State Transitions

```text
                    zoomIn()              zoomIn()
    [100%] ─────────► [110%] ─────────► ... ──────────► [200%]
     MIN               │                                  MAX
      ▲                │                                   │
      │           zoomOut()                                │
      │                ▼                                   │
    [100%] ◄───────── [110%] ◄───────── ... ◄────────── [200%]
                    zoomOut()             zoomOut()

    At MIN (100%): zoomOut() → no-op, isMinZoom = true
    At MAX (200%): zoomIn()  → no-op, isMaxZoom = true
```

## localStorage Schema (complete)

| Key | Type | Values | Default | Feature |
|-----|------|--------|---------|---------|
| `theme` | string | `"light"` \| `"dark"` | `"light"` | 003-ui-polish |
| `fullscreenPreference` | string | `"true"` \| `"false"` | `"false"` | 005-frameless-window |
| `pinyinVisible` | string | `"true"` \| `"false"` | `"true"` | 006-pinyin-toggle |
| `textZoomLevel` | string | `"100"` .. `"200"` (multiples of 10) | `"100"` | 008-text-scaling |
