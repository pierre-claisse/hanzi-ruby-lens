# Quickstart: Context Menu Actions

**Feature**: 012-context-menu-actions

## Integration Scenarios

### Scenario 1: Dictionary Lookup via Keyboard

1. User tabs into the text area (first word highlighted)
2. User presses Right arrow to navigate to desired word
3. User presses Enter to open contextual menu
4. Menu shows "Look up" (focused) and "Copy"
5. User presses Enter on "Look up"
6. Application constructs URL: `https://dict.revised.moe.edu.tw/search.jsp?md=1&word={encoded_characters}&qMd=0&qCol=1&sound=1#radio_sound_1`
7. Default browser opens with the dictionary page
8. Menu closes, text area retains focus, word remains highlighted

### Scenario 2: Copy via Mouse

1. User hovers mouse over a Chinese word (word highlights)
2. User right-clicks the word (contextual menu opens)
3. User clicks "Copy" entry
4. Word's Chinese characters are written to system clipboard
5. Menu closes, word remains highlighted
6. User pastes in any application — only Chinese characters appear (no pinyin)

### Scenario 3: Dictionary Lookup via Mouse Click

1. User right-clicks a word to open contextual menu
2. User clicks "Look up"
3. Default browser opens with the dictionary URL
4. Menu closes

### Scenario 4: Keyboard Menu Navigation with Action

1. User opens contextual menu (Enter on focused word)
2. "Look up" is focused by default (first entry)
3. User presses Down arrow → "Copy" becomes focused
4. User presses Enter → clipboard receives the word's characters
5. Menu closes

### Scenario 5: Action After Arrow-Key Menu Close

1. User opens contextual menu
2. User presses Left arrow → menu closes, previous word is now highlighted
3. User presses Enter → menu opens on the new word
4. User presses Enter → "Look up" executes for the new word

## Key Implementation Details

### Word Data Flow

The `Word` entity already has `characters: string` and `pinyin: string`. The menu actions only use `characters`:
- "Look up": `encodeURIComponent(word.characters)` inserted into URL template
- "Copy": `word.characters` passed directly to clipboard write

### Plugin Setup

Two Tauri 2 plugins are required (first plugins added to this project):

**@tauri-apps/plugin-opener**:
- npm: `@tauri-apps/plugin-opener`
- Rust: `tauri-plugin-opener = "2"` in Cargo.toml
- Init: `.plugin(tauri_plugin_opener::init())` in lib.rs
- Permission: `opener:allow-open-url` with https scope

**@tauri-apps/plugin-clipboard-manager**:
- npm: `@tauri-apps/plugin-clipboard-manager`
- Rust: `tauri-plugin-clipboard-manager = "2"` in Cargo.toml
- Init: `.plugin(tauri_plugin_clipboard_manager::init())` in lib.rs
- Permission: `clipboard-manager:allow-write-text`

### Testing Approach

Tauri plugin APIs (`openUrl`, `writeText`) cannot run in happy-dom/vitest. Strategy:
- Mock `@tauri-apps/plugin-opener` and `@tauri-apps/plugin-clipboard-manager` at module level
- Test that actions are called with correct arguments (URL string, character string)
- Test URL construction as a pure function
- Test menu close behavior after action dispatch
- Existing keyboard navigation tests remain unchanged
