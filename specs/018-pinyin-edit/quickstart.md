# Quickstart: Pinyin Edit

**Feature**: 018-pinyin-edit
**Date**: 2026-02-18

## Test Scenarios

### Scenario 1: Basic Edit Flow (Happy Path)

1. Open the app with a previously processed text
2. Right-click on any Word (e.g., 你好 with pinyin "nǐhǎo")
3. Context menu shows 4 entries: MOE Dictionary, Google Translate, Copy, Edit Pinyin
4. Click "Edit Pinyin"
5. An inline input appears in the annotation position, pre-filled with "nǐhǎo"
6. Clear the input, type "nihao"
7. Press Enter
8. The annotation updates to "nihao"
9. Close and reopen the app
10. The annotation still shows "nihao"

### Scenario 2: Cancel via Escape

1. Right-click on a Word, select "Edit Pinyin"
2. Modify the pinyin text
3. Press Escape
4. The original pinyin is restored (no save occurred)

### Scenario 3: Cancel via Click-Outside

1. Right-click on a Word, select "Edit Pinyin"
2. Modify the pinyin text
3. Click anywhere outside the input
4. The original pinyin is restored (no save occurred)

### Scenario 4: Reject Empty Input

1. Right-click on a Word, select "Edit Pinyin"
2. Clear all text from the input
3. Press Enter
4. The edit is rejected — original pinyin remains

### Scenario 5: Keyboard-Only Flow

1. Focus the text display (Tab into it)
2. Use Left/Right arrows to navigate to a Word
3. Press Enter to open the context menu
4. Use Down arrow to reach "Edit Pinyin" (4th entry)
5. Press Enter to activate
6. Type the new pinyin
7. Press Enter to confirm
8. Focus returns to the Word in the reading view

### Scenario 6: Edit When Pinyin is Hidden

1. Toggle pinyin visibility off (so annotations are hidden)
2. Right-click on a Word, select "Edit Pinyin"
3. Pinyin visibility turns on globally
4. The inline input appears with the current pinyin pre-filled
5. Complete the edit as normal

### Scenario 7: Re-Edit a Previously Corrected Word

1. Edit a Word's pinyin and confirm
2. Right-click the same Word again, select "Edit Pinyin"
3. The input is pre-filled with the corrected value (not the original LLM value)
