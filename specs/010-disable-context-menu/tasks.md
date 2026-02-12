# Tasks: Disable Context Menu

**Input**: Design documents from `/specs/010-disable-context-menu/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: No dedicated tests (justified SHOULD deviation — see plan.md Complexity Tracking).

**Organization**: Single user story, single task. No phases needed beyond implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Phase 1: User Story 1 - No Context Menu on Right-Click (Priority: P1)

**Goal**: Suppress the default browser context menu on right-click across the entire application window.

**Independent Test**: Right-click anywhere in the app (title bar, text area, buttons, empty space) and verify no menu appears.

### Implementation

- [x] T001 [US1] Add document-level `contextmenu` event listener with `preventDefault()` in `src/App.tsx`

**Checkpoint**: Right-clicking anywhere in the app produces no context menu. All existing interactions unchanged.

---

## Phase 2: Verification

**Purpose**: Confirm existing tests still pass and app builds correctly.

- [x] T002 Run existing test suite (`npm run test`) — all 125+ tests must pass
- [x] T003 Run production build (`npm run build`) — verify .exe and installer output

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: No dependencies — can start immediately
- **Phase 2 (Verification)**: Depends on Phase 1 completion

### Parallel Opportunities

- None — this is a single-file, single-task feature. Sequential execution is the only path.

---

## Implementation Strategy

### MVP (complete feature)

1. Complete T001: Add contextmenu listener to App.tsx
2. Complete T002: Verify tests pass
3. Complete T003: Verify build succeeds
4. **DONE**: Feature complete

---

## Notes

- Single `useEffect` following the existing Space key suppression pattern in App.tsx
- No new files, no new dependencies, no test changes
- Commit after T001, verify with T002/T003
