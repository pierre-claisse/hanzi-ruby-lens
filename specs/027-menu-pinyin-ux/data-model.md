# Data Model: Adaptive Menu Positioning & Numbered Pinyin Input

**Feature**: 027-menu-pinyin-ux
**Date**: 2026-02-24

## Overview

This feature introduces no new domain entities or database changes. It operates entirely within the frontend presentation layer, transforming existing data for display and input purposes.

## Value Objects (TypeScript only)

### PinyinFormat

An enumeration of the three possible representations of a pinyin string:

- `"diacritical"` — Contains Unicode tone marks (e.g., "zhōngguó"). This is the **storage and display format**.
- `"numbered"` — Contains trailing tone digits 1-4 per syllable (e.g., "zhong1guo2"). This is the **input/editing format**.
- `"plain"` — No tone information (e.g., "zhongguo"). Neutral tone syllables.

### Tone Mark Mapping

A bidirectional mapping between plain vowels with tone numbers and Unicode tone-marked vowels:

| Plain Vowel | Tone 1 | Tone 2 | Tone 3 | Tone 4 |
|-------------|--------|--------|--------|--------|
| a           | ā      | á      | ǎ      | à      |
| e           | ē      | é      | ě      | è      |
| i           | ī      | í      | ǐ      | ì      |
| o           | ō      | ó      | ǒ      | ò      |
| u           | ū      | ú      | ǔ      | ù      |
| ü (v)       | ǖ      | ǘ      | ǚ      | ǜ      |

### Tone Placement Rules

Standard pinyin rules for which vowel receives the tone mark:

1. If "a" or "e" is present → it receives the mark
2. If "ou" is present → "o" receives the mark
3. Otherwise → the last vowel receives the mark

### MenuDirection

An enumeration for menu positioning:

- `"below"` — Menu opens below the word (default for upper-half words)
- `"above"` — Menu opens above the word (for lower-half words)

## Existing Entities (unchanged)

### Word (no changes)

- `characters: string` — Chinese characters (immutable)
- `pinyin: string` — Diacritical pinyin (stored format, correctable)

The `pinyin` field continues to store diacritical format only. Numbered format exists only transiently in the UI input field.

## Data Flow

```
Storage (diacritical) → [diacriticalToNumbered] → Input field (numbered)
                                                         ↓ user edits
Input field (numbered) → [numberedToDiacritical] → Storage (diacritical)
```

No database schema changes required.
