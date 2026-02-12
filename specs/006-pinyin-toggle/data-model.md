# Data Model: Pinyin Toggle & Title Bar Improvements

**Feature**: 006-pinyin-toggle
**Date**: 2026-02-12
**Status**: Complete

## Overview

This feature introduces **no new domain entities**. It operates entirely within the UI layer as a presentation preference. The existing domain model (Text, Word, TextSegment) remains unchanged.

## UI State Entities

### Pinyin Visibility Preference

**Type**: UI Preference (not a domain entity)
**Storage**: Browser localStorage
**Lifecycle**: Persists across application sessions

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `pinyinVisible` | `boolean` | Yes | `true` | Whether Pinyin ruby annotations are currently visible |

#### Validation Rules

- **FR-004**: Value MUST be a boolean (`true` or `false`)
- **FR-004**: On first run (no saved preference), MUST default to `true` (visible)
- **FR-006**: Changes MUST take effect immediately (no delay or page refresh)

#### State Transitions

```
[Initial Load]
  ├─ localStorage.getItem("pinyinVisible") exists?
  │   ├─ Yes → Parse value ("true" → true, "false" → false)
  │   └─ No → Default to true (visible)
  │
  └─ [Running State]
      │
      ├─ User clicks toggle button
      │   ├─ visible → hidden (true → false)
      │   └─ hidden → visible (false → true)
      │
      └─ On state change
          ├─ Update localStorage ("true" or "false")
          └─ Re-render RubyWord components with new visibility
```

#### Persistence Contract

**Storage Key**: `"pinyinVisible"` (string)
**Storage Value**: `"true"` | `"false"` (string, not boolean)
**Storage API**: `localStorage.setItem()` / `localStorage.getItem()`

**Read Operation**:
```typescript
const stored = localStorage.getItem("pinyinVisible");
const visible = stored === "true" ? true : (stored === "false" ? false : true);
```

**Write Operation**:
```typescript
localStorage.setItem("pinyinVisible", String(visible));
```

**Error Handling**:
- If localStorage throws (quota exceeded, private browsing), fall back to default (`true`)
- Log error to console for debugging
- Application remains functional with default value

## Component State Flow

### State Ownership

**Owner**: `App.tsx` (root component)
**Provider**: `usePinyinVisibility` custom hook
**Consumers**: `TextDisplay` → `RubyWord` (prop drilling)

### Data Flow

```
App.tsx
  └─ usePinyinVisibility() → [pinyinVisible, setPinyinVisible]
      │
      ├─ Pass to TextDisplay as prop: showPinyin={pinyinVisible}
      │   └─ TextDisplay passes to each RubyWord: showPinyin={showPinyin}
      │       └─ RubyWord conditionally renders <rt> based on showPinyin
      │
      └─ Pass to PinyinToggle as prop: visible={pinyinVisible}, onToggle={setPinyinVisible}
          └─ PinyinToggle renders Eye/EyeClosed icon based on visible
          └─ PinyinToggle calls onToggle(!visible) on click
```

**Rationale for Prop Drilling**:
- Only 2 levels deep (App → TextDisplay → RubyWord)
- No intermediate components need the state
- Context API would be overkill for single boolean
- Matches existing pattern (theme is global state, but not in Context)

## Domain Model (No Changes)

### Text (Existing)

**Definition** (from Constitution v1.1.0): The complete body of Chinese content entered by the user. In the current release cycle, the application holds exactly one Text.

**Attributes**:
- `segments: TextSegment[]` - Array of Word segments and plain text segments

**Changes**: ❌ None

### Word (Existing)

**Definition** (from Constitution v1.1.0): An ordered segment of a Text, consisting of one or more Chinese characters and their pinyin as a single unit. Words are produced by LLM analysis of the full Text.

**Attributes**:
- `characters: string` - One or more Chinese characters
- `pinyin: string` - Pinyin pronunciation for the entire word (single unit)

**Changes**: ❌ None

### TextSegment (Existing)

**Type**: Discriminated union

```typescript
type TextSegment =
  | { type: "word"; word: Word }
  | { type: "plain"; text: string };
```

**Changes**: ❌ None

## Invariants

### UI Consistency

- **INV-001**: If `pinyinVisible === true`, ALL `<rt>` elements MUST have `visibility: visible` (Pinyin annotations visible)
- **INV-002**: If `pinyinVisible === false`, ALL `<rt>` elements MUST have `visibility: hidden` (Pinyin annotations hidden but space preserved)
- **INV-003**: Chinese characters MUST remain visible regardless of Pinyin visibility state
- **INV-004**: Toggling visibility MUST NOT cause layout shift - Chinese characters MUST remain in the same vertical position
- **INV-005**: Line height MUST remain constant when toggling Pinyin visibility (ruby annotation space always reserved)

### Persistence Consistency

- **INV-006**: localStorage value MUST match in-memory state after every toggle
- **INV-007**: Application restart MUST restore previous visibility state (if localStorage accessible)
- **INV-008**: If localStorage is inaccessible, application MUST default to `true` (visible)

## Testing Contracts

### Unit Tests

- Hook: `usePinyinVisibility`
  - ✅ Returns `[true, function]` on first run (no saved preference)
  - ✅ Returns saved preference on subsequent runs
  - ✅ Updates localStorage when state changes
  - ✅ Handles localStorage errors gracefully

- Component: `RubyWord`
  - ✅ Renders `<ruby><rt>` when `showPinyin={true}`
  - ✅ Renders plain text when `showPinyin={false}`

- Component: `PinyinToggle`
  - ✅ Shows `Eye` icon when `visible={true}`
  - ✅ Shows `EyeClosed` icon when `visible={false}`
  - ✅ Calls `onToggle(!visible)` on click

### Integration Tests

- End-to-end toggle flow:
  - ✅ Clicking toggle button hides all Pinyin annotations
  - ✅ Clicking toggle button again shows all Pinyin annotations
  - ✅ Preference persists after page reload
  - ✅ Preference persists after application restart

### Contract Tests

- localStorage API:
  - ✅ `localStorage.setItem("pinyinVisible", "true")` stores correctly
  - ✅ `localStorage.getItem("pinyinVisible")` retrieves correctly
  - ✅ localStorage throws exception → application handles gracefully

## Summary

This feature is **purely presentational** with no domain model changes:

- **New UI State**: `pinyinVisible` boolean preference (localStorage)
- **Domain Changes**: ❌ None (Text and Word entities unchanged)
- **Architecture**: Single-direction data flow (App → TextDisplay → RubyWord)
- **Persistence**: Browser localStorage with error handling
- **Invariants**: UI consistency + persistence consistency

All domain language (Text, Word) from Constitution v1.1.0 is respected and unchanged.
