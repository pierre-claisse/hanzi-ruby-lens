# Contract: Pinyin Conversion Utilities

**Feature**: 027-menu-pinyin-ux
**Layer**: Frontend (TypeScript)
**Location**: `src/utils/pinyinConversion.ts`

## No New IPC Commands

This feature adds no new Tauri IPC commands. The existing `update_pinyin` command continues to accept diacritical pinyin. All conversion happens client-side before calling the backend.

## Exported Functions

### `diacriticalToNumbered(pinyin: string): string`

Converts diacritical pinyin to numbered format for display in the edit input.

| Input             | Output           | Notes                     |
|-------------------|------------------|---------------------------|
| `"xǐhuān"`       | `"xi3huan1"`     | Standard conversion       |
| `"rén"`           | `"ren2"`         | Single syllable           |
| `"nǚ"`            | `"nv3"`          | ü → v in output           |
| `"de"`            | `"de"`           | Neutral tone, no digit    |
| `"zhōngguó"`      | `"zhong1guo2"`   | Multi-syllable            |
| `""`              | `""`             | Empty passthrough         |

### `numberedToDiacritical(pinyin: string): string`

Converts numbered pinyin to diacritical format for storage/display.

| Input             | Output           | Notes                           |
|-------------------|------------------|---------------------------------|
| `"xi3huan1"`      | `"xǐhuān"`      | Standard conversion             |
| `"ren2"`          | `"rén"`          | Single syllable                 |
| `"nv3"`           | `"nǚ"`           | v → ü with tone                 |
| `"de"`            | `"de"`           | No digit = neutral tone         |
| `"de5"`           | `"de"`           | Explicit tone 5 = neutral       |
| `"zhong1guo2"`    | `"zhōngguó"`     | Multi-syllable, digit-split     |
| `"hao3"`          | `"hǎo"`          | Tone on 'a' (rule 1)            |
| `"mei2"`          | `"méi"`          | Tone on 'e' (rule 1)            |
| `"gou3"`          | `"gǒu"`          | Tone on 'o' in 'ou' (rule 2)   |
| `"gui4"`          | `"guì"`          | Tone on last vowel (rule 3)     |
| `"xǐhuān"`       | `"xǐhuān"`       | Already diacritical, passthrough|
| `""`              | `""`             | Empty passthrough               |

### `hasToneMarks(pinyin: string): boolean`

Returns `true` if the string contains any Unicode tone-marked vowels.

### Tone Placement Rules (FR-008)

1. If syllable contains "a" or "e" → tone mark goes on that vowel
2. If syllable contains "ou" → tone mark goes on "o"
3. Otherwise → tone mark goes on the last vowel
