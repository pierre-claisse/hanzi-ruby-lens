# Implementation Plan: Hook Test Coverage

**Branch**: `007-hook-tests` | **Date**: 2026-02-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-hook-tests/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create comprehensive tests for useTheme and useFullscreen hooks following the same patterns and quality standards as usePinyinVisibility tests. Establish 100% code coverage (statements, branches, functions, lines) using Vitest c8/v8 as the mandatory standard for ALL React frontend code. No hook should be left behind - all three hooks (usePinyinVisibility, useTheme, useFullscreen) must achieve uniform 100% coverage. This feature creates the foundation for extending this coverage methodology to all components, utilities, and future frontend code.

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend), React 18.3
**Primary Dependencies**: Vitest (test runner), @testing-library/react (renderHook, act, waitFor), @tauri-apps/api 2.0 (window APIs to be mocked)
**Storage**: N/A (test-only feature, no data persistence changes)
**Testing**: Vitest with built-in coverage (c8/v8 provider) - 100% threshold for statements, branches, functions, lines
**Target Platform**: Windows desktop (Tauri 2)
**Project Type**: Single (desktop application with Tauri + React frontend)
**Performance Goals**: Test suite execution completes in <5 seconds for all hook tests combined, zero test flakiness (100% pass rate across 10 consecutive runs)
**Constraints**: Tests must run inside Docker containers (per constitution), tests must be uniform and consistent with existing usePinyinVisibility pattern, 100% code coverage mandatory
**Scale/Scope**: 2 new test files (useTheme.test.ts, useFullscreen.test.ts), ~12-15 test cases total covering normal operation + error handling + edge cases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principle I: Content-First Design
✅ **PASS** - N/A (test-only feature, no UI changes)

### Core Principle II: Offline-First Data
✅ **PASS** - N/A (test-only feature, no data storage changes)

### Core Principle III: Domain-Driven Design with CQRS
✅ **PASS** - N/A (test infrastructure, not domain logic)

### Core Principle IV: Principled Simplicity
✅ **PASS** - Tests follow KISS principle, no speculative features, using established patterns from existing tests (usePinyinVisibility as reference)

### Core Principle V: Test-First Imperative
✅ **PASS** - This feature directly supports the test imperative by:
  - Extending comprehensive test coverage to all hooks
  - Establishing 100% coverage standard (statements, branches, functions, lines)
  - Tests will run inside Docker containers (npm run test uses Docker - already established in 001-dev-build-pipeline)
  - Contract/integration/unit levels: unit tests for hooks

### Core Principle VI: Docker-Only Execution
✅ **PASS** - Tests will execute via `npm run test` which runs inside Docker container (established in feature 001). No local test infrastructure required.

### Domain Language Compliance
✅ **PASS** - Feature does not interact with Text or Word entities. Tests are purely for infrastructure (hooks for UI state management).

### Technical Constraints
✅ **PASS** -
  - Uses constitutional tech stack: React + TypeScript, Tauri 2
  - No changes to core technology choices
  - Aligns with Spec Kit development workflow

### Visual Identity
✅ **PASS** - N/A (test-only feature)

### Development Workflow
✅ **PASS** -
  - Follows git-flow with branch naming `007-hook-tests`
  - Spec Kit is source of truth (this plan follows `/speckit.plan` workflow)
  - Spec ratified before implementation

**GATE RESULT: ✅ ALL CHECKS PASS - No constitutional violations. Proceed to Phase 0 research.**

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── hooks/
│   ├── usePinyinVisibility.ts          # Existing (has tests)
│   ├── usePinyinVisibility.test.ts     # Existing (reference pattern)
│   ├── useTheme.ts                      # Existing (needs tests)
│   ├── useTheme.test.ts                 # NEW - to be created
│   ├── useFullscreen.ts                 # Existing (needs tests)
│   └── useFullscreen.test.ts            # NEW - to be created
├── components/                           # Existing (6/7 have tests, TitleBar.tsx needs tests - future work)
└── [other frontend code]

vitest.config.ts                          # May need coverage threshold configuration
```

**Structure Decision**: Single project structure (Tauri desktop app). This feature adds test files alongside existing hook implementations in `src/hooks/`. All tests run via Vitest inside Docker containers. No new directories needed - tests colocate with source files following existing project convention.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No constitutional violations detected.** All gates pass. No complexity justification required.

---

## Phase 0: Research (Complete)

**Artifact**: [research.md](research.md)

### Research Questions Resolved

1. **R1: Vitest Coverage Configuration** - Use c8/v8 provider with 100% thresholds in vitest.config.ts
2. **R2: Mocking Tauri Window APIs** - Use `vi.mock('@tauri-apps/api/window')` with mock functions
3. **R3: Mocking document.documentElement.classList** - Use jsdom's real classList (no mocking needed)
4. **R4: Testing Event Listener Cleanup** - Behavioral test: unmount, dispatch event, verify NOT called

**Key Decisions**:
- Coverage provider: Vitest c8/v8 (built-in, fast, accurate)
- Tauri mocking: Module-level mocks with `mockClear()` in beforeEach
- DOM testing: Use real jsdom implementation for classList
- Cleanup testing: Verify behavior (handler not called) rather than implementation

**Status**: ✅ All technical unknowns resolved. Ready for Phase 1.

---

## Phase 1: Design & Contracts (Complete)

### Artifacts Generated

1. **[data-model.md](data-model.md)** - Test Pattern Entities
   - 7 test patterns (TP-1 to TP-7): Test Suite Structure, Test Case, localStorage Mock, Tauri API Mock, DOM Mock, Error Handling Mock, Event Listener Cleanup Assertion
   - 1 coverage metrics entity (CM-1)
   - Test case inventory: ~8-9 tests for useTheme, ~9-10 tests for useFullscreen

2. **[contracts/test-interface.md](contracts/test-interface.md)** - Behavioral Contracts
   - 7 behavioral contracts (C1-C7): Initialization, Persistence, Error Handling, DOM Manipulation, Tauri APIs, Keyboard Events, Cleanup
   - Coverage contract: 100% across all metrics
   - Compliance matrix showing which contracts apply to which hooks

3. **[quickstart.md](quickstart.md)** - Operational Guide
   - How to run tests: `npm run test`
   - How to generate coverage: `npm run test -- --coverage`
   - How to verify success criteria (SC-001 through SC-010)
   - Troubleshooting guide
   - Quick reference commands

4. **Agent Context Update** - CLAUDE.md updated with:
   - TypeScript 5.5 (frontend), React 18.3
   - Vitest (test runner), @testing-library/react
   - @tauri-apps/api 2.0 (window APIs to be mocked)
   - N/A (test-only feature, no data persistence changes)

**Status**: ✅ All design artifacts complete. Agent context updated.

---

## Post-Design Constitution Re-Check

*Re-evaluating constitutional compliance after Phase 1 design*

### Core Principle I: Content-First Design
✅ **PASS** - No changes. Test-only feature.

### Core Principle II: Offline-First Data
✅ **PASS** - No changes. No data storage modifications.

### Core Principle III: Domain-Driven Design with CQRS
✅ **PASS** - No changes. Test patterns are infrastructure, not domain logic.

### Core Principle IV: Principled Simplicity
✅ **PASS** - Design confirms KISS approach:
  - Reusable test patterns (TP-1 to TP-7)
  - No speculative complexity
  - Following existing patterns from usePinyinVisibility

### Core Principle V: Test-First Imperative
✅ **PASS** - Design strengthens test imperative:
  - Established 100% coverage standard (documented in contracts, quickstart)
  - Test patterns are reusable for future frontend code
  - Coverage thresholds enforced via vitest.config.ts

### Core Principle VI: Docker-Only Execution
✅ **PASS** - Confirmed: All tests execute via `npm run test` in Docker container

### Domain Language Compliance
✅ **PASS** - No changes. Tests do not interact with Text or Word entities.

### Technical Constraints
✅ **PASS** - Confirmed:
  - Uses constitutional stack: React, TypeScript, Vitest, Tauri
  - No new technology dependencies outside approved stack

### Visual Identity
✅ **PASS** - No changes. Test-only feature.

### Development Workflow
✅ **PASS** - Confirmed:
  - Following Spec Kit workflow (spec → clarify → plan → tasks → implement)
  - Branch naming: 007-hook-tests
  - Documentation generated (research, data-model, contracts, quickstart)

**POST-DESIGN GATE RESULT: ✅ ALL CHECKS PASS**

No new constitutional violations introduced during design phase.

---

## Implementation Readiness

### Design Completeness

| Artifact | Status | Location |
|----------|--------|----------|
| Feature Specification | ✅ Complete | [spec.md](spec.md) |
| Implementation Plan | ✅ Complete | [plan.md](plan.md) (this file) |
| Research Document | ✅ Complete | [research.md](research.md) |
| Data Model | ✅ Complete | [data-model.md](data-model.md) |
| Test Contracts | ✅ Complete | [contracts/test-interface.md](contracts/test-interface.md) |
| Quickstart Guide | ✅ Complete | [quickstart.md](quickstart.md) |
| Agent Context | ✅ Updated | CLAUDE.md |

### Next Steps

1. **Generate Tasks**: Run `/speckit.tasks` to create actionable task list from this plan
2. **Implementation**: Run `/speckit.implement` to execute tasks and create test files
3. **Verification**: Run `npm run test -- --coverage` to verify 100% coverage achieved

### Files to Create

- `src/hooks/useTheme.test.ts` - ~8-9 test cases
- `src/hooks/useFullscreen.test.ts` - ~9-10 test cases
- Update `vitest.config.ts` if coverage thresholds not already configured

### Success Verification

After implementation, verify:
- [ ] SC-001: useTheme reaches 100% coverage (all metrics)
- [ ] SC-002: useFullscreen reaches 100% coverage (all metrics)
- [ ] SC-003: All tests pass in isolation
- [ ] SC-004: Test execution <5 seconds
- [ ] SC-005: Zero flakiness (10 consecutive runs)
- [ ] SC-006: Each hook has ≥6 test cases
- [ ] SC-007: Identical structure to usePinyinVisibility
- [ ] SC-008: ALL three hooks uniform at 100%
- [ ] SC-009: Coverage methodology proven achievable
- [ ] SC-010: Testing standard documented

---

## Summary

This implementation plan establishes **100% code coverage** as the constitutional standard for all React frontend code in Hanzi Ruby Lens. By creating comprehensive tests for useTheme and useFullscreen hooks that match the quality and pattern of existing usePinyinVisibility tests, we ensure **no hook is left behind**.

The research phase resolved all technical unknowns (Vitest configuration, Tauri mocking, DOM testing, cleanup verification). The design phase defined 7 reusable test patterns and 7 behavioral contracts that will guide all future frontend testing.

**This feature is not just about testing two hooks - it's about establishing a quality baseline that prevents technical debt and ensures every line of frontend code is tested, verified, and reliable.**

**Ready for**: `/speckit.tasks` to generate implementation tasks.
