# Data Model: Color Palette System (009-color-palettes)

**Date**: 2026-02-12

## Entities

### ColorPalette (Value Object)

A named, immutable set of three color tokens with light and dark mode variants. Defined at build time as a static constant array (not persisted to a database).

| Field       | Type   | Description                              |
|-------------|--------|------------------------------------------|
| `id`        | string | Kebab-case unique identifier (e.g., `"jade-garden"`) |
| `name`      | string | Display name (e.g., `"Jade Garden"`)     |
| `light`     | `{ background: string; text: string; accent: string }` | Hex colors for light mode |
| `dark`      | `{ background: string; text: string; accent: string }` | Hex colors for dark mode  |

**Validation rules**:
- `id` must be unique across all palettes
- `id` must be valid as a CSS attribute value (no spaces, lowercase, kebab-case)
- All hex color strings must be valid 6-digit hex codes (`#RRGGBB`)
- Exactly 7 palettes (Vermillion Scroll, Jade Garden, Indigo Silk, Cinnabar & Smoke, Plum Blossom, Golden Pavilion, Ink Wash)

**Identity**: Each palette is identified by its `id` string. No two palettes share an ID.

### PalettePreference (Persisted State)

The user's selected palette, stored as a single string in localStorage.

| Field         | Type   | Storage          | Default               |
|---------------|--------|------------------|-----------------------|
| `colorPalette`| string | localStorage     | `"vermillion-scroll"` |

**Validation rules**:
- Value must match one of the 7 known palette IDs
- Invalid values (including `null`, empty string, unknown ID) fall back to `"vermillion-scroll"`

**Lifecycle**:
1. On app init: read from localStorage → validate → apply (or fall back to default)
2. On palette change: update React state → persist to localStorage → update `data-palette` attribute on `<html>`
3. On localStorage error: log to console, continue with in-memory state (session-only)

## Palette ID Registry

| ID                 | Display Name        |
|--------------------|---------------------|
| `vermillion-scroll`| Vermillion Scroll   |
| `jade-garden`      | Jade Garden         |
| `indigo-silk`      | Indigo Silk         |
| `cinnabar-smoke`   | Cinnabar & Smoke    |
| `plum-blossom`     | Plum Blossom        |
| `golden-pavilion`  | Golden Pavilion     |
| `ink-wash`         | Ink Wash            |

## State Transitions

### Dropdown State Machine

```
CLOSED ──Enter/Click──► OPEN (focusedIndex = selectedIndex)
OPEN ──Enter──────────► CLOSED (palette updated, focus → button)
OPEN ──Click item──────► CLOSED (palette updated, focus → button)
OPEN ──Tab────────────► CLOSED (no change, focus → next button)
OPEN ──Click outside──► CLOSED (no change)
OPEN ──Click toggle───► CLOSED (no change)
OPEN ──ArrowDown──────► OPEN (focusedIndex = (focusedIndex + 1) % 7)
OPEN ──ArrowUp────────► OPEN (focusedIndex = (focusedIndex - 1 + 7) % 7)
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
