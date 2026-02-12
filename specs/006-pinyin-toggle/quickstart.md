# Developer Quickstart: Pinyin Toggle & Title Bar Improvements

**Feature**: 006-pinyin-toggle
**Branch**: `006-pinyin-toggle`
**For**: Developers implementing this feature

## Overview

This feature adds a Pinyin visibility toggle button to the title bar and makes three complementary improvements: fixing title bar dragging, reducing button sizes, and simplifying cursor states.

**Estimated Implementation Time**: 4-6 hours (including tests)

## Prerequisites

- ✅ Spec reviewed: [spec.md](./spec.md)
- ✅ Research completed: [research.md](./research.md)
- ✅ Data model understood: [data-model.md](./data-model.md)
- ✅ Contracts reviewed: [contracts/localStorage.md](./contracts/localStorage.md)
- ✅ Development environment ready (Docker + npm)

## Implementation Checklist

### Phase 1: Create Pinyin Visibility Hook (30-45 min)

- [ ] **Create** `src/hooks/usePinyinVisibility.ts`
  - Clone pattern from `src/hooks/useTheme.ts`
  - Change key to `"pinyinVisible"`, default to `true`
  - Return type: `[boolean, (visible: boolean) => void]`

- [ ] **Create** `src/hooks/usePinyinVisibility.test.ts`
  - Test: Returns `[true, function]` on first run
  - Test: Persists to localStorage on state change
  - Test: Restores from localStorage on subsequent runs
  - Test: Handles localStorage errors gracefully

**Acceptance**: `npm run test` passes for hook tests.

### Phase 2: Create Pinyin Toggle Button Component (30-45 min)

- [ ] **Create** `src/components/PinyinToggle.tsx`
  - Clone pattern from `src/components/ThemeToggle.tsx`
  - Import `Eye` and `EyeClosed` from `lucide-react`
  - Props: `visible: boolean`, `onToggle: (visible: boolean) => void`
  - Icon logic: `visible ? <Eye /> : <EyeClosed />`
  - ARIA label: "Hide Pinyin" (when visible), "Show Pinyin" (when hidden)
  - Add `aria-pressed={visible}`
  - Add `onPointerDown={(e) => e.stopPropagation()}` to prevent window dragging

- [ ] **Create** `src/components/PinyinToggle.test.tsx`
  - Test: Renders Eye icon when `visible={true}`
  - Test: Renders EyeClosed icon when `visible={false}`
  - Test: Calls `onToggle(!visible)` on click
  - Test: Has correct ARIA labels
  - Test: Has `aria-pressed` matching visibility state

**Acceptance**: `npm run test` passes for component tests.

### Phase 3: Modify RubyWord Component (20-30 min)

- [ ] **Modify** `src/components/RubyWord.tsx`
  - Add prop: `showPinyin: boolean`
  - **IMPORTANT**: Always render full `<ruby><rt>...</rt></ruby>` structure
  - Use CSS classes with opacity transition to hide/show Pinyin WITHOUT layout shift:
    ```tsx
    <rt className={`text-vermillion transition-opacity duration-200 ease-in-out ${showPinyin ? 'opacity-100' : 'opacity-0'}`}>
      {word.pinyin}
    </rt>
    ```
  - This ensures Chinese characters DON'T move when toggling Pinyin
  - Line height remains constant (ruby annotation space always reserved)
  - 200ms fade transition matches existing RubyWord hover transitions (Constitution I compliance)

- [ ] **Modify** `src/components/RubyWord.test.tsx`
  - Test: Always renders `<ruby>` and `<rt>` regardless of `showPinyin`
  - Test: When `showPinyin={true}`, `<rt>` has `opacity-100` class (or equivalent opacity: 1)
  - Test: When `showPinyin={false}`, `<rt>` has `opacity-0` class (or equivalent opacity: 0)
  - Test: `<rt>` has `transition-opacity duration-200 ease-in-out` classes for smooth animation
  - Test: Always renders Chinese characters
  - Test: No layout shift between visible/hidden states (optional visual regression test)

**Acceptance**: `npm run test` passes for modified component tests. Chinese characters don't move vertically when toggling Pinyin. Pinyin fades in/out smoothly with 200ms transition.

### Phase 4: Modify TextDisplay Component (15-20 min)

- [ ] **Modify** `src/components/TextDisplay.tsx`
  - Add prop: `showPinyin: boolean`
  - Pass to RubyWord: `<RubyWord word={segment.word} showPinyin={showPinyin} />`

- [ ] **Modify** `src/components/TextDisplay.test.tsx`
  - Test: Passes `showPinyin` prop to all RubyWord components
  - Test: No `<rt>` elements when `showPinyin={false}`

**Acceptance**: `npm run test` passes for modified component tests.

### Phase 5: Wire Up App Component (15-20 min)

- [ ] **Modify** `src/App.tsx`
  - Import `usePinyinVisibility`
  - Call hook: `const [pinyinVisible, setPinyinVisible] = usePinyinVisibility();`
  - Pass to TextDisplay: `<TextDisplay text={sampleText} showPinyin={pinyinVisible} />`
  - Pass to PinyinToggle (in TitleBar): `<PinyinToggle visible={pinyinVisible} onToggle={setPinyinVisible} />`

- [ ] **Modify** `src/App.test.tsx`
  - Test: Renders 4 title bar buttons (Pinyin, Theme, Fullscreen, Close)
  - Update existing test to expect 4 buttons instead of 3

**Acceptance**: `npm run test` passes for App tests.

### Phase 6: Update Title Bar (30-45 min)

- [ ] **Modify** `src/components/TitleBar.tsx`
  - Import `PinyinToggle`
  - Add PinyinToggle as first button in button group
  - Order: `<PinyinToggle />`, `<ThemeToggle />`, `<FullscreenToggle />`, `<CloseButton />`
  - Change button container gap from `gap-2` to `gap-1`
  - Ensure `data-tauri-drag-region` remains on `<header>` element
  - Ensure `<h1>` title text does NOT have `pointer-events: none` or click handlers

- [ ] **Test title bar dragging**:
  - Manual test: Click and drag on title text → window moves
  - Manual test: Click and drag on empty space → window moves
  - Manual test: Click button → button action fires, window does NOT move

**Acceptance**: Window dragging works from title text and empty space (FR-007, FR-008).

### Phase 7: Reduce Button Sizes (20-30 min)

- [ ] **Modify** `src/components/ThemeToggle.tsx`
  - Change `p-2` to `p-1.5`
  - Add `cursor-pointer` class

- [ ] **Modify** `src/components/FullscreenToggle.tsx`
  - Change `p-2` to `p-1.5`
  - Add `cursor-pointer` class

- [ ] **Modify** `src/components/CloseButton.tsx`
  - Change `p-2` to `p-1.5`
  - Add `cursor-pointer` class

- [ ] **Verify** all buttons:
  - Icon size remains `w-5 h-5` (20×20px)
  - Total button size is ~32×32px (meets FR-012)

**Acceptance**: Buttons are visibly smaller but still easily clickable (FR-010, FR-011, FR-012).

### Phase 8: Simplify Cursor States (10-15 min)

- [ ] **Modify** `src/index.css`
  - Delete lines 32-40 (drag region cursor rules):
    ```css
    /* Drag region cursor styles */
    [data-tauri-drag-region] {
      cursor: grab;
      user-select: none;
    }
    [data-tauri-drag-region]:active {
      cursor: grabbing;
    }
    ```
  - Keep `user-select: none` if needed, but remove cursor rules

- [ ] **Verify** cursors:
  - Hovering over title bar drag region shows default arrow cursor (FR-013)
  - Dragging window shows default arrow cursor (FR-014)
  - Hovering over buttons shows pointer cursor (FR-015)

**Acceptance**: No grab/grabbing cursors anywhere (FR-013, FR-014, SC-005).

### Phase 9: Integration Tests (30-45 min)

- [ ] **Create** `tests/integration/pinyin-toggle.test.tsx`
  - Test: End-to-end toggle flow (click button → Pinyin hides → click again → Pinyin shows)
  - Test: Preference persists after simulated page reload (clear DOM, re-render App)
  - Test: Multiple rapid toggles work correctly (no UI flicker)

- [ ] **Create** `tests/contract/localStorage.test.ts`
  - Test: Writing `"true"` and reading returns `"true"`
  - Test: Writing `"false"` and reading returns `"false"`
  - Test: Reading non-existent key returns `null`
  - Test: localStorage error handling (mock QuotaExceededError)

**Acceptance**: `npm run test` passes all integration and contract tests.

### Phase 10: Manual Testing (20-30 min)

- [ ] **Run** `npm run build`
- [ ] **Launch** application (executable from Docker output)
- [ ] **Test** Pinyin toggle:
  - [ ] Click Pinyin toggle → Pinyin disappears
  - [ ] Click again → Pinyin reappears
  - [ ] Close app → Reopen → Previous state restored
- [ ] **Test** title bar dragging:
  - [ ] Drag on title text → Window moves
  - [ ] Drag on empty space → Window moves
  - [ ] Click button → Button works, window doesn't move
- [ ] **Test** button sizing:
  - [ ] Buttons are smaller than before
  - [ ] Buttons are still easily clickable
  - [ ] All 4 buttons have consistent size
- [ ] **Test** cursor states:
  - [ ] Hover over title bar → Default arrow cursor
  - [ ] Hover over buttons → Pointer cursor
  - [ ] No grab/grabbing cursors anywhere
- [ ] **Test** keyboard navigation (FR-017):
  - [ ] Tab key cycles through buttons in order: Pinyin → Theme → Fullscreen → Close
  - [ ] Enter key activates focused button

**Acceptance**: All manual tests pass, app feels polished.

## Quick Reference

### File Changes Summary

| File | Change | Lines |
|------|--------|-------|
| `src/hooks/usePinyinVisibility.ts` | NEW | ~35 |
| `src/hooks/usePinyinVisibility.test.ts` | NEW | ~60 |
| `src/components/PinyinToggle.tsx` | NEW | ~25 |
| `src/components/PinyinToggle.test.tsx` | NEW | ~50 |
| `src/components/RubyWord.tsx` | MODIFIED | +5 |
| `src/components/RubyWord.test.tsx` | MODIFIED | +20 |
| `src/components/TextDisplay.tsx` | MODIFIED | +3 |
| `src/components/TextDisplay.test.tsx` | MODIFIED | +15 |
| `src/components/TitleBar.tsx` | MODIFIED | +3 |
| `src/components/ThemeToggle.tsx` | MODIFIED | +1 |
| `src/components/FullscreenToggle.tsx` | MODIFIED | +1 |
| `src/components/CloseButton.tsx` | MODIFIED | +1 |
| `src/index.css` | MODIFIED | -8 |
| `src/App.tsx` | MODIFIED | +5 |
| `src/App.test.tsx` | MODIFIED | +2 |
| `tests/integration/pinyin-toggle.test.tsx` | NEW | ~80 |
| `tests/contract/localStorage.test.ts` | NEW | ~70 |

**Total**: ~370 lines of code (including tests)

### Key Patterns to Follow

1. **Clone existing patterns**: `useTheme` → `usePinyinVisibility`, `ThemeToggle` → `PinyinToggle`
2. **Prop drilling**: App → TextDisplay → RubyWord (2 levels, acceptable)
3. **Error handling**: Try/catch around localStorage, silent failure with console.error
4. **Testing**: Unit tests for components/hooks, integration tests for end-to-end flows, contract tests for localStorage
5. **Accessibility**: Native `<button>` elements, ARIA labels, `aria-pressed`, Tab navigation
6. **Cursor**: `cursor-pointer` on buttons, no grab/grabbing anywhere

### Common Pitfalls

- ❌ Don't forget to call `e.stopPropagation()` on button `onPointerDown` events (prevents window dragging when clicking buttons)
- ❌ Don't use `localStorage.getItem()` on every render (use lazy initialization in `useState`)
- ❌ Don't forget to stringify booleans (`String(visible)`) when writing to localStorage
- ❌ Don't compare strings to booleans (`stored === true` won't work, use `stored === "true"`)
- ❌ Don't reduce button size below 32×32px (accessibility minimum per FR-012)
- ❌ Don't break existing theme toggle, fullscreen toggle, or close button

### Testing Strategy

1. **Unit tests first**: Write tests for hook and components before implementation (TDD)
2. **Integration tests second**: Verify cross-component behavior (toggle + persistence)
3. **Contract tests third**: Ensure localStorage API compliance
4. **Manual tests last**: Confirm visual polish and edge cases

## Next Steps

After completing implementation:

1. Run `npm run test` → All tests pass ✅
2. Run `npm run build` → Build succeeds ✅
3. Manual testing → All scenarios pass ✅
4. Create PR against `main` branch
5. Code review → Address feedback
6. Merge PR → Feature complete 🎉

## Support

- **Spec questions**: See [spec.md](./spec.md) for functional requirements
- **Technical questions**: See [research.md](./research.md) for implementation decisions
- **Data questions**: See [data-model.md](./data-model.md) for state flow
- **Contract questions**: See [contracts/localStorage.md](./contracts/localStorage.md) for localStorage API

Good luck! This is a well-scoped feature with clear patterns to follow. 🚀
