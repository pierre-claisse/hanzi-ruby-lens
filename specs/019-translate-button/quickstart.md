# Quickstart: Google Translate Button

**Feature Branch**: `019-translate-button`

## Key Files

| File | Action | Purpose |
|------|--------|---------|
| `src/components/TranslateButton.tsx` | NEW | Button component with Languages icon |
| `src/components/TitleBar.tsx` | MODIFY | Add TranslateButton between edit and PinyinToggle, add `rawInput` prop |
| `src/App.tsx` | MODIFY | Pass `rawInput={text?.rawInput ?? ""}` to TitleBar |
| `tests/unit/TranslateButton.test.tsx` | NEW | Component tests |

## Implementation Reference

### TranslateButton pattern (copy from ZoomInButton)

```tsx
// Same structure as ZoomInButton.tsx:
// - Icon: Languages (not ZoomIn)
// - disabled: rawInput === ""
// - onClick: build URL + openUrl()
// - Same CSS classes with disabled:opacity-50 disabled:cursor-not-allowed
```

### URL construction

```tsx
const MAX_ENCODED_LENGTH = 5000;
const baseUrl = "https://translate.google.com/?sl=zh-TW&tl=en&text=";

let textToEncode = rawInput;
let encoded = encodeURIComponent(textToEncode);
while (encoded.length > MAX_ENCODED_LENGTH && textToEncode.length > 0) {
  textToEncode = textToEncode.slice(0, -1);
  encoded = encodeURIComponent(textToEncode);
}

openUrl(baseUrl + encoded);
```

### TitleBar insertion point

```tsx
// In TitleBar.tsx, between edit button and PinyinToggle:
{showEdit && onEdit && ( <button>...</button> )}
<TranslateButton rawInput={rawInput ?? ""} />  {/* ← NEW */}
<PinyinToggle ... />
```

## Manual Testing

1. **Empty state**: Launch app with no text → translate button visible but grayed out, not clickable
2. **With text**: Enter Chinese text → button becomes active → click → browser opens Google Translate with text
3. **Long text**: Paste 2000+ Chinese characters → click → Google Translate opens (text may be truncated)
4. **Input view**: Go to edit view → button still visible and active if text exists

## Gotchas

- `openUrl` is async (returns Promise) — fire-and-forget, no need to await
- `encodeURIComponent` handles Chinese characters correctly (3-byte UTF-8 → %XX%XX%XX)
- The edit button uses `showEdit && onEdit &&` conditional rendering — the translate button does NOT use this pattern (it's always rendered)
