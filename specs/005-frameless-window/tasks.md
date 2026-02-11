# Implementation Tasks: Frameless Window with Custom Title Bar

**Feature**: 005-frameless-window
**Branch**: `005-frameless-window`
**Generated**: 2026-02-11
**Total Tasks**: 22

---

## Implementation Strategy

**MVP Scope**: User Story 1 (Window Dragging and Repositioning)
- This delivers the foundational frameless window with custom title bar and drag functionality
- Provides immediate value as a functional desktop application with repositionable window

**Incremental Delivery**:
1. **Phase 1-3**: Setup + Foundational + US1 → Delivers draggable frameless window
2. **Phase 4**: US2 → Adds window control operations (fullscreen, close)
3. **Phase 5**: US3 → Completes keyboard navigation and accessibility
4. **Phase 6**: Polish → Ensures production readiness

---

## Phase 1: Setup (Project Initialization)

**Goal**: Install dependencies, configure Tauri window, remove obsolete code

**Tasks**:
- [X] T001 Install lucide-react dependency via npm (package.json)
- [X] T002 Configure frameless window settings in src-tauri/tauri.conf.json (set decorations: false, shadow: true, width: 1024, height: 768, minWidth: 800, minHeight: 600, resizable: true)
- [X] T003 Add window control permissions to src-tauri/tauri.conf.json capabilities section (allow-close, allow-set-fullscreen, allow-is-fullscreen, allow-set-resizable, allow-start-dragging)
- [X] T004 Delete src/components/MinWidthOverlay.tsx (obsolete per FR-024)
- [X] T005 Delete src/hooks/useMinWidth.ts (obsolete per FR-024)

**Completion Criteria**: Dependencies installed, Tauri config updated with frameless window settings, obsolete files removed

---

## Phase 2: Foundational (Shared Infrastructure)

**Goal**: Prepare CSS styles and refactor existing ThemeToggle for title bar integration

**Tasks**:
- [X] T006 [P] Add drag region cursor styles to src/index.css ([data-tauri-drag-region] { cursor: grab; user-select: none; }, [data-tauri-drag-region]:active { cursor: grabbing; })
- [X] T007 Refactor src/components/ThemeToggle.tsx to remove fixed positioning classes (remove "fixed top-6 right-6 z-10") and replace inline SVG icons with lucide-react Sun/Moon components (import { Sun, Moon } from 'lucide-react')

**Completion Criteria**: CSS ready for drag behavior, ThemeToggle ready to be embedded in TitleBar

---

## Phase 3: User Story 1 - Window Dragging and Repositioning (P1)

**Story Goal**: Enable users to reposition the application window by dragging the custom title bar

**Independent Test**: Launch the app, hover over title bar to see grab cursor, click and drag to move window, verify grabbing cursor during drag, release to position window

**Tasks**:
- [X] T008 [US1] Create src/components/TitleBar.tsx with fixed positioning (h-12, top-0, left-0, right-0, z-50), data-tauri-drag-region attribute, title text "Hanzi Ruby Lens" (text-sm), and button container on right side
- [X] T009 [US1] Verify drag region behavior: hover shows grab cursor (FR-008), active drag shows grabbing cursor (FR-009), window repositions smoothly (FR-007)
- [X] T010 [US1] Verify title text is non-selectable (user-select: none applied, FR-011)

**Completion Criteria**:
- ✅ Cursor changes to grab hand when hovering over title bar
- ✅ Cursor changes to grabbing hand when dragging
- ✅ Window repositions smoothly following mouse movement
- ✅ Title text cannot be selected

---

## Phase 4: User Story 2 - Window Control Operations (P2)

**Story Goal**: Provide close button, fullscreen toggle, and preference persistence for window management

**Independent Test**: Click close button to terminate app, click fullscreen toggle to enter/exit fullscreen, press Escape to exit fullscreen, restart app to verify preference persistence

**Tasks**:
- [X] T011 [P] [US2] Create src/hooks/useFullscreen.ts with isFullscreen state, toggleFullscreen function, localStorage persistence ('fullscreenPreference' key), Escape key listener, and window resizability management
- [X] T012 [P] [US2] Create src/components/FullscreenToggle.tsx using useFullscreen hook, showing Maximize icon (windowed) or Minimize icon (fullscreen), with aria-label, matching ThemeToggle styling (p-2, rounded-lg, border, hover states)
- [X] T013 [P] [US2] Create src/components/CloseButton.tsx with X icon, aria-label="Close application", calling getCurrentWindow().close(), matching ThemeToggle styling
- [X] T014 [US2] Update src/components/TitleBar.tsx to import and render ThemeToggle, FullscreenToggle, and CloseButton in right-side button container (flex gap-2)
- [X] T015 [US2] Update src/App.tsx to import TitleBar, remove MinWidthOverlay import/usage, render TitleBar at top, wrap main content with pt-12 padding
- [X] T016 [US2] Verify close button terminates application gracefully (FR-018)
- [X] T017 [US2] Verify fullscreen toggle switches between windowed and fullscreen modes (FR-019)
- [X] T018 [US2] Verify Escape key exits fullscreen mode (FR-015)
- [X] T019 [US2] Verify fullscreen preference persists across app restarts (localStorage read/write, FR-017)

**Completion Criteria**:
- ✅ Close button terminates the application
- ✅ Fullscreen toggle switches between windowed/fullscreen
- ✅ Escape key exits fullscreen mode
- ✅ Fullscreen preference restored on app launch

---

## Phase 5: User Story 3 - Keyboard Navigation and Accessibility (P3)

**Story Goal**: Enable keyboard-only navigation through all window controls with proper Tab order and Enter activation

**Independent Test**: Press Tab repeatedly, verify focus moves through Theme → Fullscreen → Close buttons, press Enter on each to verify activation, check visible focus rings

**Tasks**:
- [X] T020 [US3] Verify Tab navigation order: ThemeToggle → FullscreenToggle → CloseButton (FR-013)
- [X] T021 [US3] Verify Enter key activates each focused button (theme switches, fullscreen toggles, app closes, FR-014)
- [X] T022 [US3] Verify all buttons show visible focus ring (focus:ring-2 focus:ring-vermillion applied)

**Completion Criteria**:
- ✅ Tab key navigates through buttons in correct order
- ✅ Enter key activates each button when focused
- ✅ Visible focus indicators appear on all buttons

---

## Phase 6: Polish & Validation

**Goal**: Update tests, verify production build, ensure all requirements met

**Tasks**:
- [X] T023 [P] Update src/App.test.tsx to remove MinWidthOverlay test and add TitleBar test (verify title text "Hanzi Ruby Lens", verify 3 buttons present)
- [X] T024 [P] Add mock for @tauri-apps/api/window in test setup (getCurrentWindow with mocked setFullscreen, setResizable, close, isFullscreen methods)
- [X] T025 Run full test suite via npm run test in Docker environment
- [X] T026 Build application via npm run build in Docker environment and verify output .exe

**Completion Criteria**: All tests pass, production build succeeds, all functional requirements verified

---

## Dependencies & Execution Order

### Story Completion Order

```
Phase 1 (Setup)
  ↓
Phase 2 (Foundational)
  ↓
Phase 3 (US1: Window Dragging) ← MVP Complete
  ↓
Phase 4 (US2: Window Controls)
  ↓
Phase 5 (US3: Keyboard Navigation)
  ↓
Phase 6 (Polish & Validation)
```

### Independent Stories
- **US1**: Can be tested independently (drag functionality)
- **US2**: Can be tested independently (button click operations)
- **US3**: Can be tested independently (keyboard navigation)

### Blocking Dependencies
- Phase 2 MUST complete before Phase 3 (CSS and ThemeToggle refactoring needed for TitleBar)
- Phase 3 MUST complete before Phase 4 (TitleBar component needed to add buttons)
- Phase 4 MUST complete before Phase 5 (buttons must exist to test keyboard navigation)

---

## Parallel Execution Opportunities

### Phase 1: Can run in parallel
- T001 (Install lucide-react) → Independent, npm operation
- T002, T003 (Tauri config) → Same file, sequential
- T004, T005 (Delete obsolete files) → Independent, different files

**Parallel Groups**:
- Group A: T001
- Group B: T002 → T003 (sequential within group)
- Group C: T004, T005

### Phase 2: Can run in parallel (marked with [P])
- T006 (CSS) and T007 (ThemeToggle) → Different files, independent

### Phase 4: Can run in parallel (marked with [P])
- T011 (useFullscreen hook), T012 (FullscreenToggle), T013 (CloseButton) → Independent components, different files
- T014, T015 must wait for T011-T013 to complete (integration tasks)

### Phase 6: Can run in parallel (marked with [P])
- T023 (Update App.test.tsx) and T024 (Add mock) → Same test file, can be combined
- T025, T026 must run sequentially (test before build)

**Example Parallel Execution**:
```bash
# Phase 1
npm install lucide-react &  # T001
# Edit tauri.conf.json for T002, T003 (sequential)
rm src/components/MinWidthOverlay.tsx src/hooks/useMinWidth.ts &  # T004, T005

# Phase 4
# Create T011, T012, T013 in parallel (different files)
touch src/hooks/useFullscreen.ts src/components/FullscreenToggle.tsx src/components/CloseButton.tsx
# Edit each file in parallel
```

---

## Task Summary

| Phase | Story | Task Count | Parallelizable | Independent Test |
|-------|-------|------------|----------------|------------------|
| Phase 1 | Setup | 5 | 3 tasks | N/A (infrastructure) |
| Phase 2 | Foundational | 2 | 2 tasks | N/A (shared code) |
| Phase 3 | US1 (P1) | 3 | 0 tasks | ✅ Drag and reposition window |
| Phase 4 | US2 (P2) | 9 | 3 tasks | ✅ Click buttons, verify actions |
| Phase 5 | US3 (P3) | 3 | 0 tasks | ✅ Keyboard navigation only |
| Phase 6 | Polish | 4 | 2 tasks | ✅ All tests pass, build succeeds |
| **Total** | | **26 tasks** | **10 tasks** | **3 independent stories** |

---

## Validation Checklist

Before marking this feature complete, verify:

- [ ] All 26 tasks completed
- [ ] All User Story acceptance scenarios pass:
  - [ ] US1: Window dragging with cursor feedback (5 scenarios)
  - [ ] US2: Window control operations (5 scenarios)
  - [ ] US3: Keyboard navigation (5 scenarios)
- [ ] All Functional Requirements met (FR-001 through FR-024)
- [ ] All Success Criteria met (SC-001 through SC-008)
- [ ] Edge cases handled:
  - [ ] Double-click on title bar does nothing
  - [ ] Window dragged to screen edge shows standard snapping
  - [ ] Window resizable below 800×600 is prevented by OS
  - [ ] Resize disabled in fullscreen mode
- [ ] Tests pass in Docker environment
- [ ] Production build generates working .exe

---

## Notes

- **Dependency**: lucide-react is a new dependency (added in Phase 1)
- **Breaking Change**: MinWidthOverlay and useMinWidth removed (obsolete with OS-level size enforcement)
- **Consistency**: All title bar buttons use lucide-react icons (Sun, Moon, Maximize, Minimize, X)
- **Accessibility**: Full keyboard navigation support (Tab, Enter, Escape)
- **Persistence**: Fullscreen preference saved to browser localStorage
- **Testing**: All tests run in Docker environment per project constitution
