# Quickstart: Text Input UI

**Feature**: 015-text-input-ui
**Date**: 2026-02-17

## What This Feature Does

Adds the ability for users to enter or paste Chinese text into the application. Replaces the hardcoded sample text with a proper input workflow: empty state → text entry → save confirmation.

## Key Design Decisions

1. **No Rust changes** — reuses existing `save_text`/`load_text` Tauri commands
2. **View state machine** — `"empty" | "input" | "saved" | "reading"` managed in React
3. **Sample text removed** — `src/data/sample-text.ts` deleted, empty state replaces it
4. **Segments stay empty** — raw input saved with `segments: []` until LLM integration (016)

## Files to Change

### New Files
- `src/components/EmptyState.tsx` — welcome screen with CTA button
- `src/components/TextInputView.tsx` — textarea with submit/cancel
- `src/components/SavedState.tsx` — "awaiting processing" confirmation with edit button
- `tests/integration/text-input-flow.test.tsx` — end-to-end input flow tests

### Modified Files
- `src/hooks/useTextLoader.ts` — returns `null` when no text, adds `saveText()`, manages view state
- `src/App.tsx` — routes between views based on app state
- `src/components/TitleBar.tsx` — adds conditional edit button
- `src/hooks/useTextLoader.test.ts` — updates for null return instead of sampleText fallback
- `tests/integration/text-persistence.test.tsx` — may need updates for sampleText removal

### Deleted Files
- `src/data/sample-text.ts` — hardcoded sample no longer needed

## Testing

```bash
# Run all tests (in Docker)
npm run test

# Key test scenarios:
# - Empty DB → empty state shown
# - Enter text + submit → save_text called with rawInput + empty segments
# - After save → "saved" confirmation state displayed
# - Edit action → textarea pre-filled with rawInput
# - Cancel → returns to previous state
# - Empty submit → accepted (per constitution)
# - Save error → error shown, input preserved
```

## View State Flow

```
┌─────────┐   CTA click   ┌─────────┐   submit    ┌─────────┐
│  empty  │ ────────────→  │  input  │ ──────────→ │  saved  │
└─────────┘                └─────────┘              └─────────┘
                              ↑  │                     │
                     edit     │  │ cancel              │ edit
                              │  ↓                     │
                           ┌──────────┐                │
                           │ previous │ ←──────────────┘
                           │  state   │
                           └──────────┘
```
