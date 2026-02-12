# Quickstart: Hook Test Coverage

**Feature**: 007-hook-tests
**Date**: 2026-02-12

## Overview

This quickstart guide explains how to run hook tests, generate coverage reports, and verify that the 100% coverage standard is met.

---

## Prerequisites

- Docker Desktop running (Windows containers mode)
- Node.js and npm installed on host machine
- Repository cloned: `c:\Users\pierr\dev\hanzi-ruby-lens`

---

## Running Tests

### Run All Tests

```bash
# From repository root
npm run test
```

**What happens**:
1. Pre-check script (`scripts/check-docker.js`) verifies Docker is running, Windows containers mode, and toolchain image exists
2. Docker Compose orchestrates test execution inside container
3. All tests run (including new hook tests)
4. Results displayed in terminal

**Expected output**:
```
✓ src/hooks/usePinyinVisibility.test.ts (6 tests)
✓ src/hooks/useTheme.test.ts (8 tests)
✓ src/hooks/useFullscreen.test.ts (9 tests)

Test Files  3 passed (3)
Tests  23 passed (23)
```

### Run Specific Test File

```bash
# Run only useTheme tests
npm run test -- src/hooks/useTheme.test.ts

# Run only useFullscreen tests
npm run test -- src/hooks/useFullscreen.test.ts
```

### Run Tests with Coverage

```bash
npm run test -- --coverage
```

**What happens**:
1. Tests run as normal
2. Vitest c8/v8 coverage provider instruments code
3. Coverage report generated in `coverage/` directory
4. Terminal shows coverage summary
5. HTML report available at `coverage/index.html`

**Expected terminal output**:
```
----------------------------|---------|----------|---------|---------|
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
All files                   |     100 |      100 |     100 |     100 |
 src/hooks                  |     100 |      100 |     100 |     100 |
  usePinyinVisibility.ts    |     100 |      100 |     100 |     100 |
  useTheme.ts               |     100 |      100 |     100 |     100 |
  useFullscreen.ts          |     100 |      100 |     100 |     100 |
----------------------------|---------|----------|---------|---------|
```

### Run Tests in Watch Mode

```bash
npm run test -- --watch
```

**Use case**: Development mode - tests re-run automatically when files change

**Note**: Watch mode may not work optimally inside Docker container. Prefer one-shot test runs during development.

---

## Coverage Reports

### Coverage Thresholds

The project enforces **100% coverage** for all metrics via `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100
  }
}
```

**If thresholds are not met**: Test suite exits with non-zero code (failure).

### HTML Coverage Report

After running tests with `--coverage`, open the HTML report:

```bash
# Windows
start coverage/index.html

# Or manually navigate to:
file:///C:/Users/pierr/dev/hanzi-ruby-lens/coverage/index.html
```

**Features**:
- File-by-file breakdown
- Click files to see line-by-line coverage
- Uncovered lines highlighted in red
- Branch coverage indicators

### Interpreting Coverage Metrics

| Metric | Meaning | Example Uncovered |
|--------|---------|-------------------|
| **Statements** | Individual statements executed | `localStorage.setItem(...)` never called |
| **Branches** | All if/else paths taken | `if (error)` branch never tested |
| **Functions** | All functions called | Helper function never invoked |
| **Lines** | All lines executed | Same as statements, different counting |

**100% coverage means**: Every statement, every branch, every function, and every line has been executed at least once during testing.

---

## Verifying Test Uniformity

### Compare Test Structure

Check that all three hook tests follow identical patterns:

```bash
# View test files side-by-side (manual review)
code src/hooks/usePinyinVisibility.test.ts
code src/hooks/useTheme.test.ts
code src/hooks/useFullscreen.test.ts
```

**Checklist**:
- [ ] All use same imports (vitest, @testing-library/react)
- [ ] All have `beforeEach` with localStorage mock
- [ ] All use `renderHook`, `act`, `vi.waitFor` consistently
- [ ] All have error handling tests with console.error spies
- [ ] Test naming follows same pattern ("action → result")

### Count Test Cases

```bash
# Count test cases in each file
grep -c "it(" src/hooks/usePinyinVisibility.test.ts
grep -c "it(" src/hooks/useTheme.test.ts
grep -c "it(" src/hooks/useFullscreen.test.ts
```

**Expected**:
- usePinyinVisibility: ~6 tests
- useTheme: ~8 tests
- useFullscreen: ~9-10 tests

**Why different counts**: Each hook has unique behaviors (Tauri APIs, DOM manipulation, keyboard events), but common behaviors (initialization, persistence, errors) should have parallel tests.

---

## Testing Individual Hooks

### Testing useTheme

**Key behaviors to verify**:
1. Default to "light" theme
2. Restore from localStorage
3. Persist changes to localStorage
4. Update document.documentElement.classList
5. Handle localStorage errors

**Run tests**:
```bash
npm run test -- src/hooks/useTheme.test.ts
```

**Coverage verification**:
```bash
npm run test -- --coverage src/hooks/useTheme.ts
```

### Testing useFullscreen

**Key behaviors to verify**:
1. Default to non-fullscreen
2. Restore from localStorage
3. Call Tauri APIs (setFullscreen, setResizable)
4. Handle Escape key
5. Clean up event listeners on unmount
6. Handle localStorage errors

**Run tests**:
```bash
npm run test -- src/hooks/useFullscreen.test.ts
```

**Coverage verification**:
```bash
npm run test -- --coverage src/hooks/useFullscreen.ts
```

---

## Troubleshooting

### Tests Fail: "Docker not running"

**Problem**: Docker Desktop is not started or not in Windows containers mode

**Solution**:
```bash
# 1. Start Docker Desktop
# 2. Switch to Windows containers (right-click Docker Desktop icon)
# 3. Wait for Docker to fully start
# 4. Retry: npm run test
```

### Tests Fail: "Image not found"

**Problem**: `hanzi-ruby-lens-toolchain` Docker image not built

**Solution**:
```bash
# Image will auto-build via check-docker.js
npm run test

# Or manually build:
docker build -t hanzi-ruby-lens-toolchain -f docker/Dockerfile --isolation=process .
```

### Coverage Below 100%

**Problem**: Some lines/branches/functions not covered

**Solution**:
1. Run coverage report: `npm run test -- --coverage`
2. Open HTML report: `start coverage/index.html`
3. Navigate to uncovered file
4. Identify red-highlighted lines
5. Add test cases to cover missing scenarios
6. Re-run tests

**Common causes**:
- Error handling paths not tested
- Edge cases (null, invalid input) not covered
- Async cleanup not awaited in tests
- Event listeners not tested for unmount

### Test Flakiness

**Problem**: Tests pass sometimes, fail other times

**Solution**:
1. Check for async race conditions (missing `await`, `act()`, `vi.waitFor()`)
2. Verify mocks are reset in `beforeEach`
3. Check for shared state between tests
4. Run tests 10 times to verify consistency:
   ```bash
   for i in {1..10}; do npm run test; done
   ```

**Expected**: All 10 runs should pass (SC-005: zero flakiness)

### Tests Run Slowly (>5 seconds)

**Problem**: Test execution exceeds performance goal

**Solution**:
1. Check for unnecessary `vi.waitFor()` with long timeouts
2. Verify mocks are efficient (no real I/O)
3. Consider parallelization (Vitest default)
4. Profile with `npm run test -- --reporter=verbose`

---

## Success Criteria Verification

### SC-001 & SC-002: 100% Coverage for useTheme and useFullscreen

```bash
npm run test -- --coverage src/hooks/useTheme.ts src/hooks/useFullscreen.ts
```

**Verify**: All 4 metrics at 100% for both files

### SC-003: Tests Pass in Isolation

```bash
# Test each file independently
npm run test -- src/hooks/useTheme.test.ts
npm run test -- src/hooks/useFullscreen.test.ts
npm run test -- src/hooks/usePinyinVisibility.test.ts
```

**Verify**: All pass without errors

### SC-004: Test Execution <5 Seconds

```bash
time npm run test
```

**Verify**: "Total time" in output is <5 seconds (or use `time` command)

### SC-005: Zero Flakiness (10 Consecutive Runs)

```bash
for i in {1..10}; do npm run test || exit 1; done
```

**Verify**: All 10 runs complete successfully (no failures)

### SC-006: At Least 6 Test Cases per Hook

```bash
grep -c "it(" src/hooks/useTheme.test.ts      # Expected: ≥6
grep -c "it(" src/hooks/useFullscreen.test.ts # Expected: ≥6
```

**Verify**: Both hooks have at least 6 distinct test cases

### SC-007: Identical Structure to usePinyinVisibility

**Manual verification** (code review):
- [ ] Same localStorage mocking pattern
- [ ] Same error handling pattern (console.error spies)
- [ ] Same testing utilities (@testing-library/react)
- [ ] Same test naming conventions

### SC-008: Uniform 100% Coverage Across ALL Hooks

```bash
npm run test -- --coverage src/hooks/
```

**Verify**: usePinyinVisibility, useTheme, and useFullscreen ALL show 100% across all metrics

### SC-009: Coverage Methodology is Achievable

**Implicit verification**: If SC-001, SC-002, SC-008 pass, methodology is proven achievable

### SC-010: Testing Standard Documented

**Verification**: Existence of:
- `specs/007-hook-tests/data-model.md` (test patterns)
- `specs/007-hook-tests/contracts/test-interface.md` (test contracts)
- `specs/007-hook-tests/quickstart.md` (this file)
- TitleBar.tsx identified in spec.md as needing tests (future work)

---

## Next Steps After Feature 007

### Apply Standard to TitleBar Component

```bash
# Future feature: 008-titlebar-tests or similar
# Create src/components/TitleBar.test.tsx following same patterns
```

### Verify Existing Component Tests

```bash
# Check coverage for existing components
npm run test -- --coverage src/components/
```

**If <100%**: Create follow-up feature to bring component tests to 100% coverage

### Extend to Other Frontend Code

- Data utilities (if any in `src/data/`)
- Type guards (if any in `src/types/`)
- Helper functions

**Goal**: 100% coverage across entire `src/` directory

---

## Quick Reference Commands

| Task | Command |
|------|---------|
| Run all tests | `npm run test` |
| Run with coverage | `npm run test -- --coverage` |
| Run specific file | `npm run test -- src/hooks/useTheme.test.ts` |
| Open coverage report | `start coverage/index.html` |
| Verify uniformity | Compare test files manually |
| Check flakiness | `for i in {1..10}; do npm run test; done` |

---

## Summary

This feature establishes **100% code coverage** as the mandatory standard for all React frontend code. Run `npm run test -- --coverage` to verify all hooks reach 100% across statements, branches, functions, and lines. The patterns defined in this feature (test structure, mocking, assertions) will be applied to all future frontend code to maintain the quality baseline.
