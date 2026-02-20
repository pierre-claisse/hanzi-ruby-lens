# Data Model: Google Translate Button

**Feature Branch**: `019-translate-button`
**Date**: 2026-02-20

## Domain Impact

**No domain model changes.** This feature reads the existing `Text.rawInput` property (query only) and opens an external URL. No new entities, no schema changes, no persistence changes.

## Existing Types Referenced

### Text (unchanged)

```typescript
// src/types/domain.ts — NO CHANGES
export interface Text {
  rawInput: string;      // ← used by translate button
  segments: TextSegment[];
}
```

## New Component Interface

### TranslateButton Props

```typescript
interface TranslateButtonProps {
  rawInput: string;  // Text.rawInput — drives enabled state and URL text parameter
}
```

- `rawInput === ""` → button disabled (grayed out)
- `rawInput !== ""` → button enabled, click opens Google Translate URL

### TitleBar Props Addition

```typescript
interface TitleBarProps {
  // ... existing props unchanged ...
  rawInput?: string;  // NEW — defaults to ""
}
```

## Google Translate URL Format

```
https://translate.google.com/?sl=zh-TW&tl=en&text={encodeURIComponent(rawInput)}
```

- `sl=zh-TW`: Source language — Traditional Chinese
- `tl=en`: Target language — English
- `text`: URL-encoded raw text, capped at 5,000 encoded characters
