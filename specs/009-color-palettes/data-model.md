# Data Model: Color Palette System (009-color-palettes)

**Date**: 2026-02-12

## Entities

### ColorPalette (Value Object)

A named, immutable set of three color tokens with light and dark mode variants. Defined at build time as a static constant array (not persisted to a database).

| Field       | Type   | Description                              |
|-------------|--------|------------------------------------------|
| `id`        | string | Kebab-case unique identifier (e.g., `"jade-garden"`) |
| `name`      | string | Display name (e.g., `"Jade Garden"`)     |
| `lightName` | string | Evocative variant name for light mode (e.g., `"Bamboo Mist"`) |
| `darkName`  | string | Evocative variant name for dark mode (e.g., `"Firefly Dusk"`) |
| `light`     | `{ background: string; text: string; accent: string }` | Hex colors for light mode |
| `dark`      | `{ background: string; text: string; accent: string }` | Hex colors for dark mode  |

**Validation rules**:
- `id` must be unique across all palettes
- `id` must be valid as a CSS attribute value (no spaces, lowercase, kebab-case)
- All hex color strings must be valid 6-digit hex codes (`#RRGGBB`)
- Exactly 6 palettes (Vermillion Scroll, Jade Garden, Indigo Silk, Plum Blossom, Golden Pavilion, Ink Wash)

**Identity**: Each palette is identified by its `id` string. No two palettes share an ID.

### PalettePreference (Persisted State)

The user's selected palette, stored as a single string in localStorage.

| Field         | Type   | Storage          | Default               |
|---------------|--------|------------------|-----------------------|
| `colorPalette`| string | localStorage     | `"vermillion-scroll"` |

**Validation rules**:
- Value must match one of the 6 known palette IDs
- Invalid values (including `null`, empty string, unknown ID) fall back to `"vermillion-scroll"`

**Lifecycle**:
1. On app init: read from localStorage → validate → apply (or fall back to default)
2. On palette change: update React state → persist to localStorage → update `data-palette` attribute on `<html>`
3. On localStorage error: log to console, continue with in-memory state (session-only)

## Palette ID Registry

| ID                 | Display Name        | Light Variant            | Dark Variant              |
|--------------------|---------------------|--------------------------|---------------------------|
| `vermillion-scroll`| Vermillion Scroll   | Lamplit Vellum           | Midnight Study            |
| `jade-garden`      | Jade Garden         | Bamboo Mist             | Firefly Dusk     |
| `indigo-silk`      | Indigo Silk         | Porcelain Dawn        | Earthen Kiln              |
| `plum-blossom`     | Plum Blossom        | Blush Parchment          | Teal Forest               |
| `golden-pavilion`  | Golden Pavilion     | Imperial Gilt          | Palace Lanterns           |
| `ink-wash`         | Ink Wash            | Rice Paper               | Fresh Ink                 |

## State Transitions

### Dropdown State Machine

```
CLOSED ──Enter/Click──► OPEN (focusedIndex = selectedIndex)
OPEN ──Enter──────────► OPEN (palette updated, dropdown stays open)
OPEN ──Click item──────► OPEN (palette updated, focusedIndex = clicked item, dropdown stays open)
OPEN ──Tab────────────► CLOSED (no change, focus → next button)
OPEN ──Click outside──► CLOSED (no change)
OPEN ──Click toggle───► CLOSED (no change)
OPEN ──ArrowDown──────► OPEN (focusedIndex = (focusedIndex + 1) % 6)
OPEN ──ArrowUp────────► OPEN (focusedIndex = (focusedIndex - 1 + 6) % 6)
Space key ─────────────► NO EFFECT (globally suppressed on all buttons)
```

## Relationships

```
App
├── useTheme() ──────────────────► theme: "light" | "dark"
├── useColorPalette() ───────────► paletteId, setPalette, palettes[]
├── TitleBar
│   ├── PaletteSelector(palettes, paletteId, setPalette, theme)
│   ├── ThemeToggle(theme, onToggle) ← refactored to props-driven
│   └── ... other buttons
└── TextDisplay
    └── inherits colors via CSS custom properties (no props needed)
```
