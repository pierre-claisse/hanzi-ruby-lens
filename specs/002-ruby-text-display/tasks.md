# Tasks: Ruby Text Display

**Input**: Design documents from `/specs/002-ruby-text-display/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure the project foundation
(theme, fonts, types) that all components depend on.

- [ ] T001 Install font dependencies: `@fontsource-variable/noto-sans-tc` and `@fontsource-variable/inter` via npm
- [ ] T002 Add font imports to `src/main.tsx` — import `@fontsource-variable/noto-sans-tc` and `@fontsource-variable/inter` at the top of the entry file
- [ ] T003 Configure Tailwind theme in `tailwind.config.ts` — add `darkMode: "selector"`, semantic colors (`paper`, `ink`, `vermillion`) using CSS variable pattern with `<alpha-value>`, font families (`font-hanzi` for Noto Sans TC Variable, `font-sans` for Inter Variable), and custom opacity `"8": "0.08"`
- [ ] T004 Add CSS custom properties and ruby base styles in `src/index.css` — define `:root` light mode variables (paper: 254 252 243, ink: 45 45 45, vermillion: 200 75 49), `.dark` overrides (paper: 26 26 46, ink: 245 240 232), `@layer base` rules for `body` (font-sans, antialiased, bg-paper, text-ink, transition-colors), `rt` defaults (vermillion color, ruby-align center), and `ruby` defaults (ruby-position over, white-space nowrap)
- [ ] T005 Define domain types in `src/types/domain.ts` — export `Word` interface (characters: string, pinyin: string), `TextSegment` discriminated union (type "word" with Word, type "plain" with text string), and `Text` interface (segments: TextSegment[])

**Checkpoint**: Project has fonts loading, theme system active, and domain types defined. Ready for components.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the hardcoded sample data that all components will render.

**CRITICAL**: No component work can begin until sample data exists.

- [ ] T006 Create hardcoded sample Text in `src/data/sample-text.ts` — export a `Text` object containing ~20–30 segments that serve as a visual test bed. Use traditional Chinese characters. The sample MUST include all rendering paths: (a) standard multi-character Words (現在/xiànzài, 知識/zhīshì, 覺得/juéde), (b) single-character Words (我/wǒ, 是/shì, 的/de), (c) non-Word content (Chinese punctuation 。，！, spaces, numbers), and (d) a progression of long-pinyin stress cases placed near each other for visual comparison — e.g., 裝飾/zhuāngshì (2 chars, 10 pinyin), 裝飾品/zhuāngshìpǐn (3 chars, 12 pinyin), 乘風破浪/chéngfēngpòlàng (4 chars, 16 pinyin). These extreme Words MUST appear adjacent to normal-length Words so the user can visually inspect whether ruby annotations overflow or overlap.

**Checkpoint**: Sample data ready. Component implementation can begin.

---

## Phase 3: User Story 1 — Read Chinese Text with Pinyin (Priority: P1)

**Goal**: A learner opens the app and sees hardcoded Chinese text with pinyin ruby annotations above each Word, styled with the Ink & Vermillion theme, with hover interactions and a minimum-width overlay.

**Independent Test**: Launch the app. Chinese text appears with pinyin annotations. Hover highlights Words. Window below 400px shows overlay. Light and dark modes both work.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T007 [P] [US1] Write RubyWord component tests in `src/components/RubyWord.test.tsx` — test that: (a) a Word renders a `<ruby>` element containing the characters and an `<rt>` with the pinyin, (b) multi-character Word (現在) shows single pinyin unit (xiànzài), (c) single-character Word (我) shows pinyin (wǒ), (d) multi-character Word with long combined pinyin (e.g., 乘風破浪/chéngfēngpòlàng — 16 Latin chars above 4 Chinese chars) renders without layout overflow or overlap with adjacent Words, (e) ruby element has hover transition classes
- [ ] T008 [P] [US1] Write TextDisplay component tests in `src/components/TextDisplay.test.tsx` — test that: (a) all Word segments render as RubyWord components, (b) non-Word segments render as plain text without `<ruby>`, (c) Chinese punctuation (。，) renders inline without annotation, (d) empty Text shows placeholder message, (e) the container has correct line-height and font classes for ruby spacing
- [ ] T009 [P] [US1] Write MinWidthOverlay component tests in `src/components/MinWidthOverlay.test.tsx` — test that: (a) overlay is hidden when window width >= 400px, (b) overlay is visible when window width < 400px, (c) overlay contains a message asking the user to increase window size

### Implementation for User Story 1

- [ ] T010 [P] [US1] Implement RubyWord component in `src/components/RubyWord.tsx` — accepts a `Word` prop, renders `<ruby>{characters}<rp>(</rp><rt>{pinyin}</rt><rp>)</rp></ruby>` with Tailwind classes: `font-hanzi` on the ruby element, `text-vermillion` on `<rt>`, hover effect `hover:bg-vermillion/8` with `transition-colors duration-200 ease-in-out`, rounded corners
- [ ] T011 [P] [US1] Implement useMinWidth hook in `src/hooks/useMinWidth.ts` — tracks window width via `resize` event listener with cleanup, returns boolean `isBelowMinWidth` (true when `window.innerWidth < 400`)
- [ ] T012 [US1] Implement MinWidthOverlay component in `src/components/MinWidthOverlay.tsx` — uses `useMinWidth` hook, renders a full-screen fixed overlay with `bg-paper text-ink` centered message when below 400px, hidden otherwise. Message: sober, constitutional tone, asking user to widen the window
- [ ] T013 [US1] Implement TextDisplay component in `src/components/TextDisplay.tsx` — accepts a `Text` prop, maps over `segments`: renders `RubyWord` for "word" type segments, renders plain `<span>` for "plain" type segments. Container uses `font-hanzi text-2xl leading-[2.8]` for proper ruby spacing. Shows placeholder message (centered, muted ink) when segments array is empty. Includes `MinWidthOverlay`.
- [ ] T014 [US1] Update App component in `src/App.tsx` — import `TextDisplay` and the sample Text from `src/data/sample-text.ts`, replace the current placeholder `<h1>` with `<TextDisplay text={sampleText} />` wrapped in a centered container with `bg-paper text-ink min-h-screen`, generous padding, and a `max-width` constraint (e.g., `max-w-2xl mx-auto`) to enforce portrait page proportion per FR-005
- [ ] T015 [US1] Update App test in `src/App.test.tsx` — replace the current "renders Hanzi Ruby Lens heading" test with a test that verifies the App renders the TextDisplay with sample data (at least one `<ruby>` element is present in the document)

**Checkpoint**: User Story 1 fully functional. App displays Chinese text with pinyin ruby annotations, hover interactions, minimum-width overlay, and Ink & Vermillion theme in both light and dark modes.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation via Docker pipeline

- [ ] T016 Run `npm run test` to execute all Vitest tests inside Docker container — verify all tests pass (RubyWord, TextDisplay, MinWidthOverlay, App)
- [ ] T017 Run `npm run build` to build the Tauri application inside Docker container — verify build succeeds and `.exe` appears in `output/`
- [ ] T018 Run quickstart.md manual verification checklist against the built application

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T005 (domain types)
- **User Story 1 (Phase 3)**: Depends on all of Phase 1 + Phase 2
- **Polish (Phase 4)**: Depends on all of Phase 3

### Within User Story 1

- Tests (T007, T008, T009) MUST be written and FAIL before implementation
- T010 (RubyWord) and T011 (useMinWidth) are parallel — different files, no deps
- T012 (MinWidthOverlay) depends on T011 (uses the hook)
- T013 (TextDisplay) depends on T010 (uses RubyWord) and T012 (includes overlay)
- T014 (App) depends on T013 (uses TextDisplay)
- T015 (App test) depends on T014 (tests the updated App)

### Parallel Opportunities

Setup phase:
```
T001 → T002 (sequential: install then import)
T003, T004, T005 can run in parallel after T002
```

User Story 1 tests (all parallel):
```
T007 (RubyWord test) | T008 (TextDisplay test) | T009 (MinWidthOverlay test)
```

User Story 1 implementation:
```
T010 (RubyWord) | T011 (useMinWidth)    ← parallel
        ↓                ↓
      T012 (MinWidthOverlay)             ← depends on T011
        ↓
      T013 (TextDisplay)                 ← depends on T010 + T012
        ↓
      T014 (App)                         ← depends on T013
        ↓
      T015 (App test)                    ← depends on T014
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

This feature IS the MVP — there is only one user story.

1. Complete Phase 1: Setup (fonts, theme, types)
2. Complete Phase 2: Foundational (sample data)
3. Write tests (T007–T009) — verify they FAIL
4. Implement components (T010–T015) — verify tests PASS
5. Complete Phase 4: Docker test + build validation
6. **DONE**: App displays Chinese text with pinyin ruby annotations

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] label maps all story tasks to the single user story
- This feature has exactly one user story — the entire task list delivers it
- Commit after each task or logical group
- All tests run inside Docker (constitution V and VI)
