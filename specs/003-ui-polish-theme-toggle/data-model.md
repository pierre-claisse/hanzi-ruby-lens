# Data Model: UI Polish & Theme Toggle

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Date**: 2026-02-09

## Overview

This feature is **purely presentational** and does NOT introduce new domain entities, aggregates, or value objects. All changes are confined to the UI layer (React components, CSS, browser localStorage).

---

## Domain Model Impact

### Unchanged Entities

The following domain entities remain unchanged (defined in [src/types/domain.ts](../../../src/types/domain.ts)):

- **Text**: Aggregate root representing the complete body of Chinese content
- **Word**: Ordered segment of Text with Chinese characters and pinyin

**Why unchanged**: Theme toggle and spacing refinements are visual presentation concerns, not domain logic. The underlying data structure (Text → Words) is not affected.

---

## UI State (Non-Domain)

### Theme Preference

**Type**: `"light" | "dark"`

**Storage**: Browser localStorage (key: `"theme"`)

**Lifecycle**:
1. Initialized on app mount from localStorage (fallback: `"light"`)
2. Updated when user toggles theme button
3. Persisted to localStorage on every change (with error handling)

**Not a Domain Entity Because**:
- Theme is ephemeral user preference, not domain data
- Not persisted in SQLite database (constitution II requires domain data in SQLite)
- Not part of Text aggregate or any bounded context
- Pure UI concern with no business logic

**Representation**:
```typescript
// NOT in domain.ts - lives in UI component state
type Theme = "light" | "dark";

// Managed by React hook
const [theme, setTheme] = useState<Theme>("light");
```

---

## Validation Rules

No domain validation rules apply (no domain entities involved).

**UI-level validation**:
- localStorage read: Validate stored value is `"light"` or `"dark"`, fallback to `"light"` otherwise
- Type safety: TypeScript enforces `Theme` literal type at compile time

---

## State Transitions

### Theme Toggle State Machine

```
┌─────────┐     Toggle     ┌─────────┐
│  Light  │ ────────────> │  Dark   │
│  Mode   │ <──────────── │  Mode   │
└─────────┘     Toggle     └─────────┘
```

**Transitions**:
1. `light → dark`: User clicks toggle button, localStorage updated, `.dark` class added to `document.documentElement`
2. `dark → light`: User clicks toggle button, localStorage updated, `.dark` class removed from `document.documentElement`

**No invalid states**: Type system prevents values other than `"light"` or `"dark"`.

---

## Data Flow

```
User Action (Click Toggle)
    ↓
React State Update (setTheme)
    ↓
useEffect Triggered
    ├─> localStorage.setItem("theme", newTheme)  [may fail silently]
    └─> document.documentElement.classList.toggle("dark", newTheme === "dark")
        ↓
    CSS Variables Update (:root vs .dark)
        ↓
    Visual Re-render (Tailwind classes recompute)
```

**Error Handling**: localStorage failures are caught and logged, but state update continues (session-only theme persistence).

---

## Persistence Strategy

| Data | Storage | Lifetime | Backup Strategy |
|------|---------|----------|-----------------|
| Theme preference | Browser localStorage | Indefinite (until user clears browser data) | Silent fallback to `"light"` default if read fails |

**Not Using SQLite Because**:
- Constitution II mandates SQLite for *domain data* (Text, Words, corrections)
- Theme preference is *user preference*, not domain data
- localStorage is appropriate for ephemeral UI state

---

## Relationships

None. This feature has no relationships to existing domain entities.

**Independence**:
- Theme toggle does NOT depend on Text or Word entities
- Text/Word rendering is NOT affected by theme (only visual colors change via CSS)
- No cross-aggregate communication needed

---

## Architecture Alignment

### DDD Layering

```
┌─────────────────────────────────────┐
│  Presentation Layer (UI)            │  ← THIS FEATURE
│  - ThemeToggle component            │
│  - useTheme hook                    │
│  - CSS variable switching           │
└─────────────────────────────────────┘
           │ (no calls)
           ↓
┌─────────────────────────────────────┐
│  Application Layer (Commands/Queries)│  ← NOT INVOLVED
└─────────────────────────────────────┘
           │ (no calls)
           ↓
┌─────────────────────────────────────┐
│  Domain Layer (Entities, Aggregates)│  ← NOT INVOLVED
│  - Text (unchanged)                 │
│  - Word (unchanged)                 │
└─────────────────────────────────────┘
           │ (no calls)
           ↓
┌─────────────────────────────────────┐
│  Infrastructure Layer (SQLite)      │  ← NOT INVOLVED
└─────────────────────────────────────┘
```

**Conclusion**: This feature is entirely confined to the Presentation Layer. No domain logic, no CQRS commands/queries, no database interaction.

---

## Summary

**Domain Model Changes**: None

**New Entities**: None

**Modified Entities**: None

**Persistence Changes**: None (localStorage only, not SQLite)

**CQRS Impact**: None (no commands or queries)

**Why This is Valid**: Constitution III (DDD with CQRS) applies to domain logic. Pure UI polish features like theme toggle and spacing adjustments are presentation-layer concerns and do not require domain modeling.

**Next Steps**: See [quickstart.md](./quickstart.md) for implementation guide.
