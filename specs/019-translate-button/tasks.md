# Tasks: Google Translate Button

**Input**: Design documents from `/specs/019-translate-button/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Organization**: Single user story (P1). All dependencies are already in place — no setup or foundational phase needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 — Translate Full Text via Title Bar (Priority: P1)

**Goal**: Add a translate button to the title bar that opens the full raw text in Google Translate (zh-TW → en). Always visible, enabled when raw text exists, disabled/grayed when empty.

**Independent Test**: Enter any Chinese text, click the translate button, verify the system browser opens Google Translate with the correct text and language pair. Verify the button is disabled when no text exists.

### Tests

> **Write FIRST, ensure they FAIL before implementation**

- [X] T001 [US1] Write TranslateButton component tests in `tests/unit/TranslateButton.test.tsx`
  - Renders the Languages icon
  - Has aria-label "Translate text" and title "Google Translate"
  - Calls openUrl with correct Google Translate URL when clicked (mock openUrl)
  - URL contains `sl=zh-TW`, `tl=en`, and URL-encoded rawInput
  - Is disabled (opacity-50, cursor-not-allowed) when rawInput is empty
  - Does not call openUrl when disabled and clicked
  - Truncates URL-encoded text exceeding 5,000 characters

### Implementation

- [X] T002 [US1] Create TranslateButton component in `src/components/TranslateButton.tsx`
  - Props: `rawInput: string`
  - Icon: `Languages` from lucide-react
  - Disabled when `rawInput === ""`
  - onClick: build `https://translate.google.com/?sl=zh-TW&tl=en&text={encoded}` URL, truncate encoded text to 5,000 chars, call `openUrl(url)`
  - Styling: same CSS classes as ZoomInButton (with `disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface`)
  - aria-label="Translate text", title="Google Translate"
  - `onPointerDown={(e) => e.stopPropagation()}` (same as all TitleBar buttons)

- [X] T003 [US1] Modify TitleBar to include TranslateButton in `src/components/TitleBar.tsx`
  - Add `rawInput?: string` to `TitleBarProps` interface
  - Import TranslateButton
  - Insert `<TranslateButton rawInput={rawInput ?? ""} />` between the edit button block and `<PinyinToggle />`

- [X] T004 [US1] Pass rawInput from App to TitleBar in `src/App.tsx`
  - Add `rawInput={text?.rawInput ?? ""}` prop to the `<TitleBar />` call

**Checkpoint**: TranslateButton is functional. Click opens Google Translate with full text. Button disabled when no text. All tests pass.

---

## Phase 2: Polish

- [X] T005 Run full test suite (`npm test`) to validate no regressions
- [ ] T006 Manual validation per quickstart.md scenarios (empty state, with text, long text, input view) — REQUIRES USER

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: No setup or foundational phase needed — all dependencies (lucide-react, @tauri-apps/plugin-opener) already exist
- **Phase 2 (Polish)**: Depends on Phase 1 completion

### Task Dependencies

```
T001 (tests) → T002 (component) → T003 (TitleBar) → T004 (App.tsx) → T005 (full tests) → T006 (manual)
```

All tasks are sequential — each depends on the previous:
- T002 depends on T001 (TDD: tests first)
- T003 depends on T002 (TitleBar imports TranslateButton)
- T004 depends on T003 (App passes prop that TitleBar now expects)
- T005 depends on T004 (full suite validates everything together)

### Parallel Opportunities

None for this feature — strictly sequential chain of 4 files (test → component → TitleBar → App), each importing or depending on the previous.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001: Write failing tests
2. T002: Create TranslateButton (tests pass)
3. T003: Wire into TitleBar
4. T004: Connect in App.tsx
5. **STOP and VALIDATE**: `npm test` + manual check
6. Feature complete

---

## Notes

- Single user story, 6 tasks, strictly sequential
- No new dependencies to install
- No Rust backend changes
- No database/schema changes
- `openUrl` is fire-and-forget (no await needed)
- Tooltip uses `title` attribute (same pattern as existing buttons with `aria-label`)
