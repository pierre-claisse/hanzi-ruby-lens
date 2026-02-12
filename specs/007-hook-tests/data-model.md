# Data Model: Hook Test Coverage

**Feature**: 007-hook-tests
**Date**: 2026-02-12

## Overview

This feature does not introduce traditional domain entities. Instead, it defines **Test Patterns** as the core "entities" - reusable testing structures that ensure uniformity across all hook tests.

---

## Test Pattern Entities

### TP-1: Test Suite Structure

**Description**: Standard organization pattern for all hook test files

**Structure**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHookName } from './useHookName';

describe('useHookName', () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Setup: localStorage mock, DOM cleanup, etc.
  });

  // Test cases organized by category:
  // 1. Initialization tests
  // 2. State persistence tests
  // 3. State update tests
  // 4. Error handling tests
  // 5. Cleanup tests (if applicable)
});
```

**Fields**:
- `describe block`: Top-level container, named after hook
- `localStorageMock`: Shared mock object for localStorage state
- `beforeEach`: Setup function to reset state between tests
- Test cases: Individual `it()` blocks with descriptive names

**Validation Rules**:
- MUST use descriptive test names following pattern: "action/condition → expected result"
- MUST reset all mocks in beforeEach
- MUST organize tests logically (init → persistence → updates → errors → cleanup)

**Relationships**:
- Contains multiple Test Cases (TP-2)
- Uses Mock Patterns (TP-3)
- Uses Assertion Patterns (TP-4)

---

### TP-2: Test Case

**Description**: Individual test verifying a single behavior

**Structure**:
```typescript
it('returns default value when no saved preference', () => {
  const { result } = renderHook(() => useHookName());

  expect(result.current[0]).toBe(defaultValue);
  expect(typeof result.current[1]).toBe('function');
});
```

**Fields**:
- `test name`: Descriptive string explaining what is tested
- `setup`: Arrange phase (set mocks, create test data)
- `execution`: Act phase (call hook, trigger actions)
- `assertions`: Assert phase (verify expected outcomes)

**Validation Rules**:
- MUST follow AAA pattern (Arrange-Act-Assert)
- MUST test ONE behavior per test case
- MUST use `act()` wrapper for state updates
- MUST use `vi.waitFor()` for async assertions

**State Transitions**:
1. Setup: Configure mocks and environment
2. Render: Hook initializes via renderHook()
3. Act: State changes triggered (optional)
4. Assert: Expectations verified
5. Cleanup: Automatic via beforeEach in next test

---

### TP-3: Mock Pattern - localStorage

**Description**: Standard approach to mocking localStorage for all hooks

**Structure**:
```typescript
let localStorageMock: { [key: string]: string };

beforeEach(() => {
  localStorageMock = {};

  global.localStorage = {
    getItem: vi.fn((key: string) => localStorageMock[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageMock[key];
    }),
    clear: vi.fn(() => {
      localStorageMock = {};
    }),
    length: 0,
    key: vi.fn(() => null),
  } as Storage;
});
```

**Fields**:
- `localStorageMock`: In-memory object storing key-value pairs
- `getItem`: Returns value from mock or null
- `setItem`: Stores value in mock
- `removeItem`: Deletes key from mock
- `clear`: Resets mock to empty object

**Validation Rules**:
- MUST reset `localStorageMock = {}` in beforeEach
- MUST implement all Storage interface methods
- MUST return `null` for missing keys (not undefined)
- MUST be identical across all hook tests

---

### TP-4: Mock Pattern - Tauri APIs

**Description**: Standard approach to mocking @tauri-apps/api/window for hooks using Tauri

**Structure**:
```typescript
const mockSetFullscreen = vi.fn();
const mockSetResizable = vi.fn();

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    setFullscreen: mockSetFullscreen,
    setResizable: mockSetResizable
  })
}));

beforeEach(() => {
  mockSetFullscreen.mockClear();
  mockSetResizable.mockClear();
  mockSetFullscreen.mockResolvedValue(undefined);
  mockSetResizable.mockResolvedValue(undefined);
});
```

**Fields**:
- `mockSetFullscreen`: Spy function for setFullscreen calls
- `mockSetResizable`: Spy function for setResizable calls
- Module mock: Replaces entire @tauri-apps/api/window module
- beforeEach: Resets mock call history and return values

**Validation Rules**:
- MUST define mock functions at module level (before imports)
- MUST use `mockClear()` in beforeEach to reset call counts
- MUST use `mockResolvedValue()` for async methods
- MUST verify calls with `toHaveBeenCalledWith()` assertions

**Applicable To**: useFullscreen hook only (other hooks don't use Tauri APIs)

---

### TP-5: Mock Pattern - DOM

**Description**: Approach to testing DOM manipulation (document.documentElement.classList)

**Structure**:
```typescript
beforeEach(() => {
  // Clear classList before each test
  document.documentElement.className = '';
});

it('adds dark class when theme is dark', () => {
  const { result } = renderHook(() => useTheme());

  act(() => {
    result.current[1]('dark');
  });

  expect(document.documentElement.classList.contains('dark')).toBe(true);
});
```

**Fields**:
- `document.documentElement.className`: Direct manipulation for cleanup
- `classList.contains()`: Assertion target (real jsdom implementation)

**Validation Rules**:
- MUST reset `className = ''` in beforeEach for clean state
- MUST test actual classList state (not mock interactions)
- MUST verify boolean state (contains/not contains)

**Applicable To**: useTheme hook only (other hooks don't manipulate DOM)

---

### TP-6: Mock Pattern - Error Handling

**Description**: Standard approach to testing error handling with console.error spies

**Structure**:
```typescript
it('handles localStorage read errors gracefully', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  global.localStorage = {
    getItem: vi.fn(() => {
      throw new Error('QuotaExceededError');
    }),
    // ... other methods
  } as Storage;

  const { result } = renderHook(() => useHookName());

  expect(result.current[0]).toBe(defaultValue); // Falls back to default
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    'Failed to read ... preference:',
    expect.any(Error)
  );

  consoleErrorSpy.mockRestore();
});
```

**Fields**:
- `consoleErrorSpy`: Spy on console.error to verify logging
- `mockImplementation(() => {})`: Silence console output during test
- Throwing mock: Simulate error condition
- `mockRestore()`: Clean up spy after test

**Validation Rules**:
- MUST create spy with `vi.spyOn(console, 'error')`
- MUST silence console with `mockImplementation(() => {})`
- MUST restore spy with `mockRestore()` after assertions
- MUST verify error message format AND Error object
- MUST test graceful fallback behavior (default values, state updates)

---

### TP-7: Assertion Pattern - Event Listener Cleanup

**Description**: Behavioral test pattern for verifying event listener removal on unmount

**Structure**:
```typescript
it('removes event listener on unmount', () => {
  const { result, unmount } = renderHook(() => useFullscreen());

  // Unmount the hook
  unmount();

  // Manually dispatch the event that would trigger handler
  const event = new KeyboardEvent('keydown', { code: 'Escape' });
  document.dispatchEvent(event);

  // Verify handler was NOT called (implicit via no state change)
  // OR verify mocked function was NOT called
  expect(mockSetFullscreen).not.toHaveBeenCalled();
});
```

**Fields**:
- `unmount()`: Triggers React cleanup (useEffect return functions)
- Event dispatch: Manually fires event that listener would handle
- Negative assertion: Verifies handler did NOT execute

**Validation Rules**:
- MUST unmount hook before dispatching event
- MUST dispatch the exact event the listener handles
- MUST verify negative assertion (NOT called, state unchanged)

**Applicable To**: Hooks with event listeners (useFullscreen for Escape key)

---

## Coverage Metrics Entity

### CM-1: Coverage Report

**Description**: Vitest coverage output verifying 100% coverage threshold

**Fields**:
- `statements`: Percentage of statements executed
- `branches`: Percentage of branches (if/else, switch cases) covered
- `functions`: Percentage of functions called
- `lines`: Percentage of lines executed

**Validation Rules**:
- ALL metrics MUST equal 100%
- Coverage measured via Vitest c8/v8 provider
- Threshold violations fail test suite (non-zero exit code)

**Success Criteria Mapping**:
- SC-001: useTheme reaches 100% across all metrics
- SC-002: useFullscreen reaches 100% across all metrics
- SC-008: ALL hooks uniform at 100%

---

## Test Case Inventory

### useTheme.test.ts Test Cases

1. **Initialization**: Returns ["light", function] by default (no saved preference)
2. **Restoration**: Restores "dark" from localStorage on mount
3. **Restoration**: Restores "light" from localStorage on mount
4. **Persistence**: Persists theme changes to localStorage
5. **DOM Update**: Adds "dark" class when theme is "dark"
6. **DOM Update**: Removes "dark" class when theme is "light"
7. **Error Handling**: Handles localStorage.getItem errors gracefully (defaults to "light", logs error)
8. **Error Handling**: Handles localStorage.setItem errors gracefully (state updates, logs error)
9. **Edge Case**: Handles invalid theme values (defaults to "light")

**Expected Count**: 8-9 test cases

### useFullscreen.test.ts Test Cases

1. **Initialization**: Returns { isFullscreen: false, toggleFullscreen: function } by default
2. **Restoration**: Restores true from localStorage and calls setFullscreen(true) on mount
3. **Toggle Enter**: Calls setResizable(false) then setFullscreen(true) when entering fullscreen
4. **Toggle Exit**: Calls setFullscreen(false) then setResizable(true) when exiting fullscreen
5. **Persistence**: Persists state changes to localStorage
6. **Keyboard Handling**: Escape key triggers toggleFullscreen when isFullscreen is true
7. **Keyboard Handling**: Escape key does nothing when isFullscreen is false
8. **Cleanup**: Event listener removed on unmount (dispatch Escape, verify NOT called)
9. **Error Handling**: Handles localStorage.getItem errors gracefully
10. **Error Handling**: Handles localStorage.setItem errors gracefully

**Expected Count**: 9-10 test cases

---

## Relationships

```
Test Suite (TP-1)
├── Contains multiple Test Cases (TP-2)
├── Uses localStorage Mock Pattern (TP-3)
├── Uses Tauri API Mock Pattern (TP-4) [useFullscreen only]
├── Uses DOM Mock Pattern (TP-5) [useTheme only]
├── Uses Error Handling Pattern (TP-6)
└── Uses Cleanup Assertion Pattern (TP-7) [useFullscreen only]

Test Cases (TP-2)
└── Produce Coverage Metrics (CM-1)

Coverage Report (CM-1)
└── Validates against 100% threshold requirement
```

---

## Summary

This "data model" defines the reusable test patterns that ensure uniformity across all hook tests. Each pattern (TP-1 through TP-7) is a structural entity that MUST be applied consistently to usePinyinVisibility, useTheme, and useFullscreen tests. The Coverage Metrics entity (CM-1) provides the validation that all tests meet the constitutional 100% threshold.
