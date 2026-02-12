# localStorage API Contract: Pinyin Visibility Preference

**Feature**: 006-pinyin-toggle
**Date**: 2026-02-12
**API**: Browser localStorage (Web Storage API)

## Contract Overview

This contract defines the interaction between the `usePinyinVisibility` hook and the browser's localStorage API for persisting the Pinyin visibility preference across application sessions.

## Storage Key

**Key**: `"pinyinVisible"`
**Type**: `string`
**Namespace**: None (global localStorage scope)

**Rationale**: Matches existing pattern from `useTheme` hook (uses `"theme"` key).

## Storage Value

**Type**: `string` (localStorage only stores strings)
**Valid Values**:
- `"true"` - Pinyin annotations are visible
- `"false"` - Pinyin annotations are hidden

**Invalid Values**:
- `null` - Key does not exist (first run scenario)
- `undefined` - Key does not exist
- Any other string - Treat as invalid, fall back to default

**Default Behavior**: If key does not exist or value is invalid, default to `"true"` (visible) per FR-004.

## API Operations

### Write Operation

**Method**: `localStorage.setItem(key, value)`

**Contract**:
```typescript
// MUST be called after every state change
try {
  localStorage.setItem("pinyinVisible", String(visible));
} catch (error) {
  // Handle quota exceeded, private browsing, etc.
  console.error("Failed to persist pinyin visibility preference:", error);
  // Continue execution (don't throw)
}
```

**Preconditions**:
- `visible` is a boolean (`true` or `false`)

**Postconditions**:
- If successful: `localStorage.getItem("pinyinVisible")` returns `"true"` or `"false"`
- If failed: Previous value (if any) remains unchanged; application continues with in-memory state

**Error Cases**:
- `QuotaExceededError`: localStorage full (rare, but possible)
- `SecurityError`: localStorage disabled in private browsing mode
- `Error`: Other unexpected errors

**Error Handling**:
- Log error to console for debugging
- **Do NOT** throw or propagate error (silent failure)
- Application remains functional with in-memory state only

### Read Operation

**Method**: `localStorage.getItem(key)`

**Contract**:
```typescript
// MUST be called only once on hook initialization (lazy initialization)
try {
  const stored = localStorage.getItem("pinyinVisible");
  if (stored === "true" || stored === "false") {
    return stored === "true"; // Convert string to boolean
  }
} catch (error) {
  console.error("Failed to read pinyin visibility preference:", error);
}
// Fallback to default
return true; // FR-004: Visible by default
```

**Preconditions**:
- None (can be called at any time)

**Postconditions**:
- Returns `boolean`: `true` (visible) or `false` (hidden)
- Never throws (always returns a value)

**Return Values**:
- If `stored === "true"` → return `true`
- If `stored === "false"` → return `false`
- If `stored === null` (key doesn't exist) → return `true` (default)
- If `stored` is any other value → return `true` (default)
- If exception thrown → return `true` (default)

**Error Cases**:
- `SecurityError`: localStorage disabled
- `Error`: Other unexpected errors

**Error Handling**:
- Log error to console
- Return default value (`true`)
- Application continues normally

### Delete Operation

**Method**: `localStorage.removeItem(key)`

**Usage**: ❌ Not used in this feature

**Rationale**: We never delete the preference. User can toggle to default state (`true`) if desired, but the preference always exists once set.

## Testing Contract

### Test Cases

#### TC-001: Write and Read Valid Value

**Given**: `pinyinVisible` state is `false`
**When**: `localStorage.setItem("pinyinVisible", "false")` is called
**Then**:
- `localStorage.getItem("pinyinVisible")` returns `"false"`
- Reading on next application load returns `false` (boolean)

#### TC-002: Write and Read Valid Value (True)

**Given**: `pinyinVisible` state is `true`
**When**: `localStorage.setItem("pinyinVisible", "true")` is called
**Then**:
- `localStorage.getItem("pinyinVisible")` returns `"true"`
- Reading on next application load returns `true` (boolean)

#### TC-003: Read Non-Existent Key (First Run)

**Given**: localStorage has no `"pinyinVisible"` key
**When**: `localStorage.getItem("pinyinVisible")` is called
**Then**:
- Returns `null`
- Application defaults to `true` (visible)

#### TC-004: Read Invalid Value

**Given**: localStorage has `"pinyinVisible"` = `"maybe"` (invalid)
**When**: `localStorage.getItem("pinyinVisible")` is called
**Then**:
- Returns `"maybe"`
- Application defaults to `true` (visible) because value is not `"true"` or `"false"`

#### TC-005: Write Error (Quota Exceeded)

**Given**: localStorage is full (QuotaExceededError)
**When**: `localStorage.setItem("pinyinVisible", "false")` is called
**Then**:
- Exception is caught
- Error is logged to console
- Application continues with in-memory state (`false`)
- Subsequent toggles continue to work (in-memory only)

#### TC-006: Read Error (Private Browsing)

**Given**: localStorage throws `SecurityError` (private browsing mode)
**When**: `localStorage.getItem("pinyinVisible")` is called
**Then**:
- Exception is caught
- Error is logged to console
- Application defaults to `true` (visible)
- Application remains functional (toggles work, just no persistence)

#### TC-007: Persistence Across Sessions

**Given**: User sets Pinyin to hidden (`false`)
**When**: Application is closed and reopened
**Then**:
- `localStorage.getItem("pinyinVisible")` returns `"false"`
- Application restores hidden state
- Pinyin annotations are not visible on load

#### TC-008: Persistence Across Sessions (Default)

**Given**: User has never toggled Pinyin (first run)
**When**: Application is opened
**Then**:
- `localStorage.getItem("pinyinVisible")` returns `null`
- Application defaults to `true` (visible)
- Pinyin annotations are visible on load

## Implementation Notes

### Type Safety

localStorage stores **strings only**. Always convert:
- `boolean` → `string`: `String(visible)` or `visible.toString()`
- `string` → `boolean`: Explicit comparison (`stored === "true"`)

**Anti-Pattern**:
```typescript
// ❌ WRONG: "false" is truthy in JavaScript
if (stored) { ... }

// ✅ CORRECT: Explicit comparison
if (stored === "true") { ... }
```

### Performance

- **Read**: Once per application load (lazy initialization in `useState`)
- **Write**: Once per toggle (in `useEffect` with `[visible]` dependency)
- **Impact**: Negligible (localStorage operations are synchronous and fast)

### Browser Compatibility

- **Target**: Modern browsers (Chrome, Edge, Firefox) on Windows
- **Support**: localStorage is universally supported in all modern browsers
- **Fallback**: Error handling covers edge cases (private browsing, quota)

## Security Considerations

### Data Sensitivity

- **Sensitivity**: Low (boolean preference, no PII or secrets)
- **Exposure**: localStorage is accessible to any script on the same origin
- **Mitigation**: Not needed (preference is not sensitive)

### XSS Risks

- **Risk**: XSS could read or modify `pinyinVisible` value
- **Impact**: Minimal (attacker can only change Pinyin visibility preference)
- **Mitigation**: Standard XSS protections (CSP, input sanitization) - not specific to this feature

## API Stability

**Guarantee**: The localStorage API is a Web Standard (HTML5) and will not change.

**Contract Versioning**: This contract is **v1.0.0** and will remain stable.

**Breaking Changes**: None anticipated. If localStorage becomes unavailable in future browser versions, error handling will gracefully degrade to in-memory-only state.

## Summary

| Aspect | Contract |
|--------|----------|
| **Key** | `"pinyinVisible"` (string) |
| **Value** | `"true"` \| `"false"` (string) |
| **Default** | `"true"` (visible) if key missing or invalid |
| **Write** | `localStorage.setItem(key, String(value))` with try/catch |
| **Read** | `localStorage.getItem(key)` with try/catch and validation |
| **Errors** | Silent failure, log to console, continue with default/in-memory state |
| **Testing** | 8 test cases covering valid values, errors, persistence |

This contract ensures robust, predictable behavior across all scenarios including error cases.
