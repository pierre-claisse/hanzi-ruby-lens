# Tasks: Palette Fonts

**Input**: Design documents from `/specs/020-palette-fonts/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Included — plan.md specifies `tests/unit/css-variables.test.ts`.

**Organization**: Tasks grouped by user story. US2 (pinyin diacritics) depends on
US1 (font switching) since correct rendering requires the fonts to be wired up first.

**Revised**: 2026-02-21 — Latin fonts removed. CJK fonts cover the entire UI.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Dependencies)

**Purpose**: Install CJK font npm packages required by all subsequent phases

- [X] T001 Install 6 CJK font npm packages in package.json: @fontsource/cactus-classical-serif, @fontsource/chocolate-classical-sans, @fontsource/lxgw-wenkai-tc, @fontsource-variable/chiron-hei-hk, @fontsource/huninn, chiron-sung-hk-webfont
- [X] T002 Verify font-family names by inspecting each package's CSS @font-face declarations in node_modules/ — confirm names match plan.md table or record corrections (NOTE: Chiron Sung HK is "Chiron Sung HK WS", not "Chiron Sung HK VF")

**Checkpoint**: All font packages installed, font-family names verified

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire up font imports and Tailwind config — MUST complete before any palette can use fonts

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add 6 CJK font import statements to src/main.tsx: @fontsource/cactus-classical-serif, @fontsource/chocolate-classical-sans, @fontsource/lxgw-wenkai-tc, @fontsource-variable/chiron-hei-hk, @fontsource/huninn, chiron-sung-hk-webfont/css/vf.css
- [X] T004 Update fontFamily in tailwind.config.ts — single palette family: ['var(--font-palette)', '"Noto Sans TC Variable"', 'sans-serif']

**Checkpoint**: Fonts imported globally, Tailwind references CSS variable with fallback (FR-005)

---

## Phase 3: User Story 1 — Palette switches fonts (Priority: P1) MVP

**Goal**: Switching palettes changes the font for all text (Chinese, pinyin, UI) via a single CSS custom property

**Independent Test**: Select each of the six palettes and verify that all text visibly changes typeface

### Implementation for User Story 1

- [X] T005 [P] [US1] Add font field (string) to each palette in src/data/palettes.ts — per data-model.md assignments (vermillion-scroll: "Cactus Classical Serif", jade-garden: "LXGW WenKai TC", indigo-silk: "Chiron Hei HK Variable", plum-blossom: "Huninn", golden-pavilion: "Chiron Sung HK WS", ink-wash: "Chocolate Classical Sans")
- [X] T006 [P] [US1] Add --font-palette CSS custom property to each [data-palette] block in src/index.css — values must match font-family names from T005

**Checkpoint**: Palette switching changes fonts for all text. US1 acceptance scenarios 1-3 should pass.

---

## Phase 4: User Story 2 — Pinyin diacritics render correctly (Priority: P2)

**Goal**: All pinyin tone marks (ǎ, ě, ǐ, ǒ, ǔ, ǖ, ǘ, ǚ, ǜ) render correctly in every palette

**Independent Test**: Display text containing all four tones on each vowel (including ü variants) and cycle through all six palettes — no tofu boxes

**Dependency**: Requires US1 complete (fonts must be wired up)

### Implementation for User Story 2

- [X] T007 [US2] Write unit test in tests/unit/css-variables.test.ts — for each of the six palettes, assert that [data-palette] CSS rules define --font-palette with the correct font-family value per data-model.md
- [X] T008 [US2] Run test suite to verify all CSS variable assertions pass: npm test

**Checkpoint**: Automated tests confirm correct font variables for all palettes. Diacritic coverage guaranteed by CJK font selection (research.md).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation

- [X] T009 [P] Update CLAUDE.md Key dependencies list to include new font packages
- [X] T010 Run frontend build to verify no errors: npm run build:frontend
- [X] T011 Run quickstart.md scenarios 1-5 manually to validate visual correctness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (packages must be installed before importing)
- **US1 (Phase 3)**: Depends on Phase 2 (font imports and Tailwind config must be in place)
- **US2 (Phase 4)**: Depends on Phase 3 (fonts must be wired to palettes to test diacritics)
- **Polish (Phase 5)**: Depends on Phases 3 and 4

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no other story dependencies
- **User Story 2 (P2)**: Depends on US1 being complete — diacritics require fonts to be active

### Within Each Phase

- T005 and T006 can run in parallel (different files: palettes.ts vs index.css)
- T003 and T004 are sequential (T003 registers fonts, T004 references them)

### Parallel Opportunities

- T005 ‖ T006 (palettes.ts and index.css are independent files)
- T009 can run in parallel with T007/T008

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Install font packages
2. Complete Phase 2: Font imports + Tailwind config
3. Complete Phase 3: Palette font assignments (palettes.ts + index.css)
4. **STOP and VALIDATE**: Switch palettes and verify fonts change visually
5. Proceed to US2 verification

### Incremental Delivery

1. Setup + Foundational → Fonts available, Tailwind wired
2. Add US1 → Palette switching changes fonts → Validate (MVP!)
3. Add US2 → Automated tests confirm diacritic coverage → Validate
4. Polish → Docs, build check, quickstart scenarios

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Font-family names in T005/T006 MUST match names verified in T002
- Single CJK font per palette covers all text (Chinese, pinyin, UI) — no separate Latin fonts needed
- Total file changes: 5 modified (package.json, main.tsx, palettes.ts, index.css, tailwind.config.ts) + 1 new (css-variables.test.ts) + 1 updated (CLAUDE.md)
