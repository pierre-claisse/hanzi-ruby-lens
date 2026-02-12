# Feature Specification: Hook Test Coverage

**Feature Branch**: `007-hook-tests`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "I want to add tests for useFullscreen and useTheme hooks in the same way that usePinyinVisibility has tests ; tests should be uniform, consistent, truly useful, truly relevant and provide complete coverage"
**Extended mandate**: "Tests for all hooks should be overall as consistent and uniform as possible, one hook should not be left behind in terms of test coverage/variety. Extend the 100% coverage methodology (Vitest c8/v8, all metrics) everywhere possible and relevant in the React frontend code."

## Clarifications

### Session 2026-02-12

- Q: How should code coverage be measured and verified to confirm the 100% threshold is met? → A: Use Vitest's built-in coverage (c8/v8), verify statements + branches + functions + lines all reach 100%
- Q: How should event listener cleanup be verified in the test? → A: Unmount hook, dispatch Escape keydown event, verify toggleFullscreen NOT called (behavioral test)
- Q: Should this feature establish 100% coverage as a standard for all React frontend code? → A: Yes - all hooks must have uniform coverage, no hook left behind. This methodology should extend everywhere possible and relevant in the frontend (components, utilities, etc.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - useTheme Hook Test Coverage (Priority: P1)

As a developer working on the theme functionality, I need comprehensive tests for the useTheme hook to ensure theme persistence, DOM updates, and error handling work correctly across all scenarios.

**Why this priority**: Theme switching is a core user-facing feature. Bugs in theme persistence or DOM updates directly impact user experience. This is the most critical hook to test since it affects the entire application's visual appearance.

**Independent Test**: Can be fully tested by running the test suite for useTheme.test.ts in isolation and verifies all theme behavior (initialization, persistence, DOM updates, error handling) without dependencies on other hooks.

**Acceptance Scenarios**:

1. **Given** no saved preference in localStorage, **When** the hook initializes, **Then** it returns ["light", function] as the default state
2. **Given** localStorage contains "dark" theme, **When** the hook initializes, **Then** it restores and returns ["dark", function]
3. **Given** the hook is initialized with "light", **When** setTheme("dark") is called, **Then** localStorage is updated with "dark" AND document.documentElement.classList contains "dark"
4. **Given** the hook is initialized with "dark", **When** setTheme("light") is called, **Then** localStorage is updated with "light" AND document.documentElement.classList does NOT contain "dark"
5. **Given** localStorage.getItem throws an error, **When** the hook initializes, **Then** it defaults to "light" and logs the error to console
6. **Given** localStorage.setItem throws an error, **When** theme is changed, **Then** the state updates but error is logged to console

---

### User Story 2 - useFullscreen Hook Test Coverage (Priority: P2)

As a developer working on the fullscreen functionality, I need comprehensive tests for the useFullscreen hook to ensure fullscreen state management, Tauri API interactions, keyboard handling, and localStorage persistence work correctly.

**Why this priority**: Fullscreen mode affects window behavior and requires integration with Tauri APIs. While important, it's secondary to theme since it's an opt-in feature rather than always-visible like theme.

**Independent Test**: Can be fully tested by running the test suite for useFullscreen.test.ts in isolation and verifies all fullscreen behavior (initialization, persistence, Tauri API calls, Escape key handling) with mocked Tauri APIs.

**Acceptance Scenarios**:

1. **Given** no saved preference in localStorage, **When** the hook initializes, **Then** it returns { isFullscreen: false, toggleFullscreen: function }
2. **Given** localStorage contains "true", **When** the hook initializes, **Then** it returns { isFullscreen: true, toggleFullscreen: function } AND calls appWindow.setFullscreen(true) on mount
3. **Given** isFullscreen is false, **When** toggleFullscreen() is called, **Then** it calls setResizable(false), setFullscreen(true), updates state to true, and persists "true" to localStorage
4. **Given** isFullscreen is true, **When** toggleFullscreen() is called, **Then** it calls setFullscreen(false), setResizable(true), updates state to false, and persists "false" to localStorage
5. **Given** isFullscreen is true, **When** Escape key is pressed, **Then** toggleFullscreen() is called and fullscreen mode exits
6. **Given** isFullscreen is false, **When** Escape key is pressed, **Then** no action is taken (fullscreen remains false)
7. **Given** the hook is unmounted, **When** Escape key is pressed, **Then** toggleFullscreen is NOT called (verifying event listener was removed)

---

### User Story 3 - Test Uniformity and Consistency (Priority: P3)

As a developer maintaining the codebase, I need all hook tests to follow the same structure, naming conventions, and testing patterns as usePinyinVisibility tests to ensure maintainability and ease of understanding.

**Why this priority**: Consistency is important for long-term maintainability but doesn't directly impact functionality. This is about code quality and developer experience rather than user-facing features.

**Independent Test**: Can be verified by code review comparing the structure of useTheme.test.ts and useFullscreen.test.ts against usePinyinVisibility.test.ts and ensuring they follow identical patterns.

**Acceptance Scenarios**:

1. **Given** all three test files (usePinyinVisibility, useTheme, useFullscreen), **When** comparing their structure, **Then** they use identical localStorage mocking patterns with beforeEach setup
2. **Given** all three test files, **When** comparing test naming, **Then** they follow the same "it('description', () => {})" format with clear behavioral descriptions
3. **Given** all three test files, **When** comparing error handling tests, **Then** they all use console.error spies and verify error logging consistently
4. **Given** all three test files, **When** comparing assertions, **Then** they use the same @testing-library/react utilities (renderHook, act, waitFor)

---

### User Story 4 - Establish Frontend Testing Standard (Priority: P0)

As a project maintainer, I need to establish 100% code coverage using Vitest c8/v8 (statements, branches, functions, lines) as the mandatory standard for ALL React frontend code, starting with hooks and extending to components and utilities.

**Why this priority**: This is a foundational architectural decision that affects all future development. By establishing this standard NOW with complete hook coverage, we create a quality baseline that prevents technical debt and ensures no code is left behind in future features.

**Independent Test**: Can be verified by running Vitest coverage on all hooks (usePinyinVisibility, useTheme, useFullscreen) and confirming all reach 100% across all metrics, then documenting this standard in project guidelines.

**Acceptance Scenarios**:

1. **Given** all three hooks (usePinyinVisibility, useTheme, useFullscreen), **When** coverage is measured, **Then** each hook achieves 100% coverage in statements, branches, functions, AND lines
2. **Given** the test suite, **When** comparing coverage levels between hooks, **Then** no hook has lower coverage than others - all are uniform
3. **Given** the frontend codebase, **When** reviewing untested code, **Then** TitleBar.tsx is identified as the only component without tests (to be addressed in future work)
4. **Given** project documentation, **When** reviewing testing standards, **Then** the 100% coverage methodology is documented as mandatory for all new frontend code

---

### Edge Cases

- What happens when localStorage returns an invalid theme value (not "light" or "dark")? → Should default to "light"
- What happens when Tauri window APIs (setFullscreen, setResizable) throw errors? → Should handle gracefully and log errors
- What happens when toggleFullscreen() is called multiple times rapidly? → Should handle async state updates correctly
- What happens when document.documentElement is undefined during theme updates? → Should handle gracefully (though unlikely in test environment)
- What happens when localStorage.getItem returns null vs empty string? → Should treat both as "no saved preference"

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tests MUST verify useTheme returns ["light", function] by default when no preference is saved
- **FR-002**: Tests MUST verify useTheme restores saved "light" or "dark" preference from localStorage on initialization
- **FR-003**: Tests MUST verify useTheme persists theme changes to localStorage with key "theme"
- **FR-004**: Tests MUST verify useTheme updates document.documentElement.classList with "dark" class when theme is "dark"
- **FR-005**: Tests MUST verify useTheme removes "dark" class from document.documentElement when theme is "light"
- **FR-006**: Tests MUST verify useTheme handles localStorage read errors gracefully (defaults to "light", logs error)
- **FR-007**: Tests MUST verify useTheme handles localStorage write errors gracefully (state updates, logs error)
- **FR-008**: Tests MUST verify useTheme rejects invalid theme values and defaults to "light"
- **FR-009**: Tests MUST verify useFullscreen returns { isFullscreen: false, toggleFullscreen: function } by default
- **FR-010**: Tests MUST verify useFullscreen restores saved preference from localStorage on initialization
- **FR-011**: Tests MUST verify useFullscreen calls appWindow.setFullscreen() with saved state on mount
- **FR-012**: Tests MUST verify toggleFullscreen() calls setResizable(false) then setFullscreen(true) when entering fullscreen
- **FR-013**: Tests MUST verify toggleFullscreen() calls setFullscreen(false) then setResizable(true) when exiting fullscreen
- **FR-014**: Tests MUST verify toggleFullscreen() updates state and persists to localStorage
- **FR-015**: Tests MUST verify Escape key triggers toggleFullscreen() when isFullscreen is true
- **FR-016**: Tests MUST verify Escape key does nothing when isFullscreen is false
- **FR-017**: Tests MUST verify event listeners are cleaned up on unmount by unmounting the hook, dispatching Escape keydown event, and verifying toggleFullscreen is NOT called
- **FR-018**: Tests MUST use identical localStorage mocking pattern as usePinyinVisibility tests
- **FR-019**: Tests MUST use identical error handling verification pattern (console.error spies)
- **FR-020**: Tests MUST use @testing-library/react utilities (renderHook, act, waitFor) consistently
- **FR-021**: ALL hooks (usePinyinVisibility, useTheme, useFullscreen) MUST achieve identical 100% coverage levels - no hook may be left behind with lower coverage
- **FR-022**: Tests MUST establish 100% coverage (statements, branches, functions, lines) as the mandatory standard for all React frontend code
- **FR-023**: Coverage verification MUST be performed using Vitest's built-in coverage tool (c8/v8) with all metrics reported
- **FR-024**: Test patterns established in this feature (mocking, error handling, assertions) MUST be reusable for future frontend tests

### Key Entities

- **useTheme Hook Test Suite**: Collection of tests covering initialization, persistence, DOM updates, and error handling for theme management
- **useFullscreen Hook Test Suite**: Collection of tests covering initialization, persistence, Tauri API interactions, keyboard handling, and cleanup for fullscreen management
- **Test Pattern**: Shared testing structure including localStorage mocking, error handling verification, and assertion patterns used consistently across all hook tests
- **Frontend Testing Standard**: Mandatory 100% coverage requirement (statements, branches, functions, lines) using Vitest c8/v8 for ALL React frontend code - hooks, components, utilities

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% code coverage for useTheme hook using Vitest's built-in coverage tool (c8/v8) with all coverage types (statements, branches, functions, lines) reaching 100%
- **SC-002**: 100% code coverage for useFullscreen hook using Vitest's built-in coverage tool (c8/v8) with all coverage types (statements, branches, functions, lines) reaching 100%
- **SC-003**: All tests pass in isolation (each hook test file can run independently)
- **SC-004**: Test execution completes in under 5 seconds for all hook tests combined
- **SC-005**: Zero test flakiness (tests pass consistently 100% of the time across 10 consecutive runs)
- **SC-006**: Each hook has at least 6 distinct test cases covering normal operation, error handling, and edge cases
- **SC-007**: Test files follow identical structure to usePinyinVisibility.test.ts (verified by code review checklist)
- **SC-008**: ALL three hooks (usePinyinVisibility, useTheme, useFullscreen) achieve uniform 100% coverage across all metrics - no hook left behind
- **SC-009**: Coverage report demonstrates 100% coverage methodology is achievable and sustainable for all frontend code
- **SC-010**: Testing standard is documented and ready to be applied to remaining untested code (TitleBar.tsx identified for future work)

## Scope

### In Scope

- Creating useTheme.test.ts with comprehensive test coverage
- Creating useFullscreen.test.ts with comprehensive test coverage
- Ensuring ALL hooks (usePinyinVisibility, useTheme, useFullscreen) have uniform 100% coverage - no hook left behind
- Establishing 100% coverage (statements, branches, functions, lines) as the mandatory standard for all React frontend code
- Mocking localStorage for all tests
- Mocking Tauri window APIs (getCurrentWindow, setFullscreen, setResizable) for useFullscreen tests
- Mocking document.documentElement.classList for useTheme tests
- Testing error handling for localStorage failures
- Testing keyboard event handling (Escape key) for useFullscreen
- Testing event listener cleanup on unmount
- Ensuring test pattern uniformity with existing usePinyinVisibility tests
- Verifying coverage metrics using Vitest c8/v8 for all hooks
- Identifying remaining untested frontend code (TitleBar.tsx) for future work

### Out of Scope

- Modifying the actual useTheme or useFullscreen hook implementations
- Adding tests for other hooks (usePinyinVisibility already has tests)
- Adding tests for TitleBar.tsx component (identified for future work but not part of this feature)
- Retroactively updating existing component tests to meet 100% coverage (current focus is hooks only)
- Integration tests with actual Tauri window (unit tests only)
- Performance testing beyond basic execution time
- Visual regression testing of theme changes
- Testing actual fullscreen behavior in real window environment
- Refactoring existing usePinyinVisibility tests (only using it as reference pattern)

## Assumptions

- The project uses Vitest as the test runner (consistent with usePinyinVisibility tests)
- @testing-library/react is available for renderHook, act, and waitFor utilities
- Tauri APIs can be effectively mocked using vi.fn() from Vitest
- localStorage behavior can be fully mocked for testing purposes
- document.documentElement is available in the test environment (jsdom)
- The testing environment supports async/await for testing promise-based hook methods
- Console.error is available and can be spied on using vi.spyOn()
- This feature establishes the testing standard that will be applied to all future frontend code (components, utilities, etc.)
- Existing component tests may need updates in future features to meet 100% coverage standard (not in scope for this feature)

## Dependencies

- Existing usePinyinVisibility.test.ts as reference implementation for test patterns
- Vitest testing framework and utilities
- @testing-library/react for React hook testing utilities
- @tauri-apps/api/window module (needs to be mocked)
- Access to src/hooks/useTheme.ts and src/hooks/useFullscreen.ts source code

## Constraints

- Tests must not modify the actual hook implementations
- Tests must run in isolation without requiring a real Tauri window environment
- Tests must execute quickly (under 5 seconds total for both test files)
- Test files must be created at src/hooks/useTheme.test.ts and src/hooks/useFullscreen.test.ts
- Tests must use the same mocking and assertion patterns as usePinyinVisibility tests to ensure uniformity
