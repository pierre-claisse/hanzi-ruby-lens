# Test Interface Contracts

**Feature**: 007-hook-tests
**Date**: 2026-02-12

## Overview

This document defines the "contracts" for hook testing - the interface between hooks and their test suites. While traditional API contracts define request/response schemas, these test contracts define the **behavioral expectations** that all hook tests MUST verify.

---

## Contract 1: Hook Initialization

**Applies to**: ALL hooks (usePinyinVisibility, useTheme, useFullscreen)

### Interface

```typescript
Given: No saved preference in localStorage
When: Hook is rendered via renderHook()
Then: Hook returns default state
```

### Test Requirements

**MUST verify**:
- Default return value matches specification
- Return value structure is correct (tuple vs object)
- Setter/toggle function is present and callable

**Example Assertions**:
```typescript
const { result } = renderHook(() => useHook());
expect(result.current[0]).toBe(defaultValue); // or result.current.stateName
expect(typeof result.current[1]).toBe('function'); // or typeof result.current.actionName
```

---

## Contract 2: State Persistence (localStorage)

**Applies to**: ALL hooks (usePinyinVisibility, useTheme, useFullscreen)

### Interface

```typescript
Given: localStorage contains saved preference
When: Hook is rendered
Then: Hook restores state from localStorage

AND

Given: Hook state changes
When: State update function is called
Then: New state is persisted to localStorage
```

### Test Requirements

**MUST verify**:
- Reading from localStorage on initialization
- Writing to localStorage on state change
- Correct localStorage key is used
- Value format is correct (string serialization)

**Example Assertions**:
```typescript
// Restoration
localStorageMock['key'] = 'savedValue';
const { result } = renderHook(() => useHook());
expect(result.current[0]).toBe(expectedParsedValue);

// Persistence
act(() => {
  result.current[1](newValue);
});
await vi.waitFor(() => {
  expect(localStorage.setItem).toHaveBeenCalledWith('key', 'serializedValue');
});
```

---

## Contract 3: Error Handling (localStorage failures)

**Applies to**: ALL hooks (usePinyinVisibility, useTheme, useFullscreen)

### Interface

```typescript
Given: localStorage.getItem throws error
When: Hook initializes
Then: Hook falls back to default value AND logs error

AND

Given: localStorage.setItem throws error
When: State changes
Then: State updates in memory AND logs error
```

### Test Requirements

**MUST verify**:
- Graceful fallback to default on read error
- State update succeeds even if persist fails
- Error is logged to console.error
- Error message format matches specification

**Example Assertions**:
```typescript
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

global.localStorage = {
  getItem: vi.fn(() => { throw new Error('QuotaExceededError'); }),
  // ...
} as Storage;

const { result } = renderHook(() => useHook());

expect(result.current[0]).toBe(defaultValue); // Graceful fallback
expect(consoleErrorSpy).toHaveBeenCalledWith(
  'Failed to read ... preference:',
  expect.any(Error)
);

consoleErrorSpy.mockRestore();
```

---

## Contract 4: DOM Manipulation (useTheme only)

**Applies to**: useTheme

### Interface

```typescript
Given: Theme is set to "dark"
When: Effect runs
Then: document.documentElement.classList contains "dark"

AND

Given: Theme is set to "light"
When: Effect runs
Then: document.documentElement.classList does NOT contain "dark"
```

### Test Requirements

**MUST verify**:
- classList.add('dark') when theme is "dark"
- classList.remove('dark') when theme is "light"
- Actual DOM state (not just mock interactions)

**Example Assertions**:
```typescript
act(() => {
  result.current[1]('dark');
});

expect(document.documentElement.classList.contains('dark')).toBe(true);

act(() => {
  result.current[1]('light');
});

expect(document.documentElement.classList.contains('dark')).toBe(false);
```

---

## Contract 5: Tauri API Integration (useFullscreen only)

**Applies to**: useFullscreen

### Interface

```typescript
Given: Fullscreen state changes to true
When: toggleFullscreen() is called
Then: setResizable(false) is called BEFORE setFullscreen(true)

AND

Given: Fullscreen state changes to false
When: toggleFullscreen() is called
Then: setFullscreen(false) is called BEFORE setResizable(true)

AND

Given: Saved preference is true
When: Hook mounts
Then: setFullscreen(true) is called during mount effect
```

### Test Requirements

**MUST verify**:
- Correct Tauri API methods are called
- Correct order of API calls (resizable before/after fullscreen)
- Correct arguments passed to API methods
- API calls on mount match saved state

**Example Assertions**:
```typescript
const { result } = renderHook(() => useFullscreen());

await act(async () => {
  await result.current.toggleFullscreen();
});

expect(mockSetResizable).toHaveBeenCalledWith(false);
expect(mockSetFullscreen).toHaveBeenCalledWith(true);
expect(mockSetResizable.mock.invocationCallOrder[0])
  .toBeLessThan(mockSetFullscreen.mock.invocationCallOrder[0]); // Verify order
```

---

## Contract 6: Keyboard Event Handling (useFullscreen only)

**Applies to**: useFullscreen

### Interface

```typescript
Given: isFullscreen is true
When: Escape key is pressed
Then: toggleFullscreen() is called (exits fullscreen)

AND

Given: isFullscreen is false
When: Escape key is pressed
Then: No action is taken (state unchanged)
```

### Test Requirements

**MUST verify**:
- Escape key (code === 'Escape') triggers toggle when fullscreen
- Escape key does nothing when not fullscreen
- Event listener is attached to document
- Listener checks both event.code and current state

**Example Assertions**:
```typescript
const { result } = renderHook(() => useFullscreen());

// Set to fullscreen first
await act(async () => {
  await result.current.toggleFullscreen();
});

expect(result.current.isFullscreen).toBe(true);

// Dispatch Escape event
const event = new KeyboardEvent('keydown', { code: 'Escape' });
document.dispatchEvent(event);

await vi.waitFor(() => {
  expect(mockSetFullscreen).toHaveBeenCalledWith(false); // Toggled back
});
```

---

## Contract 7: Event Listener Cleanup (useFullscreen only)

**Applies to**: useFullscreen

### Interface

```typescript
Given: Hook is mounted with event listener
When: Hook unmounts
Then: Event listener is removed (verified by behavioral test)
```

### Test Requirements

**MUST verify**:
- After unmount, dispatching the event does NOT trigger handler
- No state changes occur after unmount
- No API calls occur after unmount

**Example Assertions**:
```typescript
const { unmount } = renderHook(() => useFullscreen());

unmount();

const event = new KeyboardEvent('keydown', { code: 'Escape' });
document.dispatchEvent(event);

// Verify NO additional calls after unmount
expect(mockSetFullscreen).not.toHaveBeenCalled();
// OR: verify call count didn't increase
```

---

## Coverage Contract

**Applies to**: ALL hooks

### Interface

```typescript
Given: Complete test suite for a hook
When: Coverage is measured via Vitest c8/v8
Then: ALL metrics (statements, branches, functions, lines) equal 100%
```

### Test Requirements

**MUST achieve**:
- 100% statement coverage
- 100% branch coverage (all if/else, switch cases covered)
- 100% function coverage (all functions called in tests)
- 100% line coverage

**Verification**:
```bash
npm run test -- --coverage

# Expected output (example):
# File              | % Stmts | % Branch | % Funcs | % Lines
# useTheme.ts       | 100     | 100      | 100     | 100
# useFullscreen.ts  | 100     | 100      | 100     | 100
```

---

## Contract Compliance Matrix

| Contract | usePinyinVisibility | useTheme | useFullscreen |
|----------|---------------------|----------|---------------|
| C1: Initialization | ✅ Existing | ⚠️ Required | ⚠️ Required |
| C2: Persistence | ✅ Existing | ⚠️ Required | ⚠️ Required |
| C3: Error Handling | ✅ Existing | ⚠️ Required | ⚠️ Required |
| C4: DOM Manipulation | N/A | ⚠️ Required | N/A |
| C5: Tauri APIs | N/A | N/A | ⚠️ Required |
| C6: Keyboard Events | N/A | N/A | ⚠️ Required |
| C7: Cleanup | N/A | N/A | ⚠️ Required |
| Coverage Contract | ✅ Existing | ⚠️ Required | ⚠️ Required |

**Legend**:
- ✅ Existing: Contract already verified by existing tests
- ⚠️ Required: Contract must be verified in this feature
- N/A: Contract not applicable to this hook

---

## Implementation Notes

### Contract Enforcement

These contracts will be enforced through:

1. **Code Review Checklist**: Verify all applicable contracts are tested
2. **Coverage Thresholds**: Vitest config requires 100% coverage (fails if not met)
3. **Test Uniformity**: All hooks use identical patterns for common contracts (C1-C3)
4. **CI/CD Pipeline**: Tests run in Docker, coverage report generated, thresholds validated

### Future Applicability

These contracts establish the standard for ALL future React hook tests:
- New hooks MUST implement all applicable contracts
- Component tests SHOULD follow similar patterns (initialization, persistence, error handling)
- Coverage threshold of 100% MUST be maintained for all new frontend code

---

## Summary

This contract document defines 7 behavioral contracts (C1-C7) plus the coverage contract that all hook tests must satisfy. Each contract specifies the Given/When/Then interface and the assertions required to verify compliance. useTheme.test.ts and useFullscreen.test.ts will implement these contracts to achieve uniform, comprehensive test coverage.
