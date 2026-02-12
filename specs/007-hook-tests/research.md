# Research: Hook Test Coverage

**Feature**: 007-hook-tests
**Date**: 2026-02-12
**Status**: Complete

## Research Questions

This research phase resolves technical unknowns for implementing comprehensive hook tests with 100% coverage.

---

## R1: Vitest Coverage Configuration

### Question
How should Vitest be configured to enforce 100% coverage thresholds for statements, branches, functions, and lines?

### Decision
Configure Vitest coverage thresholds in `vitest.config.ts` using the c8/v8 provider with explicit 100% thresholds for all metrics.

### Rationale
- Vitest uses c8 (built on V8's coverage) as the default provider - fast and accurate
- Coverage thresholds can be set globally or per-file in vitest.config.ts
- Setting thresholds to 100 will cause test runs to fail if coverage drops below target
- This enforces the constitutional standard automatically during CI/Docker test runs

### Configuration Approach
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'c8' (same underlying tech)
      reporter: ['text', 'json', 'html'],
      all: true,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.d.ts'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
});
```

### Alternatives Considered
- **Istanbul (nyc)**: Older, slower than c8/v8. Not recommended for Vitest.
- **Per-file thresholds**: Could set different thresholds per file, but violates "no hook left behind" principle. Rejected.
- **Lower thresholds (95%, 90%)**: Does not meet feature requirement for 100% coverage. Rejected.

### Implementation Notes
- Coverage report will be generated via `npm run test -- --coverage` (runs in Docker)
- HTML coverage report useful for identifying untested branches/statements
- Threshold violations will cause test suite to exit with non-zero code (fail CI)

---

## R2: Mocking Tauri Window APIs

### Question
What is the best approach to mock `@tauri-apps/api/window` methods (getCurrentWindow, setFullscreen, setResizable) in Vitest for useFullscreen hook tests?

### Decision
Use Vitest's `vi.mock()` to mock the entire `@tauri-apps/api/window` module, returning mock functions for getCurrentWindow and its methods.

### Rationale
- Tauri APIs are not available in test environment (jsdom/happy-dom)
- `vi.mock()` replaces the entire module before tests run
- Allows full control over return values and verification of calls
- Consistent with Vitest ecosystem best practices

### Mocking Pattern
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFullscreen } from './useFullscreen';

// Mock Tauri window API
const mockSetFullscreen = vi.fn();
const mockSetResizable = vi.fn();

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    setFullscreen: mockSetFullscreen,
    setResizable: mockSetResizable
  })
}));

describe('useFullscreen', () => {
  beforeEach(() => {
    mockSetFullscreen.mockClear();
    mockSetResizable.mockClear();
    mockSetFullscreen.mockResolvedValue(undefined); // Mock async resolution
    mockSetResizable.mockResolvedValue(undefined);
  });

  it('calls setFullscreen on mount', async () => {
    renderHook(() => useFullscreen());
    await vi.waitFor(() => {
      expect(mockSetFullscreen).toHaveBeenCalledWith(false);
    });
  });
});
```

### Alternatives Considered
- **Manual mock files (`__mocks__/`)**: More boilerplate, less explicit. Rejected for simplicity.
- **Test doubles/stubs**: Same outcome as vi.mock but more verbose. Rejected.
- **No mocking (skip Tauri tests)**: Would prevent testing useFullscreen. Violates feature requirements. Rejected.

### Implementation Notes
- Mock should be defined at top of test file before imports that use it
- Use `mockClear()` in beforeEach to reset call counts between tests
- Use `mockResolvedValue()` for async methods (setFullscreen, setResizable return Promise<void>)
- Verify mock calls with `toHaveBeenCalledWith()` assertions

---

## R3: Mocking document.documentElement.classList

### Question
How should document.documentElement.classList be mocked in tests for useTheme hook to verify DOM manipulation?

### Decision
Use jsdom (Vitest's default test environment) which provides a real document.documentElement. Mock localStorage only, and test actual classList behavior.

### Rationale
- Vitest uses jsdom by default, which includes a real DOM implementation
- `document.documentElement.classList` works natively in jsdom
- No mocking needed for classList itself - it's real and testable
- Simpler and more accurate than mocking - tests verify actual DOM behavior

### Testing Pattern
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    // Clear classList before each test
    document.documentElement.className = '';
    // Mock localStorage (same pattern as usePinyinVisibility)
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      // ... other methods
    } as Storage;
  });

  it('adds dark class when theme is dark', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current[1]('dark'); // setTheme('dark')
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when theme is light', () => {
    document.documentElement.classList.add('dark');

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current[1]('light');
    });

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
```

### Alternatives Considered
- **Mock classList.toggle()**: Unnecessary complexity, jsdom provides real implementation. Rejected.
- **Spy on classList.add/remove**: More fragile than testing actual state. Rejected.
- **happy-dom instead of jsdom**: Both work, jsdom is Vitest default and well-tested. No change needed.

### Implementation Notes
- Clear `document.documentElement.className = ''` in beforeEach to ensure clean state
- Test actual classList state (`.contains()`) rather than mocking - more reliable
- jsdom's classList is a real DOMTokenList implementation - behaves like browser

---

## R4: Testing Event Listener Cleanup

### Question
What is the best pattern for verifying that event listeners are properly cleaned up when a hook unmounts?

### Decision
Use behavioral testing: unmount the hook, manually dispatch the event, and verify the handler was NOT called.

### Rationale
- Directly verifies the cleanup behavior (listener removed = handler not called)
- More reliable than trying to inspect internal listener registry
- Aligns with user's clarification answer (unmount, dispatch, verify NOT called)
- Tests real behavior rather than implementation details

### Testing Pattern
```typescript
it('removes event listener on unmount', () => {
  const mockToggle = vi.fn();
  const { result, unmount } = renderHook(() => useFullscreen());

  // Spy on the toggle function
  const originalToggle = result.current.toggleFullscreen;
  result.current.toggleFullscreen = mockToggle;

  // Unmount the hook
  unmount();

  // Dispatch Escape keydown event
  const event = new KeyboardEvent('keydown', { code: 'Escape' });
  document.dispatchEvent(event);

  // Verify toggle was NOT called
  expect(mockToggle).not.toHaveBeenCalled();
});
```

### Alternatives Considered
- **Spy on addEventListener/removeEventListener**: Too implementation-focused, brittle if listener management changes. Rejected.
- **Inspect document's event listener registry**: Not accessible in standard DOM API. Rejected.
- **Memory leak detection**: Requires specialized tools (not built into Vitest). Out of scope for unit tests. Rejected.

### Implementation Notes
- Pattern requires access to the handler function (or ability to spy on it)
- For useFullscreen, the cleanup test verifies Escape key handler is removed
- Alternative: check that state does NOT change after unmount + event dispatch
- This pattern works for any hook with event listeners (keyboard, window resize, etc.)

---

## Research Summary

All technical unknowns have been resolved:

1. **Coverage Configuration**: Use Vitest c8/v8 with 100% thresholds in vitest.config.ts
2. **Tauri API Mocking**: Use `vi.mock('@tauri-apps/api/window')` with mock functions
3. **DOM Testing**: Use jsdom's real document.documentElement.classList (no mocking needed)
4. **Event Cleanup Testing**: Behavioral test - unmount, dispatch, verify NOT called

**Ready for Phase 1: Design & Contracts**
