# Implementation Plan: Reading Experience Refinements

**Branch**: `004-reading-experience-refinements` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-reading-experience-refinements/spec.md`

## Summary

Refine the reading experience through four visual and interaction improvements: (1) increase hover background opacity from 12% to 24% for clearer visual feedback on Word elements, (2) add vertical padding to ensure hover background fully covers pinyin annotations, (3) remove horizontal padding to eliminate false word spacing in Chinese typography, and (4) disable text selection via mouse, keyboard, and touch for all reading content to support passive reading interaction model.

All changes are CSS/styling refinements to the RubyWord and TextDisplay components. No domain logic, data model, or API changes required.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Rust stable (Tauri backend - no changes)
**Primary Dependencies**: React 18, Tailwind CSS 3.x, @testing-library/react, vitest
**Storage**: N/A (no data persistence changes)
**Testing**: vitest + @testing-library/react (Docker-based execution)
**Target Platform**: Windows desktop via Tauri 2 WebView2
**Project Type**: Single (Tauri desktop application)
**Performance Goals**: Instant hover response (<16ms for 60fps), smooth CSS transitions (existing 200ms)
**Constraints**: Modern browsers only (Chrome/Edge/Firefox/Safari latest 2 versions), both light and dark theme support
**Scale/Scope**: Single-user desktop app, visual refinements to 1 component (RubyWord), 4 user stories (P1-P4)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Content-First Design ✅
- **Compliance**: All refinements directly support content focus
  - Hover visibility improvement (24% opacity) makes Word interaction clearer without competing with text
  - Pinyin coverage ensures visual polish maintains focus on annotations
  - Remove word spacing honors authentic Chinese typography (characters are the star)
  - Disable text selection reinforces passive reading interaction
- **State changes**: Existing 200ms CSS transitions maintained (FR-009)
- **Light/dark modes**: All changes apply consistently (FR-008)

### II. Offline-First Data ✅
- **Compliance**: No network dependency
- Pure UI/CSS changes, no data storage modifications

### III. Domain-Driven Design with CQRS ✅
- **Compliance**: No domain logic changes
- Presentation layer only (RubyWord component styling)
- Uses constitutional "Word" entity (no new domain entities)

### IV. Principled Simplicity ✅
- **Compliance**: Minimal, focused changes
- No speculative features (all 4 refinements address concrete user feedback)
- No new abstractions (direct CSS class modifications)
- Changes: opacity value, padding adjustments, remove padding, add user-select CSS

### V. Test-First Imperative ✅
- **Compliance**: Tests required for all visual changes
- Existing test infrastructure (vitest + @testing-library/react in Docker)
- Test coverage: visual rendering (opacity, padding, spacing), interaction (selection prevention)
- Modern browser compatibility validation (Chrome/Edge/Firefox/Safari)

### VI. Docker-Only Execution ✅
- **Compliance**: No changes to execution model
- Tests run in existing Docker container setup
- Build process unchanged

### Domain Language ✅
- **Word**: Used correctly per constitution definition
  - "A Word MUST contain one or more Chinese characters and exactly one pinyin string"
  - Changes refine Word visual presentation, no domain logic modifications
- **Text**: Referenced correctly (parent aggregate, no changes)

**GATE STATUS**: ✅ **PASS** - No constitution violations

## Project Structure

### Documentation (this feature)

```text
specs/004-reading-experience-refinements/
├── plan.md              # This file
├── research.md          # Phase 0 output (design decisions)
├── data-model.md        # Phase 1 output (existing Word entity usage)
├── quickstart.md        # Phase 1 output (testing guide)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── RubyWord.tsx        # PRIMARY: Modify className (opacity, padding)
│   ├── TextDisplay.tsx     # PRIMARY: Add select-none and cursor-default to container
│   ├── RubyWord.test.tsx   # Update tests for new styling
│   └── TextDisplay.test.tsx # Add tests for selection prevention
├── types/
│   └── domain.ts           # Reference only (Word type definition)
└── index.css               # Reference only (Tailwind base styles)

tailwind.config.ts          # SECONDARY: Add opacity-24 utility if not present

tests/                      # Docker-based test execution
└── (existing vitest setup)
```

**Structure Decision**: Single project structure. This is a presentation-layer refinement to two React components (RubyWord and TextDisplay). No backend, API, or mobile components involved. Changes are isolated to:
1. **Primary**: `src/components/RubyWord.tsx` - className modifications (opacity, padding)
2. **Primary**: `src/components/TextDisplay.tsx` - add selection prevention and cursor style
3. **Secondary**: `tailwind.config.ts` - ensure opacity-24 utility exists
4. **Tests**: `src/components/RubyWord.test.tsx` and `TextDisplay.test.tsx` - update/add tests

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected. Table omitted.*
