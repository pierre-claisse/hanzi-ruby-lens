# Developer Quickstart

**Feature**: 004-reading-experience-refinements
**Branch**: `004-reading-experience-refinements`
**Date**: 2026-02-11

## Overview

This guide covers testing and validation for the Reading Experience Refinements feature. All changes are CSS/styling modifications to the RubyWord component.

---

## Prerequisites

1. **Docker Desktop** running (required for test execution)
2. **Node.js and NPM** installed on host (orchestration only)
3. **Branch**: Ensure you're on `004-reading-experience-refinements`

```bash
git status  # Verify branch
```

---

## Running Tests

### Full Test Suite (Recommended)

```bash
npm run test
```

**What it does**:
- Spins up Docker container with full toolchain
- Runs vitest test suite
- Executes all component tests including RubyWord.test.tsx
- Validates CSS class presence and interaction behavior

**Expected output**:
```
✓ src/components/RubyWord.test.tsx (N tests)
  ✓ renders a <ruby> element with characters and <rt> pinyin
  ✓ has hover transition classes on the ruby element
  ✓ applies vertical padding for pinyin coverage
  ✓ does not apply horizontal padding
  ✓ applies hover styles with increased opacity (24%)
  ✓ includes text selection prevention
  ... (more tests)

Test Files  X passed (X)
Tests  N passed (N)
```

### Watch Mode (Development)

```bash
npm run test -- --watch
```

**Use case**: Iterative development with automatic re-runs on file changes

---

## Manual Visual Validation

### Local Build

```bash
npm run build
```

**What it does**:
- Builds production Tauri app in Docker
- Outputs `.exe` to `output/` directory
- Copies installer to host for manual testing

### Test Scenarios

After building, launch the app and validate:

#### 1. Hover Visibility (P1)

**Steps**:
1. Open app in light mode
2. Hover over any Word (Chinese characters with pinyin)
3. **Expected**: Background highlight clearly visible at 24% opacity vermillion
4. Toggle to dark mode (theme button in top-right)
5. Hover over Words again
6. **Expected**: Background highlight clearly visible in dark mode

**Pass Criteria**: Hover background noticeably more visible than before (was 12%, now 24%)

#### 2. Pinyin Coverage (P2)

**Steps**:
1. Hover over a Word with pinyin annotation
2. Inspect top edge of hover background
3. **Expected**: Background extends fully above pinyin text, no clipping
4. Test with long pinyin (e.g., "chéngfēngpòlàng" for 乘風破浪)
5. **Expected**: Full coverage even for long annotations

**Pass Criteria**: Pinyin fully contained within hover background rectangle

#### 3. Word Spacing (P3)

**Steps**:
1. View text with multiple consecutive Words
2. Inspect gaps between Words
3. **Expected**: No visible horizontal spacing between Words
4. Compare to traditional Chinese text
5. **Expected**: Continuous character flow, no English-style word separators

**Pass Criteria**: Characters flow continuously without artificial gaps

#### 4. Text Selection (P4)

**Steps**:
1. Try to select Chinese characters by click-and-drag
2. **Expected**: No text highlights, selection prevented
3. Try to select pinyin annotations by click-and-drag
4. **Expected**: No text highlights, selection prevented
5. Try to select punctuation or spacing by click-and-drag
6. **Expected**: No text highlights, selection prevented
7. Try Ctrl+A (select all) within the reading area
8. **Expected**: No text within the reading area selects (NOTE: full keyboard shortcut prevention is a future feature)
9. Observe cursor when hovering over any text content
10. **Expected**: Cursor remains default arrow (not I-beam)

**Touch Testing** (if available):
1. Use touch screen
2. Tap-and-hold on Chinese characters, pinyin, or punctuation
3. **Expected**: No selection handles appear for any text content

**Pass Criteria**: All text content in reading area is non-selectable, cursor stays default throughout

---

## Browser Compatibility Testing

**Requirement**: Validate on modern browsers (Chrome/Edge/Firefox/Safari latest 2 versions)

### Windows Testing (Primary)

1. **Edge** (Chromium-based, same as WebView2)
   - Open app in Edge DevTools
   - Verify all 4 scenarios above

2. **Chrome**
   - Open developer build in Chrome
   - Verify all 4 scenarios

3. **Firefox**
   - Open developer build in Firefox
   - Verify all 4 scenarios

### Cross-Platform (Optional)

If testing on macOS/Linux (WebKit/Chromium):
- Safari (macOS): Test in Safari browser
- Chromium (Linux): Test in Chromium/Chrome

**Note**: Tauri uses platform-specific WebView, so primary validation is on Windows WebView2 (Chromium-based)

---

## Debugging

### CSS Class Inspection

**Tools**: Browser DevTools → Elements tab

**Validate TextDisplay container**:
```html
<div class="font-hanzi text-2xl leading-[2.5] select-none cursor-default">
  <!-- content here -->
</div>
```

**Check TextDisplay for**:
- ✅ `select-none` (user-select: none on container)
- ✅ `cursor-default` (default cursor throughout)

**Validate RubyWord className**:
```html
<ruby class="font-hanzi rounded pt-6 pb-1.5 transition-colors duration-200 ease-in-out hover:bg-vermillion/24 focus-visible:ring-2 focus-visible:ring-vermillion">
  你好
  <rp>(</rp>
  <rt class="text-vermillion">nǐhǎo</rt>
  <rp>)</rp>
</ruby>
```

**Check RubyWord for**:
- ✅ `pt-6` (top padding)
- ✅ `pb-1.5` (bottom padding)
- ✅ `hover:bg-vermillion/24` (24% opacity)
- ❌ `px-0.5` (should be removed)
- ❌ `select-none` (removed from RubyWord, now on TextDisplay container)

### Computed Styles

**Steps**:
1. Open DevTools → Elements tab
2. Select `<ruby>` element
3. View Computed tab
4. **Verify**:
   - `user-select: none` (from `select-none`)
   - `padding-top: 1.5rem` (from `pt-6` at 1rem = 16px base)
   - `padding-bottom: 0.375rem` (from `pb-1.5`)
   - `padding-left: 0px` (no `px-*` class)
   - `padding-right: 0px` (no `px-*` class)

**Container-Level Styles (TextDisplay)**:
1. Select the TextDisplay container div
2. View Computed tab
3. **Verify**:
   - `user-select: none` (from `select-none`)
   - `cursor: default` (from `cursor-default`)

**On Hover (RubyWord)**:
1. Select a `<ruby>` element and trigger hover state (DevTools → Force State → :hover)
2. **Verify**: `background-color: rgba(...)` with ~24% opacity

---

## Common Issues

### Issue 1: Opacity doesn't show as 24%

**Cause**: Tailwind opacity-24 utility may not be defined

**Solution**:
1. Check `tailwind.config.ts` for `opacity: { "24": "0.24" }`
2. If missing, add to config and rebuild

### Issue 2: Pinyin still clipped on hover

**Cause**: Line height insufficient or padding not applied

**Solution**:
1. Verify `pt-6` class is present in className
2. Check TextDisplay has `leading-[2.5]` (should be unchanged)
3. Inspect computed padding-top value (should be 1.5rem)

### Issue 3: Text selection still works

**Cause**: `select-none` class not applied to TextDisplay container

**Solution**:
1. Verify `select-none cursor-default` in TextDisplay container className
2. Check computed `user-select` property on container (should be `none`)
3. Ensure no child component overrides with `user-select: text`

### Issue 4: Horizontal gaps still visible

**Cause**: `px-0.5` not removed or other spacing classes present

**Solution**:
1. Search className for `px-` (should not exist)
2. Check computed padding-left/right (should be 0px)
3. Verify no margin classes (`mx-`, `ml-`, `mr-`)

---

## Test Coverage Checklist

Before marking feature complete, ensure:

- [ ] All vitest tests pass (`npm run test`)
- [ ] Manual visual validation complete (all 4 scenarios)
- [ ] Light mode tested
- [ ] Dark mode tested
- [ ] Edge/Chrome browser validated
- [ ] Production build successful (`npm run build`)
- [ ] No console errors in browser DevTools
- [ ] No TypeScript compilation errors
- [ ] No Tailwind class warnings

---

## Next Steps

After validation complete:
1. Update task status in `tasks.md` (mark tests passed)
2. Run `/speckit.analyze` to verify constitution compliance
3. Create git commit for implementation
4. Proceed to merge workflow (if all tasks complete)

---

## References

- Feature Spec: [spec.md](./spec.md)
- Implementation Plan: [plan.md](./plan.md)
- Research Decisions: [research.md](./research.md)
- Data Model: [data-model.md](./data-model.md)
