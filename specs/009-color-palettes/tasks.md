# Tasks: Color Palette System

**Input**: Design documents from `/specs/009-color-palettes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Hook tests included per FR-026 (100% coverage requirement for `useColorPalette`).

**Organization**: Tasks grouped by user story. US4 (Button Ordering) is verified by Phase 3 TitleBar integration. US5 (Persistence) is implemented in Phase 2 hook.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Token Rename Reference

| Old | New |
|-----|-----|
| `bg-paper` | `bg-surface` |
| `text-ink` | `text-content` |
| `text-ink/50` | `text-content/50` |
| `text-ink/40` | `text-content/40` |
| `border-ink/20` | `border-content/20` |
| `border-ink/10` | `border-content/10` |
| `hover:bg-ink/5` | `hover:bg-content/5` |
| `hover:bg-vermillion/24` | `hover:bg-accent/24` |
| `ring-vermillion` | `ring-accent` |
| `focus-visible:ring-vermillion` | `focus-visible:ring-accent` |
| `focus:ring-vermillion` | `focus:ring-accent` |
| `--color-paper` | `--color-background` |
| `--color-ink` | `--color-text` |
| `--color-vermillion` | `--color-accent` |

---

## Phase 1: Foundational — CSS Token Rename

**Purpose**: Pure refactoring — rename all color tokens from palette-specific names to generic role-based names. No behavior change. T001–T002 must complete before T003–T013 (they define the new token names).

- [ ] T001 Rename CSS custom properties and body classes in src/index.css — `:root` and `.dark` blocks: `--color-paper`→`--color-background`, `--color-ink`→`--color-text`, `--color-vermillion`→`--color-accent`; body `@apply`: `bg-paper`→`bg-surface`, `text-ink`→`text-content`; rt rule: `--color-vermillion`→`--color-accent`
- [ ] T002 Rename Tailwind color tokens in tailwind.config.ts — `paper`→`surface`, `ink`→`content`, `vermillion`→`accent` (CSS property references update accordingly)
- [ ] T003 [P] Rename color classes in src/components/ThemeToggle.tsx per rename reference table
- [ ] T004 [P] Rename color classes in src/components/PinyinToggle.tsx per rename reference table
- [ ] T005 [P] Rename color classes in src/components/FullscreenToggle.tsx per rename reference table
- [ ] T006 [P] Rename color classes in src/components/CloseButton.tsx per rename reference table
- [ ] T007 [P] Rename color classes in src/components/ZoomInButton.tsx per rename reference table
- [ ] T008 [P] Rename color classes in src/components/ZoomOutButton.tsx per rename reference table
- [ ] T009 [P] Rename color classes in src/components/TextDisplay.tsx — `text-ink/50`→`text-content/50`
- [ ] T010 [P] Rename color classes in src/components/TitleBar.tsx — `bg-paper`→`bg-surface`, `border-ink/10`→`border-content/10`, `text-ink`→`text-content`, `text-ink/40`→`text-content/40`
- [ ] T011 [P] Rename color classes in src/components/RubyWord.tsx — `hover:bg-vermillion/24`→`hover:bg-accent/24`, `ring-vermillion`→`ring-accent`
- [ ] T012 [P] Rename color classes in src/App.tsx — `bg-paper`→`bg-surface`, `text-ink`→`text-content`
- [ ] T013 [P] Rename color class assertions in src/components/RubyWord.test.tsx — `hover:bg-vermillion\/24`→`hover:bg-accent\/24`, `focus-visible:ring-vermillion`→`focus-visible:ring-accent`

**Checkpoint**: All existing tests should still pass — this is a pure rename refactor with no logic changes.

---

## Phase 2: Foundational — Palette Data, CSS Rules, Hook + Tests

**Purpose**: Create palette definitions, add CSS palette rules, and implement the useColorPalette hook with 100% test coverage (FR-026). T014 and T015 are parallel (different files). T016 must precede T017 (TDD).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T014 [P] Create 7 palette definitions in src/data/palettes.ts — export `PaletteColors` and `ColorPalette` interfaces, `PALETTES` constant array (7 entries with id, name, light/dark hex colors per contracts/interfaces.md), and `DEFAULT_PALETTE_ID` (`"vermillion-scroll"`)
- [ ] T015 [P] Add 14 `[data-palette]` CSS rule blocks to src/index.css — 7 palettes × 2 modes (light/dark) using RGB values from quickstart.md color reference table. Format: `[data-palette="id"] { --color-background: R G B; --color-text: R G B; --color-accent: R G B; }` and `.dark[data-palette="id"] { ... }`
- [ ] T016 Write useColorPalette hook tests in src/hooks/useColorPalette.test.ts — 10 test cases per quickstart.md testing strategy: default init, restore valid, persist on change, invalid stored fallback, unknown ID fallback, dataset.palette update, localStorage read error, localStorage write error, setPalette unknown ID no-op, palettes returns all 7. Follow usePinyinVisibility.test.ts patterns (localStorage mock, console.error spy, renderHook/act/waitFor). Target: 100% coverage
- [ ] T017 Implement useColorPalette hook in src/hooks/useColorPalette.ts — useState lazy init from localStorage (key `"colorPalette"`), validate against PALETTES array, fallback to DEFAULT_PALETTE_ID, useEffect to persist + set `document.documentElement.dataset.palette`, setPalette validates before updating. Return `{ paletteId, setPalette, palettes }` per contracts/interfaces.md

**Checkpoint**: Hook tests pass with 100% coverage. Palette data and CSS rules ready for UI integration.

---

## Phase 3: US1+US2+US6 — Core Palette Selection + Keyboard Navigation + Dismissal (P1) 🎯 MVP

**Goal**: User can open palette dropdown, navigate with keyboard, select a palette and see colors change immediately, and dismiss the dropdown without changing palette.

**Independent Test**: Click palette toggle → select "Jade Garden" → verify colors update. Tab to button → Enter → arrow keys → Enter to select. Click outside → dropdown closes without change. Tab away → dropdown closes, focus moves to ThemeToggle.

- [ ] T018 [P] [US1] Refactor ThemeToggle to props-driven interface in src/components/ThemeToggle.tsx — remove internal `useTheme()` call, accept `theme: "light" | "dark"` and `onToggle: () => void` props per contracts/interfaces.md §4. Keep existing rendering logic (Sun/Moon icons, aria-label, aria-pressed, onPointerDown stopPropagation)
- [ ] T019 [US1] Update ThemeToggle tests in src/components/ThemeToggle.test.tsx — remove localStorage mocking, render with explicit props (`theme="light"`, `onToggle={vi.fn()}`), test icon rendering per theme, test onToggle callback, test aria attributes
- [ ] T020 [P] [US1] Create PaletteSelector component in src/components/PaletteSelector.tsx — accept props per contracts/interfaces.md §3 (`palettes`, `selectedPaletteId`, `onSelect`, `theme`). Toggle button with lucide-react `Palette` icon (same button styling as other title bar buttons). Dropdown with palette names. Click/Enter to open toggle button (not Space per FR-012). Click/Enter on item selects palette and closes dropdown. Up/Down arrow keys with wrapping (FR-014/FR-015). `aria-activedescendant` focus pattern with `focusedIndex` state. Dropdown opens with selected palette focused (FR-018). `onPointerDown` stopPropagation on toggle button (title bar drag region pattern)
- [ ] T021 [P] [US1] Integrate palette system in src/App.tsx — lift `useTheme()` call from ThemeToggle to App, add `useColorPalette()` call, pass `theme`/`onThemeToggle`/palette props to TitleBar. Remove any direct `useTheme` usage from ThemeToggle
- [ ] T022 [US1] Update TitleBar to accept palette + theme props in src/components/TitleBar.tsx — add new props per contracts/interfaces.md §5, render PaletteSelector between ZoomOutButton and ThemeToggle (FR-024 button order), pass `theme`/`onToggle` to ThemeToggle as props
- [ ] T023 [US6] Add click-outside handler to PaletteSelector in src/components/PaletteSelector.tsx — `mousedown` document listener added when dropdown opens, removed when closed. Uses `containerRef.current.contains()` to detect outside clicks. Toggle button `onPointerDown` with `stopPropagation()` prevents the listener from firing on toggle clicks (per research.md §5)
- [ ] T024 [US6] Add Tab-away detection to PaletteSelector in src/components/PaletteSelector.tsx — `onBlur` handler checks `e.relatedTarget` via `containerRef.current.contains()`. If focus moves outside component, close dropdown (per quickstart.md Tab-Away Detection pattern)
- [ ] T025 [P] [US1] Update button count assertion in src/App.test.tsx — change expected button count from 6 to 7 to account for new PaletteSelector toggle button

**Checkpoint**: User can select palettes via click or keyboard. Dropdown dismisses via click-outside and Tab. Colors change immediately. All 14 palette×theme combinations work.

Note: US4 (Button Ordering) verified by T022. US5 (Persistence) implemented by Phase 2 hook.

---

## Phase 4: US3 — Visual Feedback in Palette Dropdown (P2)

**Goal**: User can visually distinguish selected palette from focused palette, and preview each palette's colors.

**Independent Test**: Open dropdown with "Vermillion Scroll" active → arrow to "Jade Garden" → verify "Vermillion Scroll" shows selected indicator AND "Jade Garden" shows focused highlight (visually distinct). Verify each item shows 3 color swatches.

- [ ] T026 [US3] Add selected palette indicator and focused palette highlight to PaletteSelector in src/components/PaletteSelector.tsx — selected item gets distinct background/checkmark (FR-008), focused item gets visually different highlight (FR-009), both can coexist when different items
- [ ] T027 [US3] Add theme-aware color swatches to PaletteSelector in src/components/PaletteSelector.tsx — 3 small colored circles per palette item showing background/text/accent colors from the current `theme` variant (FR-007). Swatches update immediately on theme switch (edge case #4)

**Checkpoint**: Dropdown shows clear selected vs. focused states. Each palette entry previews its colors via swatches.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all stories.

- [ ] T028 Run full test suite (`npm run test`) and verify all tests pass after all changes
- [ ] T029 Verify `rt` element accent color works for all palettes — confirm `rt { color: rgb(var(--color-accent)); }` in src/index.css renders correct accent color per FR-027 and SC-008

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Token Rename)**: No dependencies — start immediately. T001+T002 first, then T003–T013 in parallel.
- **Phase 2 (Data + Hook)**: Depends on Phase 1 (CSS properties renamed). T014+T015 parallel, then T016→T017 (TDD).
- **Phase 3 (US1+US2+US6)**: Depends on Phase 2 (hook + palettes exist). T018, T020, T021 parallel, then T022 (depends on T018+T020), then T023→T024 (dismissal, depends on T020), T025 parallel with others.
- **Phase 4 (US3)**: Depends on Phase 3 (PaletteSelector exists). T026→T027 sequential (indicators before swatches).
- **Phase 5 (Polish)**: Depends on all previous phases.

### User Story Coverage

| User Story | Priority | Covered By |
|------------|----------|------------|
| US1 — Select a Color Palette | P1 | Phase 2 (hook) + Phase 3 (UI) |
| US2 — Keyboard Navigation | P1 | Phase 3 T020 (PaletteSelector keyboard handling) |
| US3 — Visual Feedback | P2 | Phase 4 (indicators + swatches) |
| US4 — Title Bar Button Ordering | P2 | Phase 3 T022 (TitleBar integration, FR-024) |
| US5 — Palette Preference Persistence | P2 | Phase 2 T016–T017 (hook localStorage) |
| US6 — Dropdown Dismissal | P3 | Phase 3 T023–T024 (click-outside + Tab-away) |

### Parallel Opportunities

**Phase 1** (after T001–T002): T003–T013 — all 11 component/test file renames in parallel
**Phase 2**: T014 ∥ T015 — palette data and CSS rules in parallel
**Phase 3**: T018 ∥ T020 ∥ T021 ∥ T025 — ThemeToggle refactor, PaletteSelector, App.tsx, App.test.tsx in parallel

---

## Parallel Example: Phase 1 Token Rename

```bash
# After T001 + T002 complete, launch all renames in parallel:
Task: "Rename color classes in src/components/ThemeToggle.tsx"
Task: "Rename color classes in src/components/PinyinToggle.tsx"
Task: "Rename color classes in src/components/FullscreenToggle.tsx"
Task: "Rename color classes in src/components/CloseButton.tsx"
Task: "Rename color classes in src/components/ZoomInButton.tsx"
Task: "Rename color classes in src/components/ZoomOutButton.tsx"
Task: "Rename color classes in src/components/TextDisplay.tsx"
Task: "Rename color classes in src/components/TitleBar.tsx"
Task: "Rename color classes in src/components/RubyWord.tsx"
Task: "Rename color classes in src/App.tsx"
Task: "Rename color class assertions in src/components/RubyWord.test.tsx"
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3)

1. Complete Phase 1: Token Rename (pure refactor, tests still pass)
2. Complete Phase 2: Palette Data + Hook (foundation + 100% hook coverage)
3. Complete Phase 3: US1+US2+US6 (core selection + keyboard nav + dismissal)
4. **STOP and VALIDATE**: All 14 palette×theme combinations work, keyboard navigation functional, click-outside and Tab dismissal work
5. This delivers a fully functional palette selector with persistence, keyboard access, and proper dismissal

### Incremental Delivery

1. Phase 1 → Token rename complete, app works identically
2. Phase 2 → Hook + data ready, CSS palette rules active
3. Phase 3 → Palette selector fully usable (MVP!)
4. Phase 4 → Visual polish (swatches, indicators)
5. Phase 5 → Final verification

---

## Notes

- **RubyWord.tsx** was not in the original plan's modified files list but contains `hover:bg-vermillion/24` and `ring-vermillion` — included as T011
- Only **RubyWord.test.tsx** has color class assertions in test files — other test files (ThemeToggle, PinyinToggle, FullscreenToggle, CloseButton) do not assert on color class names
- ThemeToggle.test.tsx changes in Phase 3 are for the **props-driven refactor**, not color class renames
- PaletteSelector is built with full keyboard nav and dismissal from the start (US1+US2+US6 are all in Phase 3) — no incremental layering
- `text-ink/40` found in TitleBar.tsx — added to rename reference table (was not in quickstart cheat sheet)
