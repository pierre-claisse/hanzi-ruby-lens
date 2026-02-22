# Research: Paranoid Pinyin Pipeline

**Feature**: 023-paranoid-pinyin-pipeline
**Date**: 2026-02-22

## R1: Segmentation Strategy — HMM vs Precise Mode

**Decision**: Use dual segmentation — run both `cut(text, false)` (precise/no-HMM) and `cut(text, true)` (HMM), then pick the result with more dictionary-recognized words.

**Rationale**: jieba-rs with HMM enabled achieves ~81.6% baseline accuracy but introduces noise for domain texts by guessing unknown words. Precise mode (HMM disabled) only segments on known dictionary vocabulary, producing more conservative and predictable results. By running both and scoring by dictionary coverage, we get the best of both approaches: conservative when the dictionary suffices, HMM when it finds legitimate words the dictionary-only pass misses.

**Alternatives considered**:
- HMM-only (current): Simpler but ~81% accuracy, adds noise
- Precise-only: More conservative but misses legitimate unknown words
- `cut_for_search()`: Produces overlapping segments — unsuitable for reading annotation
- `cut_all()`: Aggressive over-segmentation — unsuitable for display

## R2: Pinyin Cross-Validation with ToPinyinMulti

**Decision**: Enable the `heteronym` feature on the `pinyin` crate to access `ToPinyinMulti` trait, which returns all valid readings for each character. Use this to cross-validate CC-CEDICT word-level pinyin.

**Rationale**: The `pinyin` crate v0.11 with `heteronym` feature exposes `char.to_pinyin_multi()` → `Option<PinyinMulti>`, where `PinyinMulti` implements `IntoIterator` yielding `Pinyin` items with `.with_tone()` method. This lets us verify that each syllable from a CC-CEDICT entry is actually a valid pronunciation of its corresponding character, catching dictionary mismatches without any new crate dependency.

**Alternatives considered**:
- No cross-validation (current): Faster but accepts wrong readings
- Custom pinyin validation table: Reinvents what the crate already provides
- New crate (rust-pinyin): Similar functionality, unnecessary dependency

## R3: Syllable-Count Validation Strategy

**Decision**: Validate syllable count by splitting `pinyin_marks` on whitespace BEFORE removing spaces, then comparing against the CJK character count in the word.

**Rationale**: CC-CEDICT stores `pinyin_marks` as space-separated syllables (e.g., "xiàn zài"). Splitting on whitespace gives exact syllable count. This is far simpler and more reliable than trying to parse concatenated pinyin back into syllables. The validation happens before concatenation, not after.

**Alternatives considered**:
- Post-concatenation syllable splitter: Complex, ambiguous (e.g., "xian" = "xi"+"an" or "xian"?)
- Regex-based syllable counting: Fragile with tone marks
- No validation (current): Allows mismatched syllable counts through

## R4: Multi-Entry Iteration for CC-CEDICT

**Decision**: Iterate all entries returned by `query_by_chinese(word)` instead of taking `.first()`. Accept the first entry that passes both syllable-count and cross-validation checks.

**Rationale**: `query_by_chinese()` returns `Vec<&'static WordEntry>` ordered by frequency. The first entry is usually correct, but some words have entries where the first result is for a different meaning/reading. By iterating and validating, we find the first frequency-ordered entry that actually matches the characters.

**Alternatives considered**:
- Always use `.first()` (current): Simple but blindly accepts wrong readings
- Use `.last()`: No rationale for preferring less common readings
- Score all entries: Over-engineering; sequential validation with early return suffices

## R5: Four-Tier Fallback Hierarchy

**Decision**: Implement pinyin lookup as a 4-tier cascade: (1) CC-CEDICT word-level with validation, (2) CC-CEDICT character-by-character, (3) pinyin crate default reading, (4) identity fallback.

**Rationale**: Each tier provides a different quality/coverage tradeoff. Tier 1 gives the best context-aware reading. Tier 2 gives validated single-character readings from a large dictionary. Tier 3 gives the default pronunciation from a comprehensive phonetic database. Tier 4 ensures no character ever produces empty output. The cascade ensures maximum quality with guaranteed coverage.

**Alternatives considered**:
- Two-tier (current): Word-level then char-level pinyin crate — misses validated char-level CC-CEDICT
- Single-tier: Only CC-CEDICT — gaps for rare characters
- Neural/CRF disambiguation: State-of-the-art accuracy but no Rust implementation, massive complexity

## R6: Performance Budget

**Decision**: Accept relaxed performance targets (5s/500 chars, 30s/5000 chars) to accommodate the paranoid pipeline. The base pipeline processes 5000 chars in ~100ms, so even a 100x slowdown stays within budget.

**Rationale**: The dual segmentation doubles jieba calls (sub-ms each). The main cost is additional CC-CEDICT lookups for scoring and character-level fallback. CC-CEDICT lookups are the bottleneck at ~0.1ms each. For 5000 chars producing ~2000 words, the additional lookups add ~200ms per segmentation pass. Total overhead is modest compared to the 30s budget.

**Alternatives considered**:
- Keep original 2s/10s budgets: Overly constraining, risks premature optimization
- No performance budget: Unacceptable — must have a ceiling
- Caching CC-CEDICT results: Premature optimization; measure first

## R7: Dependency Change

**Decision**: Only one dependency change — enable the `heteronym` feature on the existing `pinyin` crate. No new crate dependencies.

**Rationale**: The `heteronym` feature is a compile-time feature flag on an already-included dependency. It adds the `ToPinyinMulti` trait and `PinyinMulti` struct with additional lookup tables. Binary size impact is minimal. No new supply chain risk.

**Alternatives considered**:
- Add `opencc-jieba-rs`: Better traditional Chinese but adds a new dependency for marginal benefit
- Add `rsnltk`: General NLP toolkit but overkill for this specific need
- No dependency changes: Cannot cross-validate without multi-reading access
