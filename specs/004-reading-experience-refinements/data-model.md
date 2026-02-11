# Data Model

**Feature**: 004-reading-experience-refinements
**Date**: 2026-02-11
**Status**: No Changes

## Overview

This feature makes NO changes to the domain data model. It refines the visual presentation of the existing Word entity through CSS styling modifications only.

## Entities Referenced

### Word (Existing - No Modifications)

**Constitutional Definition** (from `.specify/memory/constitution.md`):
> An ordered segment of a Text, consisting of one or more Chinese characters and their pinyin as a single unit. Words are produced by LLM analysis of the full Text.

**Type Definition** (from `src/types/domain.ts`):
```typescript
export interface Word {
  characters: string;  // One or more Chinese characters
  pinyin: string;      // Single pinyin unit for the entire word
}
```

**Usage in This Feature**:
- **Read-Only**: RubyWord component receives Word via props
- **Display**: Renders `word.characters` as base text, `word.pinyin` as ruby annotation
- **No Mutations**: Feature only changes CSS presentation, not Word data

**Constitutional Constraints** (unchanged):
- A Word MUST contain one or more Chinese characters and exactly one pinyin string
- Pinyin MUST be displayed as a single unit per Word
- A Word's pinyin MUST be individually correctable by the user (not implemented yet)
- Words are ephemeral (regenerated when parent Text is saved)

---

## Data Flow

```text
Text (aggregate root)
  └─> Word[] (ordered segments)
       └─> RubyWord component (presentation)
            └─> CSS styling refinements (THIS FEATURE)
```

**No changes to**:
- Text aggregate structure
- Word segment generation
- Word-to-RubyWord data binding
- Props interface (RubyWordProps)

---

## Component Interface

### RubyWordProps (Existing - No Changes)

```typescript
interface RubyWordProps {
  word: Word;  // Receives Word entity from parent
}
```

**Contract**:
- Input: Word entity with `characters` and `pinyin` fields
- Output: HTML `<ruby>` element with CSS classes for styling
- Side effects: None (pure presentation component)

---

## State Management

**This Feature**: None
- No React state (`useState`, `useReducer`)
- No context (`useContext`)
- No global state management

**Existing State** (unchanged):
- Theme state (managed by `useTheme` hook) - applies to all components
- Text state (managed by parent components) - out of scope

---

## Persistence

**This Feature**: None
- No database writes
- No localStorage changes
- No file system operations

**Existing Persistence** (unchanged):
- Text and Words persisted in SQLite (via Tauri Rust backend)
- Theme preference in localStorage (via ThemeToggle component)

---

## Domain Events

**This Feature**: None
- No events emitted
- No event handlers added
- No cross-component communication

---

## Validation Rules

**This Feature**: No new validation
- CSS classes validated by Tailwind at build time
- TypeScript validates RubyWordProps type at compile time

**Existing Validation** (unchanged):
- Word.characters MUST be non-empty (enforced by LLM generation)
- Word.pinyin MUST be non-empty (enforced by LLM generation)

---

## Summary

This feature operates exclusively in the **presentation layer**. It modifies CSS utility classes applied to the `<ruby>` DOM element within RubyWord component. No domain entities, data structures, persistence mechanisms, or state management patterns are affected.

**Domain Model Impact**: ✅ **ZERO**
**CQRS Compliance**: ✅ **N/A** (no commands or queries)
**DDD Compliance**: ✅ **Full** (presentation layer only, uses Word entity correctly)
