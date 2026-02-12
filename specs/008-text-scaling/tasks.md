# Tasks: Text Scaling Controls

**Input**: Design documents from `/specs/008-text-scaling/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/component-interfaces.md, research.md, quickstart.md

**Tests**: Yes — FR-027 and SC-015 explicitly require 100% hook test coverage (statements, branches, functions, lines).

**Organization**: Tasks grouped by user story. The core hook is foundational (serves all stories). US1+US2 share zoom button components. US3+US4 share TitleBar modifications.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Core Hook + Tests)

**Purpose**: Core zoom state management that ALL user stories depend on. Implements persistence (US5), keyboard shortcuts (US1/US2), boundary enforcement, and validation. Must complete before any UI work.

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete.

### Tests (required per FR-027) ⚠️

> **NOTE: Write tests FIRST or alongside hook, ensure they FAIL before implementation passes them**

- [x] T001 Create useTextZoom test suite in src/hooks/useTextZoom.test.ts — follow usePinyinVisibility.test.ts patterns (localStorage mock, beforeEach, console.error spy, renderHook/act/vi.waitFor). Must cover: default initialization (100%), restore from localStorage, persistence on change, zoom in/out, boundary enforcement (min 100/max 200), keyboard shortcuts (Ctrl+=/+, Ctrl+-), e.preventDefault() calls, invalid stored values (non-integer, non-multiple-of-10, out-of-range, non-numeric), localStorage read/write errors, event listener cleanup on unmount. Target: 100% coverage (statements, branches, functions, lines).

### Implementation

- [x] T002 Create useTextZoom hook in src/hooks/useTextZoom.ts — constants (MIN_ZOOM=100, MAX_ZOOM=200, DEFAULT_ZOOM=100, ZOOM_STEP=10, STORAGE_KEY="textZoomLevel"), useState with lazy initializer (localStorage read + validation: integer, multiple of 10, within [100,200]), useEffect for localStorage persistence, useEffect for keyboard shortcuts (Ctrl+=/+ zoom in, Ctrl+- zoom out, e.preventDefault(), functional state updates), derived state (isMinZoom, isMaxZoom), exported functions (zoomIn, zoomOut), try-catch error handling with console.error per useTheme/usePinyinVisibility patterns.

**Checkpoint**: Hook tests pass with 100% coverage. Run `npm run test -- --coverage src/hooks/useTextZoom.test.ts` to verify.

---

## Phase 2: US1 + US2 — Zoom In/Out Controls (P1/P2) 🎯 MVP

**Goal**: Enable users to zoom text in and out via title bar buttons, with zoom applied to Chinese text and pinyin annotations only.

**Independent Test**: Click zoom-in button → text enlarges by 10%. Click zoom-out button → text shrinks by 10%. Buttons disable at boundaries (200% max, 100% min). Title bar remains unchanged.

### Implementation

- [x] T003 [P] [US1] Create ZoomInButton component in src/components/ZoomInButton.tsx — props: { onClick, disabled }, lucide-react ZoomIn icon (w-5 h-5), standard title bar button styling (p-1.5 rounded-lg border border-ink/20 bg-paper text-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 transition-colors cursor-pointer), disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-paper, onPointerDown stopPropagation, aria-label="Zoom in"
- [x] T004 [P] [US2] Create ZoomOutButton component in src/components/ZoomOutButton.tsx — same pattern as ZoomInButton with ZoomOut icon and aria-label="Zoom out"
- [x] T005 [US1] Modify TextDisplay to accept zoomLevel prop in src/components/TextDisplay.tsx — add optional zoomLevel prop (default 100), replace text-2xl class with inline style={{ fontSize: `${1.5 * (zoomLevel ?? 100) / 100}rem` }}, keep font-hanzi leading-[2.5] select-none cursor-default

**Checkpoint**: Button components created, TextDisplay accepts zoomLevel. Not yet wired — verify components render correctly in isolation.

---

## Phase 3: US3 + US4 — Zoom Indicator & Button Layout (P2/P3)

**Goal**: Display current zoom percentage next to title with smooth animation, and establish correct button ordering in title bar.

**Independent Test**: Change zoom level → indicator shows "(NNN%)" next to title with fade animation. Tab through buttons → order: Pinyin → ZoomIn → ZoomOut → Theme → Fullscreen → Close.

### Implementation

- [x] T006 [P] [US3] Add zoom indicator fade animation keyframes in src/index.css — add @keyframes zoom-indicator-fade (from opacity:0 to opacity:1), 200ms duration per constitution's 200-300ms ease guideline
- [x] T007 [US3] Modify TitleBar with zoom indicator, button imports, and ordering in src/components/TitleBar.tsx — expand TitleBarProps with zoomLevel, onZoomIn, onZoomOut, isMinZoom, isMaxZoom; add zoom indicator span next to h1 title: `<span key={zoomLevel}>(${zoomLevel}%)</span>` with subdued text-ink/40 styling and zoom-indicator-fade animation (200ms ease-in-out); import and render ZoomInButton (onClick=onZoomIn, disabled=isMaxZoom) and ZoomOutButton (onClick=onZoomOut, disabled=isMinZoom); reorder buttons: PinyinToggle → ZoomInButton → ZoomOutButton → ThemeToggle → FullscreenToggle → CloseButton

**Checkpoint**: TitleBar renders indicator and all 6 buttons in correct order. Not yet wired to hook.

---

## Phase 4: Integration & Wiring

**Purpose**: Connect useTextZoom hook to all UI components through App, completing the full feature.

- [x] T008 Wire useTextZoom hook and pass zoom props in src/App.tsx — import and call useTextZoom(), destructure { zoomLevel, zoomIn, zoomOut, isMinZoom, isMaxZoom }, pass zoom props to TitleBar (zoomLevel, onZoomIn=zoomIn, onZoomOut=zoomOut, isMinZoom, isMaxZoom), pass zoomLevel to TextDisplay
- [x] T009 Update App test assertions in src/App.test.tsx — update "renders TitleBar with title and **six** buttons" test (change expect(buttons).toHaveLength(4) → 6), update comment to reflect new button list (Pinyin, ZoomIn, ZoomOut, Theme, Fullscreen, Close)

**Checkpoint**: Full feature functional. Ctrl+/- and buttons change text size. Indicator updates. Persistence works. All existing tests pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately. BLOCKS all subsequent phases.
- **US1+US2 (Phase 2)**: Depends on Phase 1 (hook must exist for type contracts)
- **US3+US4 (Phase 3)**: Depends on Phase 1 (TitleBar needs zoom prop types). Can run in parallel with Phase 2.
- **Integration (Phase 4)**: Depends on Phases 1, 2, AND 3 (all components must exist)

### User Story Dependencies

- **US1 (Zoom In, P1)**: Requires foundational hook → ZoomInButton → TextDisplay mod → App wiring
- **US2 (Zoom Out, P2)**: Requires foundational hook → ZoomOutButton → App wiring. Shares TextDisplay with US1.
- **US3 (Indicator, P2)**: Requires foundational hook → index.css animation → TitleBar mod → App wiring
- **US4 (Button Order, P3)**: Achieved during TitleBar modification in Phase 3. No separate work.
- **US5 (Persistence, P1)**: Fully implemented in foundational hook (Phase 1). Verified by hook tests.

### Parallel Opportunities

```text
Phase 2 parallel:
  T003 (ZoomInButton) ‖ T004 (ZoomOutButton)

Phase 2+3 parallel (after Phase 1):
  T003+T004+T005 (buttons + TextDisplay) ‖ T006+T007 (animation + TitleBar)

Phase 4:
  T009 (App.test.tsx)  — after T008 completes
```

---

## Implementation Strategy

### MVP First (Phase 1 + Phase 2)

1. Complete Phase 1: Hook + tests with 100% coverage
2. Complete Phase 2: Button components + TextDisplay
3. **VALIDATE**: Hook tests pass, components render
4. Wire temporarily in App to verify zoom in/out works

### Incremental Delivery

1. Phase 1 → Hook ready, persistence works (US5 complete)
2. Phase 2 → Zoom buttons + text scaling (US1 + US2 functional)
3. Phase 3 → Indicator + ordering (US3 + US4 complete)
4. Phase 4 → Full integration (all stories wired)

Note: No tauri.conf.json change needed — `zoomHotkeysEnabled` defaults to `false` in Tauri 2 (native zoom hotkeys already disabled). See research R1.

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- Tests are REQUIRED for this feature (FR-027: 100% hook coverage)
- Hook tests should be written first/alongside hook (test-first per constitution V)
- Commit after each phase checkpoint
- Total: 9 tasks across 4 phases
- No tauri.conf.json change needed (zoomHotkeysEnabled defaults to false)
