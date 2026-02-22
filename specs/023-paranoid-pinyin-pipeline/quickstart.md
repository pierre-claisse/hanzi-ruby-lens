# Quickstart: Paranoid Pinyin Pipeline

**Feature**: 023-paranoid-pinyin-pipeline

## Test Scenarios

### Scenario 1: Syllable-Count Validation

**Input**: "覺得睡覺"

**Expected**:
- Word "覺得" → pinyin "juéde" (2 syllables, 2 characters)
- Word "睡覺" → pinyin "shuìjiào" (2 syllables, 2 characters)

**Validates**: FR-001 (syllable count), FR-002 (cross-validation), SC-001

### Scenario 2: Polyphonic Disambiguation

**Input**: "覺得睡覺"

**Expected**:
- 覺 in 覺得 → "jué" (not "jiào")
- 覺 in 睡覺 → "jiào" (not "jué")

**Validates**: FR-002, FR-003, SC-002

### Scenario 3: Dual Segmentation

**Input**: "今天天氣很好"

**Expected**:
- Words: "今天", "天氣", "很", "好"
- NOT: "今", "天天", "氣", "很", "好"

**Validates**: FR-005, US2

### Scenario 4: Rare Character Fallback

**Input**: "龘"

**Expected**:
- Word "龘" → pinyin is non-empty (e.g., "dá")

**Validates**: FR-004, FR-009, SC-005

### Scenario 5: Mixed Content Preservation

**Input**: "Hello世界！2025年"

**Expected**:
- Plain "Hello" + Word "世界" + Plain "！" + Plain "2025" + Word "年"
- Concatenation equals original input

**Validates**: FR-007, SC-006

### Scenario 6: Performance at Scale

**Input**: "今天天氣很好我們一起去公園散步吧" repeated 32 times (~512 chars)

**Expected**:
- Completes in under 5 seconds
- All characters preserved

**Validates**: SC-003

### Scenario 7: Large Text Performance

**Input**: Same base repeated 313 times (~5000 chars)

**Expected**:
- Completes in under 30 seconds
- All characters preserved

**Validates**: SC-004

## Running Tests

```sh
npm test    # Full suite: Rust + frontend in Docker
```

All existing tests must continue to pass. New tests validate the paranoid pipeline specifically.
