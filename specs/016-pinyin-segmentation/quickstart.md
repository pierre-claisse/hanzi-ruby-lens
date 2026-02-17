# Quickstart Scenarios: Pinyin Segmentation

## Scenario 1: First-Time Text Processing (Happy Path)

**Precondition**: Empty database. Claude CLI installed and in PATH.

1. Launch app → Empty state ("Paste Chinese text to read with pinyin annotations")
2. Click "Enter Text" → Input view with empty textarea
3. Paste "今天天氣很好，我想出去散步。" → Text appears in textarea
4. Click "Submit" → Processing state: spinner + "Processing text..."
5. Wait 10-30 seconds → Processing completes
6. Reading view appears with ruby annotations:
   - 今天 (jīntiān), 天氣 (tiānqì), 很好 (hěnhǎo), ，, 我 (wǒ), 想 (xiǎng), 出去 (chūqù), 散步 (sànbù), 。
7. Title bar shows edit button (pencil icon)

## Scenario 2: Processing Failure and Retry

**Precondition**: Text saved in database. Claude CLI unavailable (no internet or not installed).

1. Submit text → Processing state: spinner
2. After timeout (up to 120s) → Error message displayed
3. Error: "Processing failed. Please try again."
4. Retry button visible → Click retry
5. If CLI now available → Processing succeeds → Reading view
6. If still unavailable → Same error message again
7. Edit button visible → Can return to input view to modify text

## Scenario 3: Edit and Re-Process

**Precondition**: Text already processed and displayed in reading view.

1. Reading view shows "今天天氣很好" with pinyin annotations
2. Click pencil icon in title bar → Input view, textarea pre-filled with "今天天氣很好，我想出去散步。"
3. Clear textarea, paste new text: "我喜歡學中文"
4. Click "Submit" → Processing state: spinner
5. Wait for processing → Reading view with new annotations:
   - 我 (wǒ), 喜歡 (xǐhuān), 學 (xué), 中文 (zhōngwén)
6. Old annotations completely replaced

## Scenario 4: Empty Text Submission

**Precondition**: Any state.

1. Enter input view → Clear textarea (or leave empty)
2. Click "Submit" → No processing triggered (empty text)
3. Transitions to empty state (no text to process)

## Scenario 5: App Restart with Unprocessed Text

**Precondition**: Text was saved (rawInput exists) but processing was interrupted (segments empty).

1. Launch app → Processing state shown (not reading, not empty)
2. "Process" or "Retry" button visible (not auto-started)
3. Click "Process" → Spinner + processing begins
4. Success → Reading view with annotations
5. Alternatively: Click "Edit" → Input view with pre-filled text

## Scenario 6: Mixed Content Processing

**Precondition**: Empty database.

1. Submit: "Hello世界！2025年是很好的一年。Good luck!"
2. Processing → Reading view:
   - "Hello" as plain text (no pinyin)
   - 世界 (shìjiè) as word
   - ！as plain
   - 2025 as plain
   - 年 (nián) as word
   - 是 (shì) as word
   - 很好 (hěnhǎo) as word
   - 的 (de) as word
   - 一年 (yīnián) as word
   - 。as plain
   - "Good luck!" as plain

## Scenario 7: Traditional Characters

**Precondition**: Empty database.

1. Submit: "現在覺得很累，想要睡覺。"
2. Processing → Reading view:
   - 現在 (xiànzài), 覺得 (juédé), 很 (hěn), 累 (lèi), ，, 想要 (xiǎngyào), 睡覺 (shuìjiào), 。
3. Note context-dependent pinyin: 覺 = "jué" in 覺得 but "jiào" in 睡覺
