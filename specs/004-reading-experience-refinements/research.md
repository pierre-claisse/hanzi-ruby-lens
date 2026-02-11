# Research & Design Decisions

**Feature**: 004-reading-experience-refinements
**Date**: 2026-02-11
**Status**: Complete

## Overview

This feature implements four CSS/styling refinements to the RubyWord component based on specific user feedback. All design decisions were predetermined by user requirements and constitutional principles. No exploratory research required.

## Design Decisions

### Decision 1: Hover Opacity Increase (P1 - Enhanced Hover Visibility)

**Decision**: Increase hover background opacity from 12% (`bg-vermillion/12`) to 24% (`bg-vermillion/24`)

**Rationale**:
- User feedback: "12% opacity is barely noticeable, especially in dark mode"
- Specific target: 24% opacity provides clear visual feedback without competing with content
- Constitutional alignment: Content-First Design principle - hover is an exceptional event, so increased contrast is justified

**Implementation**: Modify `hover:bg-vermillion/12` → `hover:bg-vermillion/24` in RubyWord className

**Alternatives Considered**:
- 20% opacity: Rejected - user specifically requested 24%
- 28% opacity: Rejected - excessive, would compete with content at rest

---

### Decision 2: Vertical Padding for Pinyin Coverage (P2 - Complete Pinyin Background Coverage)

**Decision**: Add top padding (`pt-6`) and bottom padding (`pb-1.5`) to ruby element

**Rationale**:
- Current issue: Hover background clips top of pinyin annotation
- Solution: `pt-6` (1.5rem ≈ 24px) extends background upward to fully cover pinyin
- Balance: `pb-1.5` (0.375rem ≈ 6px) provides proportional bottom spacing
- Line height context: TextDisplay uses `leading-[2.5]` (2.5x line height), sufficient vertical space exists

**Implementation**: Add `pt-6 pb-1.5` to RubyWord className

**Alternatives Considered**:
- `pt-8`: Rejected - excessive, creates too much gap above pinyin
- Symmetric padding (`py-6`): Rejected - pinyin is above base text, asymmetry is correct
- Container-based solution: Rejected - adds unnecessary complexity, violates YAGNI

---

### Decision 3: Remove Horizontal Padding (P3 - Remove Artificial Word Spacing)

**Decision**: Remove `px-0.5` from ruby element

**Rationale**:
- Chinese typography: No spaces between words (constitutional principle)
- Current issue: `px-0.5` creates false visual segmentation like English
- User feedback: "grave mistake on my part" (user explicitly reversed earlier request)
- Constitutional alignment: "Chinese characters are the star" - authentic typography required

**Implementation**: Delete `px-0.5` from RubyWord className

**Alternatives Considered**:
- Reduce to `px-0` (explicit): Rejected - unnecessary, absence is sufficient
- Keep but reduce: Rejected - ANY spacing violates authentic Chinese typography

---

### Decision 4: Disable Text Selection (P4 - Disable Text Selection)

**Decision**: Add `select-none` and `cursor-default` to TextDisplay container, covering all text content (Words and punctuation)

**Rationale**:
- Interaction model: Passive reading (no text selection supported)
- User clarification: "Remove the web feel" - prevent selection of ALL text, not just Words
- Scope: Prevent mouse, keyboard (within reading area), AND touch selection
- Cursor: Remain default (not pointer or I-beam) - no active interaction affordance
- Architecture: Container-level solution is cleaner than per-element approach

**Implementation**: Add `select-none cursor-default` to TextDisplay container div

**Alternatives Considered**:
- Per-element approach (RubyWord + punctuation spans): Rejected - more verbose, misses edge cases
- JavaScript-based prevention: Rejected - CSS `user-select: none` is simpler and sufficient
- Pointer cursor: Rejected - would imply clickable interaction, contradicts passive reading
- App-level global CSS: Rejected - too broad, could interfere with future input elements

---

## Tailwind Configuration

### Decision: Opacity Utility

**Requirement**: Ensure `opacity-24` (24%) utility exists in Tailwind config

**Current State**: Check `tailwind.config.ts` for `opacity: { "24": "0.24" }`

**Action**: Add if missing (low probability - standard utility range)

---

## Testing Strategy

### Visual Rendering Tests

**Approach**: Use @testing-library/react to validate className presence

**Coverage**:
1. Hover opacity: `toMatch(/hover:bg-vermillion\/24/)`
2. Vertical padding: `toMatch(/pt-6/)` and `toMatch(/pb-1\.5/)`
3. No horizontal padding: `not.toMatch(/px-/)` (verify removal)
4. Text selection: `toMatch(/select-none/)`

**Browser Compatibility**: Modern browsers only (Chrome/Edge/Firefox/Safari latest 2)

### Interaction Tests

**Approach**: Simulate user interactions in test environment

**Coverage**:
1. Hover state activation (existing tests, verify new opacity)
2. Text selection prevention (verify `user-select: none` applied)
3. Cursor state (verify no pointer cursor)

### Theme Compatibility

**Requirement**: All changes must work in both light and dark themes

**Validation**: Run existing theme toggle tests, verify visual consistency

---

## Implementation Constraints

### Files to Modify

1. **src/components/RubyWord.tsx** (PRIMARY)
   - Current className: `"font-hanzi rounded px-0.5 transition-colors duration-200 ease-in-out hover:bg-vermillion/12 focus-visible:ring-2 focus-visible:ring-vermillion"`
   - New className: `"font-hanzi rounded pt-6 pb-1.5 transition-colors duration-200 ease-in-out hover:bg-vermillion/24 focus-visible:ring-2 focus-visible:ring-vermillion"`
   - Changes:
     - Remove: `px-0.5`
     - Add: `pt-6 pb-1.5`
     - Modify: `hover:bg-vermillion/12` → `hover:bg-vermillion/24`

2. **src/components/TextDisplay.tsx** (PRIMARY)
   - Add `select-none cursor-default` to container div className
   - Current: `className="font-hanzi text-2xl leading-[2.5]"`
   - New: `className="font-hanzi text-2xl leading-[2.5] select-none cursor-default"`
   - Rationale: Container-level selection prevention covers all text (Words + punctuation)

3. **src/components/RubyWord.test.tsx** (TESTS)
   - Update test expectations for new className patterns
   - Verify vertical padding presence
   - Verify horizontal padding absence

4. **src/components/TextDisplay.test.tsx** (TESTS)
   - Add tests for selection prevention (select-none class presence)
   - Add tests for cursor state (cursor-default class presence)

5. **tailwind.config.ts** (CONDITIONAL)
   - Add `opacity: { "24": "0.24" }` if not present
   - Likely already exists in standard Tailwind setup

### No Changes Required

- **src/types/domain.ts**: Word type unchanged
- **src/index.css**: No custom CSS needed (Tailwind utilities sufficient)
- **Backend (Rust/Tauri)**: No changes (pure frontend refinement)

---

## Risk Assessment

**Technical Risks**: None identified
- Changes are isolated CSS utilities
- No breaking changes to component API
- Existing tests provide regression coverage

**User Experience Risks**: Minimal
- All changes improve UX per explicit user feedback
- No feature removal, only refinement
- Reversible via future feature if needed

**Constitutional Compliance**: ✅ Full compliance
- Content-First Design: Enhanced
- No domain logic changes
- Test-First maintained
- Docker execution unchanged

---

## Conclusion

All design decisions are concrete, user-validated, and constitutionally compliant. No unknowns or research gaps. Ready for Phase 1 (Data Model documentation) and Phase 2 (Task generation).
