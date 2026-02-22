# Research: Native Pinyin Processing

**Feature Branch**: `023-native-pinyin-processing`
**Date**: 2026-02-22

## R1: Chinese Word Segmentation Library

### Decision

Use **`jieba-rs`** (v0.8.1) for Chinese word segmentation, supplemented with a traditional Chinese dictionary.

### Rationale

- Most mature Rust Chinese segmentation crate: 898 GitHub stars, ~132K monthly downloads, actively maintained (last release Sep 2025).
- Uses HMM + Viterbi algorithm for accurate word boundary detection, including unknown word recognition — far superior to naive longest-match approaches.
- Bundled dictionary via `default-dict` feature compiles into the binary — fully offline.
- Performance: segmenting a full novel (~250K characters) 50 times completes in ~4.1 seconds. 10K characters segments in sub-millisecond time.
- Clean API: `Jieba::new()` then `jieba.cut(text, hmm)` returns `Vec<&str>` (zero-copy).
- Custom dictionary support via `load_dict()` and `add_word()` allows supplementing for traditional Chinese vocabulary.
- Mixed content (Latin, numbers, punctuation) passes through naturally as separate tokens.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **opencc-jieba-rs** (v0.7.2) | Combines jieba-rs with a Hans+Hant dictionary out of the box — attractive for traditional Chinese. Rejected because: single maintainer, 0 GitHub stars, returns owned `Vec<String>` not borrowed, and larger binary. The traditional support gap in jieba-rs can be addressed with a supplementary dictionary. |
| **charabia** (v0.9.9) | MeiliSearch's multi-language tokenizer, uses jieba-rs internally. Rejected because: heavyweight dependency (~310K LoC), designed for search tokenization not NLP, overkill for single-language use. |
| **chinese_segmenter** (v1.0.1) | Lightweight but uses naive longest-first matching (no HMM). Rejected because: last updated Aug 2022, unmaintained, lower accuracy. |
| **lindera-cc-cedict** (v2.2.0) | Morphological analysis with CC-CEDICT. Rejected because: primarily designed for Japanese, Chinese support secondary, more complex setup. |
| **icu_segmenter** (v2.1.2) | Unicode Consortium's segmenter. Rejected because: Unicode-standard word boundaries differ from NLP-oriented lexical segmentation, no HMM, large dependency tree. |

## R2: Pinyin Annotation Library

### Decision

Use a **two-layer approach**:
1. **`chinese_dictionary`** (v2.1.6) as the primary pinyin source for word-level lookups with polyphonic disambiguation.
2. **`pinyin`** (v0.11.0) as fallback for characters/words not found in CC-CEDICT.

### Rationale

**Primary: `chinese_dictionary`**
- Bundles the full CC-CEDICT dictionary with word-level pinyin entries.
- Each entry includes `pinyin_marks` (tone marks) and covers both traditional and simplified forms.
- Word-level lookup naturally resolves polyphonic characters: looking up "覺得" returns "jué de" (correct), "睡覺" returns "shuì jiào" (correct). This is true context-dependent disambiguation via dictionary, not character-level guessing.
- Supports traditional characters natively via `query_by_traditional()` and `query_by_chinese()`.

**Fallback: `pinyin`**
- Character-level lookup for any character not covered by CC-CEDICT word entries.
- Supports full Unicode CJK range including rare/archaic characters.
- Actively maintained (v0.11.0, Jan 2026, 467K total downloads).
- Tone marks via `with_tone()` method.
- Default pronunciation is correct for most common characters.

**Combined approach**:
```
For each segmented word:
  1. Look up word in chinese_dictionary (CC-CEDICT)
     → If found: use pinyin_marks (strip spaces to concatenate)
     → If not found: fall back to pinyin crate (character-by-character, concatenate)
```

This gives word-level polyphonic accuracy for common words (CC-CEDICT has ~120K entries) and graceful fallback for unknown words.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **`pinyin` alone** (without CC-CEDICT) | No phrase-based disambiguation. Each character gets its default pronunciation regardless of word context. Works for most common characters but fails on polyphonic cases where the default reading is the wrong one. |
| **`mandarin-to-pinyin`** (v0.0.2) | Character-level only, no disambiguation, very early version (932 downloads). |
| **`dodo-zh`** (v0.1.5) | Converts between pinyin formats but doesn't convert characters to pinyin directly. Requires external CEDICT file. |

## R3: Pinyin Concatenation Strategy

### Decision

Strip spaces from CC-CEDICT `pinyin_marks` field; concatenate character-level pinyin without separators.

### Rationale

- CC-CEDICT stores pinyin as space-separated syllables: "shuì jiào" for 睡覺.
- The spec requires concatenated pinyin per Word: "shuìjiào".
- Simple `.replace(" ", "")` on the CC-CEDICT pinyin string achieves this.
- For the `pinyin` crate fallback, `.collect::<String>()` on the iterator naturally concatenates.

### Alternatives Considered

None — this is the only approach that satisfies FR-003.

## R4: Traditional Chinese Support Strategy

### Decision

Use jieba-rs with a supplementary traditional Chinese dictionary, combined with chinese_dictionary's native traditional support for pinyin lookup.

### Rationale

- jieba-rs's default dictionary is simplified-Chinese focused (~350K entries). Traditional characters will segment but with lower accuracy for traditional-only compound words.
- Loading a supplementary traditional dictionary via `jieba.load_dict()` addresses this gap.
- For pinyin lookup, `chinese_dictionary` already includes both traditional and simplified forms from CC-CEDICT — no gap there.
- The `pinyin` crate covers the full CJK Unicode range, so even rare traditional characters get a reading.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **opencc-jieba-rs** for segmentation | Would solve traditional support out of the box, but traded off for jieba-rs's maturity and community. See R1. |
| **Pre-convert traditional → simplified, segment, map back** | Fragile, lossy (some characters don't round-trip), and adds complexity. |

## R5: Constitution Impact — LLM Integration Clause

### Decision

This feature requires a **constitution amendment** to remove or update the "LLM integration: Claude CLI with the latest Sonnet model" entry from the Technical Constraints section.

### Rationale

- The constitution currently mandates Claude CLI as a constitutional technical constraint.
- This feature explicitly replaces Claude CLI with native software libraries.
- A formal `/speckit.constitution` amendment is needed, either:
  - **Remove** the LLM integration line entirely (if no other feature needs it), or
  - **Replace** with "Text processing: native Rust libraries (jieba-rs, chinese_dictionary, pinyin)" to document the new approach.
- The amendment should be performed after this plan is ratified but before implementation begins.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Keep LLM as optional fallback | Adds complexity for marginal benefit. The user explicitly described the LLM approach as "dysfunctional and unsolvable for long texts." |
| Violate constitution without amendment | Governance section mandates formal amendment process. |

## R6: Binary Size Impact

### Decision

Accept ~20 MB increase in binary size from bundled dictionaries.

### Rationale

- jieba-rs default dictionary: ~11 MB (compiled into binary).
- chinese_dictionary CC-CEDICT: ~18.5 MB (compiled into binary).
- pinyin crate: minimal (lookup tables are compact).
- Total additional binary size: ~20-30 MB.
- For a Windows desktop application, this is acceptable. The current application already bundles Tauri's WebView and Rust runtime.
- The tradeoff (larger binary for fully offline, instant processing) strongly favors the user experience.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Load dictionaries from external files at runtime | Adds deployment complexity, risk of missing files, slower startup. |
| Compress dictionaries with zstd | Adds decompression step at startup. Could be explored later if binary size becomes a concern, but premature optimization now. |
