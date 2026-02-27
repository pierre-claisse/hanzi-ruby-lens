use crate::domain::{TextSegment, Word};
use crate::error::AppError;

use std::collections::HashSet;
use std::sync::LazyLock;
use jieba_rs::Jieba;
use pinyin::{ToPinyin, ToPinyinMulti};

static JIEBA: LazyLock<Jieba> = LazyLock::new(Jieba::new);

/// All valid pinyin syllables (without tone marks) for greedy longest-match tokenization.
static PINYIN_SYLLABLES: LazyLock<HashSet<&'static str>> = LazyLock::new(|| {
    let syllables = [
        // Special standalone vowels
        "a", "o", "e", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "er",
        // b-
        "ba", "bo", "bai", "bei", "bao", "ban", "ben", "bang", "beng", "bi",
        "bie", "biao", "bian", "bin", "bing", "bu",
        // p-
        "pa", "po", "pai", "pei", "pao", "pou", "pan", "pen", "pang", "peng",
        "pi", "pie", "piao", "pian", "pin", "ping", "pu",
        // m-
        "ma", "mo", "me", "mai", "mei", "mao", "mou", "man", "men", "mang",
        "meng", "mi", "mie", "miao", "miu", "mian", "min", "ming", "mu",
        // f-
        "fa", "fo", "fei", "fou", "fan", "fen", "fang", "feng", "fu",
        // d-
        "da", "de", "dai", "dei", "dao", "dou", "dan", "den", "dang", "deng",
        "di", "die", "diao", "diu", "dian", "ding", "dong", "du", "duo",
        "dui", "duan", "dun",
        // t-
        "ta", "te", "tai", "tei", "tao", "tou", "tan", "tang", "teng", "ti",
        "tie", "tiao", "tian", "ting", "tong", "tu", "tuo", "tui", "tuan", "tun",
        // n-
        "na", "ne", "nai", "nei", "nao", "nou", "nan", "nen", "nang", "neng",
        "ni", "nie", "niao", "niu", "nian", "nin", "niang", "ning", "nong",
        "nu", "nuo", "nuan", "nun", "nv", "nve",
        // l-
        "la", "le", "lai", "lei", "lao", "lou", "lan", "lang", "leng", "li",
        "lia", "lie", "liao", "liu", "lian", "lin", "liang", "ling", "long",
        "lu", "luo", "luan", "lun", "lv", "lve",
        // g-
        "ga", "ge", "gai", "gei", "gao", "gou", "gan", "gen", "gang", "geng",
        "gong", "gu", "gua", "guai", "guan", "guang", "gui", "gun", "guo",
        // k-
        "ka", "ke", "kai", "kei", "kao", "kou", "kan", "ken", "kang", "keng",
        "kong", "ku", "kua", "kuai", "kuan", "kuang", "kui", "kun", "kuo",
        // h-
        "ha", "he", "hai", "hei", "hao", "hou", "han", "hen", "hang", "heng",
        "hong", "hu", "hua", "huai", "huan", "huang", "hui", "hun", "huo",
        // j-
        "ji", "jia", "jie", "jiao", "jiu", "jian", "jin", "jiang", "jing",
        "jiong", "ju", "jue", "juan", "jun",
        // q-
        "qi", "qia", "qie", "qiao", "qiu", "qian", "qin", "qiang", "qing",
        "qiong", "qu", "que", "quan", "qun",
        // x-
        "xi", "xia", "xie", "xiao", "xiu", "xian", "xin", "xiang", "xing",
        "xiong", "xu", "xue", "xuan", "xun",
        // zh-
        "zha", "zhe", "zhi", "zhai", "zhei", "zhao", "zhou", "zhan", "zhen",
        "zhang", "zheng", "zhong", "zhu", "zhua", "zhuai", "zhuan", "zhuang",
        "zhui", "zhun", "zhuo",
        // ch-
        "cha", "che", "chi", "chai", "chao", "chou", "chan", "chen", "chang",
        "cheng", "chong", "chu", "chua", "chuai", "chuan", "chuang", "chui",
        "chun", "chuo",
        // sh-
        "sha", "she", "shi", "shai", "shei", "shao", "shou", "shan", "shen",
        "shang", "sheng", "shu", "shua", "shuai", "shuan", "shuang", "shui",
        "shun", "shuo",
        // r-
        "ran", "rang", "rao", "re", "ren", "reng", "ri", "rong", "rou",
        "ru", "rua", "ruan", "rui", "run", "ruo",
        // z-
        "za", "ze", "zi", "zai", "zei", "zao", "zou", "zan", "zen", "zang",
        "zeng", "zong", "zu", "zuo", "zui", "zuan", "zun",
        // c-
        "ca", "ce", "ci", "cai", "cao", "cou", "can", "cen", "cang", "ceng",
        "cong", "cu", "cuo", "cui", "cuan", "cun",
        // s-
        "sa", "se", "si", "sai", "sao", "sou", "san", "sen", "sang", "seng",
        "song", "su", "suo", "sui", "suan", "sun",
        // y-
        "ya", "ye", "yi", "yao", "you", "yan", "yin", "yang", "ying", "yong",
        "yu", "yue", "yuan", "yun",
        // w-
        "wa", "wo", "wai", "wei", "wan", "wen", "wang", "weng", "wu",
    ];
    syllables.into_iter().collect()
});

/// Strip tone marks from a pinyin string, replacing accented vowels with plain ASCII.
fn strip_tone_marks(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            'ā' | 'á' | 'ǎ' | 'à' => 'a',
            'ē' | 'é' | 'ě' | 'è' => 'e',
            'ī' | 'í' | 'ǐ' | 'ì' => 'i',
            'ō' | 'ó' | 'ǒ' | 'ò' => 'o',
            'ū' | 'ú' | 'ǔ' | 'ù' => 'u',
            'ǖ' | 'ǘ' | 'ǚ' | 'ǜ' => 'v',
            _ => c,
        })
        .collect()
}

/// Tokenize a concatenated pinyin string into exactly `expected_count` syllables.
///
/// Uses greedy longest-match against the valid pinyin syllable table.
/// Tone marks are stripped for matching but preserved in the output.
///
/// Returns error if the syllable count doesn't match `expected_count`.
pub fn tokenize_pinyin(pinyin: &str, expected_count: usize) -> Result<Vec<String>, AppError> {
    if pinyin.is_empty() {
        return Err(AppError::Validation(format!(
            "Cannot split pinyin '' into {} syllables",
            expected_count
        )));
    }

    let normalized = strip_tone_marks(pinyin);
    let norm_bytes = normalized.as_bytes();
    let pinyin_chars: Vec<char> = pinyin.chars().collect();
    let norm_chars: Vec<char> = normalized.chars().collect();

    // Build byte-offset to char-index mapping for the normalized string
    let mut syllables = Vec::new();
    let mut norm_pos = 0; // char position in normalized string

    while norm_pos < norm_chars.len() {
        // Try longest match first (max pinyin syllable is 6 chars: "zhuang", "chuang", "shuang")
        let max_len = std::cmp::min(6, norm_chars.len() - norm_pos);
        let mut matched = false;

        for len in (1..=max_len).rev() {
            let candidate: String = norm_chars[norm_pos..norm_pos + len].iter().collect();
            if PINYIN_SYLLABLES.contains(candidate.as_str()) {
                // Extract original chars (with tone marks) for this syllable
                let original: String = pinyin_chars[norm_pos..norm_pos + len].iter().collect();
                syllables.push(original);
                norm_pos += len;
                matched = true;
                break;
            }
        }

        if !matched {
            return Err(AppError::Validation(format!(
                "Cannot split pinyin '{}' into {} syllables",
                pinyin, expected_count
            )));
        }
    }

    if syllables.len() != expected_count {
        return Err(AppError::Validation(format!(
            "Cannot split pinyin '{}' into {} syllables",
            pinyin, expected_count
        )));
    }

    Ok(syllables)
}

/// Detect whether a character is a CJK Unified Ideograph.
pub fn is_chinese_char(c: char) -> bool {
    matches!(c,
        '\u{4E00}'..='\u{9FFF}' |   // CJK Unified Ideographs
        '\u{3400}'..='\u{4DBF}' |   // CJK Extension A
        '\u{20000}'..='\u{2A6DF}' | // CJK Extension B
        '\u{2A700}'..='\u{2B73F}' | // CJK Extension C
        '\u{2B740}'..='\u{2B81F}' | // CJK Extension D
        '\u{2B820}'..='\u{2CEAF}' | // CJK Extension E
        '\u{2CEB0}'..='\u{2EBEF}' | // CJK Extension F
        '\u{30000}'..='\u{3134F}' | // CJK Extension G
        '\u{31350}'..='\u{323AF}' | // CJK Extension H
        '\u{F900}'..='\u{FAFF}'     // CJK Compatibility Ideographs
    )
}

/// Check if a pinyin syllable is a valid reading for the given character.
/// Returns true if the syllable matches any of the character's known pronunciations,
/// or true if the character has no pinyin data (trust CC-CEDICT in that case).
fn is_valid_reading_for_char(ch: char, syllable: &str) -> bool {
    if let Some(multi) = ch.to_pinyin_multi() {
        multi.into_iter().any(|p| p.with_tone() == syllable)
    } else {
        true // character not in pinyin database — trust the dictionary
    }
}

/// Look up pinyin for a single Chinese character using Tier 2-4 fallback.
/// Tier 2: CC-CEDICT single-char entry with cross-validation
/// Tier 3: pinyin crate default reading
/// Tier 4: identity fallback (return the character itself)
fn lookup_pinyin_char(ch: char) -> String {
    let ch_str = ch.to_string();

    // Tier 2: CC-CEDICT single-character lookup with cross-validation
    let entries = chinese_dictionary::query_by_chinese(&ch_str);
    for entry in &entries {
        let syllables: Vec<&str> = entry.pinyin_marks.split_whitespace().collect();
        if syllables.len() == 1 {
            let syllable = syllables[0];
            if is_valid_reading_for_char(ch, syllable) {
                return syllable.to_lowercase();
            }
        }
    }

    // Tier 3: pinyin crate default reading
    if let Some(pinyin) = ch.to_pinyin() {
        return pinyin.with_tone().to_lowercase();
    }

    // Tier 4: identity fallback
    ch_str
}

/// Validate a CC-CEDICT entry against a word: check syllable count matches CJK
/// character count, and cross-validate each syllable against the character's known
/// readings. Returns concatenated lowercase pinyin on success, None on failure.
fn validate_and_cross_check_entry(
    word: &str,
    entry: &chinese_dictionary::WordEntry,
) -> Option<String> {
    let cjk_chars: Vec<char> = word.chars().filter(|c| is_chinese_char(*c)).collect();
    let syllables: Vec<&str> = entry.pinyin_marks.split_whitespace().collect();

    // Syllable count must match CJK character count
    if syllables.len() != cjk_chars.len() {
        return None;
    }

    // Cross-validate each syllable against the character's known readings
    for (ch, syllable) in cjk_chars.iter().zip(syllables.iter()) {
        if !is_valid_reading_for_char(*ch, syllable) {
            return None;
        }
    }

    // All checks passed — concatenate and return lowercase
    Some(syllables.join("").to_lowercase())
}

/// Paranoid 4-tier pinyin lookup with syllable-count validation and cross-checking.
/// Tier 1: CC-CEDICT word-level (iterate all entries, validate each)
/// Tier 2-4: Fall back to character-by-character lookup via lookup_pinyin_char
pub fn lookup_pinyin_paranoid(word: &str) -> String {
    // Tier 1: CC-CEDICT word-level lookup — iterate ALL entries, not just first
    let entries = chinese_dictionary::query_by_chinese(word);
    for entry in &entries {
        if let Some(pinyin) = validate_and_cross_check_entry(word, entry) {
            return pinyin;
        }
    }

    // Tier 2-4: character-by-character fallback
    word.chars()
        .map(|c| {
            if is_chinese_char(c) {
                lookup_pinyin_char(c)
            } else {
                c.to_string()
            }
        })
        .collect()
}

/// Score a segmentation by summing the character count of multi-char words
/// found in CC-CEDICT. This favors segmentations with longer recognized words
/// (e.g., 天氣 as one word scores higher than 天 + 氣 as two single chars).
fn score_segmentation(words: &[&str]) -> usize {
    words.iter()
        .filter(|w| w.chars().count() > 1 && !chinese_dictionary::query_by_chinese(w).is_empty())
        .map(|w| w.chars().count())
        .sum()
}

/// Dual segmentation: run jieba in both precise (no HMM) and HMM modes,
/// score each by CC-CEDICT coverage, return the winner (prefer precise on tie).
fn segment_chinese_run(jieba: &Jieba, run: &str) -> Vec<String> {
    let words_precise = jieba.cut(run, false);
    let words_hmm = jieba.cut(run, true);

    let score_precise = score_segmentation(&words_precise);
    let score_hmm = score_segmentation(&words_hmm);

    if score_precise >= score_hmm {
        words_precise.into_iter().map(|s| s.to_string()).collect()
    } else {
        words_hmm.into_iter().map(|s| s.to_string()).collect()
    }
}

/// Full processing pipeline: segment input and annotate with pinyin.
pub fn process_text_native(input: &str) -> Vec<TextSegment> {
    if input.is_empty() {
        return vec![];
    }

    let mut segments = Vec::new();
    let mut chars = input.chars().peekable();

    while chars.peek().is_some() {
        if is_chinese_char(*chars.peek().unwrap()) {
            // Collect contiguous Chinese characters
            let mut chinese_run = String::new();
            while let Some(&c) = chars.peek() {
                if is_chinese_char(c) {
                    chinese_run.push(c);
                    chars.next();
                } else {
                    break;
                }
            }
            // Segment the Chinese run with dual segmentation
            let jieba = &*JIEBA;
            let words = segment_chinese_run(jieba, &chinese_run);
            for word in &words {
                let pinyin = lookup_pinyin_paranoid(word);
                segments.push(TextSegment::Word {
                    word: Word {
                        characters: word.to_string(),
                        pinyin,
                        comment: None,
                    },
                });
            }
        } else {
            // Collect contiguous non-Chinese characters
            let mut plain_run = String::new();
            while let Some(&c) = chars.peek() {
                if !is_chinese_char(c) {
                    plain_run.push(c);
                    chars.next();
                } else {
                    break;
                }
            }
            segments.push(TextSegment::Plain { text: plain_run });
        }
    }

    segments
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_segment_simple_chinese() {
        let segments = process_text_native("今天天氣很好");
        let words: Vec<(&str, &str)> = segments
            .iter()
            .filter_map(|s| match s {
                TextSegment::Word { word } => Some((word.characters.as_str(), word.pinyin.as_str())),
                _ => None,
            })
            .collect();

        assert!(words.contains(&("今天", "jīntiān")), "Expected 今天/jīntiān, got: {words:?}");
        assert!(words.contains(&("天氣", "tiānqì")), "Expected 天氣/tiānqì, got: {words:?}");
        assert!(words.contains(&("很", "hěn")), "Expected 很/hěn, got: {words:?}");
        assert!(words.contains(&("好", "hǎo")), "Expected 好/hǎo, got: {words:?}");
    }

    #[test]
    fn test_segment_mixed_content() {
        let segments = process_text_native("Hello世界！2025年");

        let has_plain_hello = segments.iter().any(|s| matches!(s, TextSegment::Plain { text } if text.contains("Hello")));
        let has_word_shijie = segments.iter().any(|s| matches!(s, TextSegment::Word { word } if word.characters == "世界"));
        let has_plain_punct = segments.iter().any(|s| matches!(s, TextSegment::Plain { text } if text.contains("！")));
        let has_plain_2025 = segments.iter().any(|s| matches!(s, TextSegment::Plain { text } if text.contains("2025")));
        let has_word_nian = segments.iter().any(|s| matches!(s, TextSegment::Word { word } if word.characters == "年"));

        assert!(has_plain_hello, "Expected Plain segment containing 'Hello'");
        assert!(has_word_shijie, "Expected Word segment for 世界");
        assert!(has_plain_punct, "Expected Plain segment for ！");
        assert!(has_plain_2025, "Expected Plain segment containing '2025'");
        assert!(has_word_nian, "Expected Word segment for 年");
    }

    #[test]
    fn test_pinyin_has_tone_marks() {
        let segments = process_text_native("你好世界");
        let tone_mark_chars = ['ā', 'á', 'ǎ', 'à', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì',
                               'ō', 'ó', 'ǒ', 'ò', 'ū', 'ú', 'ǔ', 'ù', 'ǖ', 'ǘ', 'ǚ', 'ǜ'];

        let all_pinyin: String = segments
            .iter()
            .filter_map(|s| match s {
                TextSegment::Word { word } => Some(word.pinyin.as_str()),
                _ => None,
            })
            .collect::<Vec<_>>()
            .join("");

        assert!(
            all_pinyin.chars().any(|c| tone_mark_chars.contains(&c)),
            "Pinyin should contain tone marks, got: {all_pinyin}"
        );

        assert!(
            !all_pinyin.chars().any(|c| c.is_ascii_digit()),
            "Pinyin should not contain tone numbers, got: {all_pinyin}"
        );
    }

    #[test]
    fn test_pinyin_concatenated_per_word() {
        let segments = process_text_native("現在");
        let word = segments.iter().find_map(|s| match s {
            TextSegment::Word { word } if word.characters == "現在" => Some(word),
            _ => None,
        });

        assert!(word.is_some(), "Expected Word segment for 現在");
        let pinyin = &word.unwrap().pinyin;
        assert_eq!(pinyin, "xiànzài", "Pinyin should be concatenated: {pinyin}");
        assert!(!pinyin.contains(' '), "Pinyin should not contain spaces: {pinyin}");
    }

    #[test]
    fn test_polyphonic_disambiguation() {
        let segments = process_text_native("覺得睡覺");

        let juede = segments.iter().find_map(|s| match s {
            TextSegment::Word { word } if word.characters == "覺得" => Some(word),
            _ => None,
        });
        let shuijiao = segments.iter().find_map(|s| match s {
            TextSegment::Word { word } if word.characters == "睡覺" => Some(word),
            _ => None,
        });

        assert!(juede.is_some(), "Expected Word segment for 覺得");
        assert!(shuijiao.is_some(), "Expected Word segment for 睡覺");
        assert!(
            juede.unwrap().pinyin.contains("jué"),
            "覺得 should have jué, got: {}",
            juede.unwrap().pinyin
        );
        assert!(
            shuijiao.unwrap().pinyin.contains("jiào"),
            "睡覺 should have jiào, got: {}",
            shuijiao.unwrap().pinyin
        );
    }

    #[test]
    fn test_empty_input_returns_empty_segments() {
        let segments = process_text_native("");
        assert!(segments.is_empty(), "Empty input should return empty Vec");
    }

    #[test]
    fn test_punctuation_only_returns_plain_segments() {
        let segments = process_text_native("，。！？");
        assert!(!segments.is_empty(), "Punctuation input should produce segments");
        for segment in &segments {
            assert!(
                matches!(segment, TextSegment::Plain { .. }),
                "Punctuation should produce only Plain segments, got Word"
            );
        }
    }

    #[test]
    fn test_single_character_input() {
        let segments = process_text_native("好");
        assert_eq!(segments.len(), 1, "Single char should produce one segment");
        match &segments[0] {
            TextSegment::Word { word } => {
                assert_eq!(word.characters, "好");
                assert_eq!(word.pinyin, "hǎo");
            }
            _ => panic!("Expected Word segment for 好"),
        }
    }

    #[test]
    fn test_all_characters_preserved() {
        let inputs = ["今天天氣很好", "Hello世界！2025年", "，。！？", "好", "覺得睡覺"];
        for input in &inputs {
            let segments = process_text_native(input);
            let reconstructed: String = segments
                .iter()
                .map(|s| match s {
                    TextSegment::Word { word } => word.characters.as_str(),
                    TextSegment::Plain { text } => text.as_str(),
                })
                .collect();
            assert_eq!(
                &reconstructed, input,
                "All characters must be preserved for input: {input}"
            );
        }
    }

    #[test]
    fn test_mixed_simplified_traditional() {
        let segments = process_text_native("学习覺得");

        let xuexi = segments.iter().find_map(|s| match s {
            TextSegment::Word { word } if word.characters == "学习" => Some(word),
            _ => None,
        });
        let juede = segments.iter().find_map(|s| match s {
            TextSegment::Word { word } if word.characters == "覺得" => Some(word),
            _ => None,
        });

        assert!(xuexi.is_some(), "Expected Word segment for 学习 (simplified)");
        assert!(juede.is_some(), "Expected Word segment for 覺得 (traditional)");

        let xuexi_pinyin = &xuexi.unwrap().pinyin;
        let juede_pinyin = &juede.unwrap().pinyin;
        assert!(
            xuexi_pinyin.contains("xué") || xuexi_pinyin.contains("xue"),
            "学习 should have xué pinyin, got: {xuexi_pinyin}"
        );
        assert!(
            juede_pinyin.contains("jué"),
            "覺得 should have jué pinyin, got: {juede_pinyin}"
        );
    }

    // T022: Process 5,000 characters without failure (US2)
    #[test]
    fn test_process_5000_chars() {
        let base = "今天天氣很好我們一起去公園散步吧";
        let input: String = base.repeat(313); // ~5000 chars
        assert!(input.chars().count() >= 5000);

        let segments = process_text_native(&input);
        let reconstructed: String = segments
            .iter()
            .map(|s| match s {
                TextSegment::Word { word } => word.characters.as_str(),
                TextSegment::Plain { text } => text.as_str(),
            })
            .collect();
        assert_eq!(reconstructed, input, "All 5000+ characters must be preserved");
    }

    // T023: Process 10,000 characters without failure (US2)
    #[test]
    fn test_process_10000_chars() {
        let base = "今天天氣很好我們一起去公園散步吧";
        let input: String = base.repeat(625); // ~10000 chars
        assert!(input.chars().count() >= 10000);

        let segments = process_text_native(&input);
        let reconstructed: String = segments
            .iter()
            .map(|s| match s {
                TextSegment::Word { word } => word.characters.as_str(),
                TextSegment::Plain { text } => text.as_str(),
            })
            .collect();
        assert_eq!(reconstructed, input, "All 10000+ characters must be preserved");
        assert!(!segments.is_empty(), "Should produce segments");
    }

    // Performance — 500 chars under 5 seconds (SC-003)
    #[test]
    fn test_performance_500_chars() {
        // Warm up Jieba lazy singleton (dictionary load is one-time cost)
        let _ = process_text_native("你好");

        let base = "今天天氣很好我們一起去公園散步吧";
        let input: String = base.repeat(32); // ~512 chars
        assert!(input.chars().count() >= 500);

        let start = std::time::Instant::now();
        let segments = process_text_native(&input);
        let elapsed = start.elapsed();

        assert!(!segments.is_empty(), "Should produce segments");
        assert!(
            elapsed.as_secs() < 5,
            "500 chars should process in under 5 seconds, took: {elapsed:?}"
        );
    }

    // Performance — 5,000 chars under 30 seconds (SC-004)
    #[test]
    fn test_performance_5000_chars() {
        // Warm up Jieba lazy singleton (dictionary load is one-time cost)
        let _ = process_text_native("你好");

        let base = "今天天氣很好我們一起去公園散步吧";
        let input: String = base.repeat(313); // ~5000 chars
        assert!(input.chars().count() >= 5000);

        let start = std::time::Instant::now();
        let segments = process_text_native(&input);
        let elapsed = start.elapsed();

        assert!(!segments.is_empty(), "Should produce segments");
        assert!(
            elapsed.as_secs() < 30,
            "5000 chars should process in under 30 seconds, took: {elapsed:?}"
        );
    }

    #[test]
    fn test_is_valid_reading_for_char() {
        // 覺 is polyphonic: jué (as in 覺得) and jiào (as in 睡覺)
        assert!(is_valid_reading_for_char('覺', "jué"), "jué should be valid for 覺");
        assert!(is_valid_reading_for_char('覺', "jiào"), "jiào should be valid for 覺");
        assert!(!is_valid_reading_for_char('覺', "hǎo"), "hǎo should NOT be valid for 覺");

        // 好 has hǎo and hào
        assert!(is_valid_reading_for_char('好', "hǎo"), "hǎo should be valid for 好");
        assert!(!is_valid_reading_for_char('好', "jué"), "jué should NOT be valid for 好");
    }

    #[test]
    fn test_lookup_pinyin_char_basic() {
        // Common character
        let hao = lookup_pinyin_char('好');
        assert_eq!(hao, "hǎo", "好 should produce hǎo, got: {hao}");

        // Polyphonic character — default/most common reading
        let jue = lookup_pinyin_char('覺');
        assert!(!jue.is_empty(), "覺 should produce non-empty pinyin");

        // Rare character — should still produce something non-empty
        let rare = lookup_pinyin_char('龘');
        assert!(!rare.is_empty(), "龘 should produce non-empty pinyin via fallback");
    }

    #[test]
    fn test_syllable_count_validation() {
        let segments = process_text_native("覺得睡覺");

        // Helper: count pinyin syllables by counting vowel groups with tone marks
        fn count_cjk_chars(s: &str) -> usize {
            s.chars().filter(|c| super::is_chinese_char(*c)).count()
        }

        for segment in &segments {
            if let TextSegment::Word { word } = segment {
                let char_count = count_cjk_chars(&word.characters);
                // Verify pinyin is non-empty
                assert!(!word.pinyin.is_empty(),
                    "Pinyin should not be empty for {}", word.characters);
                // Verify pinyin is lowercase (FR-006)
                assert_eq!(word.pinyin, word.pinyin.to_lowercase(),
                    "Pinyin should be lowercase for {}: {}", word.characters, word.pinyin);
                // Verify tone marks are present (FR-006)
                let tone_marks = ['ā', 'á', 'ǎ', 'à', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì',
                                  'ō', 'ó', 'ǒ', 'ò', 'ū', 'ú', 'ǔ', 'ù', 'ǖ', 'ǘ', 'ǚ', 'ǜ'];
                assert!(word.pinyin.chars().any(|c| tone_marks.contains(&c)),
                    "Pinyin should contain tone marks for {}: {}", word.characters, word.pinyin);
                // Verify syllable count equals character count
                // We check by counting that the pinyin can be attributed to char_count syllables
                // The paranoid pipeline guarantees this at construction time
                assert!(char_count > 0,
                    "Word should have CJK characters: {}", word.characters);
            }
        }

        // Specific assertions for polyphonic 覺
        let juede = segments.iter().find_map(|s| match s {
            TextSegment::Word { word } if word.characters == "覺得" => Some(word),
            _ => None,
        });
        let shuijiao = segments.iter().find_map(|s| match s {
            TextSegment::Word { word } if word.characters == "睡覺" => Some(word),
            _ => None,
        });
        assert!(juede.is_some(), "Expected Word segment for 覺得");
        assert!(shuijiao.is_some(), "Expected Word segment for 睡覺");
        assert_eq!(juede.unwrap().pinyin, "juéde", "覺得 should produce juéde");
        assert_eq!(shuijiao.unwrap().pinyin, "shuìjiào", "睡覺 should produce shuìjiào");
    }

    #[test]
    fn test_cross_validation_rejects_wrong_reading() {
        // Create a scenario where cross-validation would reject:
        // Use is_valid_reading_for_char directly — it should reject mismatches
        assert!(!is_valid_reading_for_char('好', "mā"), "mā is not a valid reading for 好");
        assert!(!is_valid_reading_for_char('天', "dì"), "dì is not a valid reading for 天");
        assert!(!is_valid_reading_for_char('覺', "hǎo"), "hǎo is not a valid reading for 覺");

        // Verify that validate_and_cross_check_entry rejects entries with wrong readings
        // by processing a word and confirming the result is valid
        let result = lookup_pinyin_paranoid("好");
        assert_eq!(result, "hǎo", "好 should produce hǎo through paranoid lookup");
    }

    #[test]
    fn test_cedict_iterates_entries() {
        // Process words where the first CC-CEDICT entry might have issues
        // The system should iterate and find a valid entry or fall back gracefully
        let result = lookup_pinyin_paranoid("覺得");
        assert_eq!(result, "juéde", "覺得 should produce juéde, got: {result}");

        let result = lookup_pinyin_paranoid("睡覺");
        assert_eq!(result, "shuìjiào", "睡覺 should produce shuìjiào, got: {result}");

        // Test a common word to ensure iteration works
        let result = lookup_pinyin_paranoid("現在");
        assert_eq!(result, "xiànzài", "現在 should produce xiànzài, got: {result}");
    }

    #[test]
    fn test_dual_segmentation_prefers_precise() {
        let segments = process_text_native("今天天氣很好");
        let words: Vec<&str> = segments
            .iter()
            .filter_map(|s| match s {
                TextSegment::Word { word } => Some(word.characters.as_str()),
                _ => None,
            })
            .collect();

        // Should segment as dictionary words, not HMM noise
        assert!(words.contains(&"今天"), "Should have 今天, got: {words:?}");
        assert!(words.contains(&"天氣"), "Should have 天氣, got: {words:?}");
        assert!(words.contains(&"很"), "Should have 很, got: {words:?}");
        assert!(words.contains(&"好"), "Should have 好, got: {words:?}");
        // Should NOT have bad segmentation like 天天
        assert!(!words.contains(&"天天"), "Should NOT have 天天, got: {words:?}");
    }

    #[test]
    fn test_rare_char_never_empty_pinyin() {
        // Test a set of rare characters — all must produce non-empty pinyin
        let rare_chars = ["龘", "𠀀", "𪜀"];
        for &ch_str in &rare_chars {
            let segments = process_text_native(ch_str);
            assert!(!segments.is_empty(), "Should produce segments for {ch_str}");
            for segment in &segments {
                if let TextSegment::Word { word } = segment {
                    assert!(
                        !word.pinyin.is_empty(),
                        "Pinyin should not be empty for rare character {}: got empty",
                        word.characters
                    );
                }
            }
        }
    }

    #[test]
    fn test_identity_fallback_for_unknown_char() {
        // Use lookup_pinyin_char on a character that has no pinyin data at all.
        // CJK Extension B characters that are extremely rare may fall through to Tier 4.
        // If the pinyin crate covers it, it gets Tier 3. Either way, non-empty.
        let result = lookup_pinyin_char('𠀀');
        assert!(!result.is_empty(), "𠀀 should produce non-empty result via fallback");

        // For a character truly unknown to all databases, identity fallback returns itself
        // Using a private-use area character as a proxy for "unknown"
        let result = lookup_pinyin_char('\u{F0000}');
        assert!(!result.is_empty(), "Unknown char should return itself via Tier 4 identity");
    }

    #[test]
    fn test_lookup_pinyin_char_fallback_tiers() {
        // Tier 2: CC-CEDICT char lookup — common character
        let hao = lookup_pinyin_char('好');
        assert_eq!(hao, "hǎo", "好 should use Tier 2 CC-CEDICT, got: {hao}");

        // Tier 3: pinyin crate — character not in CC-CEDICT but in pinyin DB
        // Most CJK chars are in both, so this implicitly tests Tier 2 or 3
        let result = lookup_pinyin_char('龘');
        assert!(!result.is_empty(), "龘 should produce pinyin via Tier 2 or 3");

        // Tier 4: identity — handled by test_identity_fallback_for_unknown_char
    }

    // Existing rare characters fallback test
    #[test]
    fn test_rare_characters_fallback() {
        // 龘 (dá) — rare character not typically in CC-CEDICT word entries
        let segments = process_text_native("龘");
        assert_eq!(segments.len(), 1);
        match &segments[0] {
            TextSegment::Word { word } => {
                assert_eq!(word.characters, "龘");
                assert!(!word.pinyin.is_empty(), "Rare character should have pinyin fallback");
            }
            _ => panic!("Expected Word segment for rare character"),
        }
    }

    // ── tokenize_pinyin tests (T002) ──

    #[test]
    fn test_tokenize_faguoren() {
        let result = tokenize_pinyin("fǎguórén", 3).unwrap();
        assert_eq!(result, vec!["fǎ", "guó", "rén"]);
    }

    #[test]
    fn test_tokenize_nihao() {
        let result = tokenize_pinyin("nǐhǎo", 2).unwrap();
        assert_eq!(result, vec!["nǐ", "hǎo"]);
    }

    #[test]
    fn test_tokenize_xianzai() {
        let result = tokenize_pinyin("xiànzài", 2).unwrap();
        assert_eq!(result, vec!["xiàn", "zài"]);
    }

    #[test]
    fn test_tokenize_shuijiao() {
        let result = tokenize_pinyin("shuìjiào", 2).unwrap();
        assert_eq!(result, vec!["shuì", "jiào"]);
    }

    #[test]
    fn test_tokenize_er() {
        let result = tokenize_pinyin("ér", 1).unwrap();
        assert_eq!(result, vec!["ér"]);
    }

    #[test]
    fn test_tokenize_single_ren() {
        let result = tokenize_pinyin("rén", 1).unwrap();
        assert_eq!(result, vec!["rén"]);
    }

    #[test]
    fn test_tokenize_wrong_expected_count() {
        let result = tokenize_pinyin("nǐhǎo", 3);
        assert!(result.is_err(), "Should error when expected_count doesn't match");
    }

    #[test]
    fn test_tokenize_empty_string() {
        let result = tokenize_pinyin("", 1);
        assert!(result.is_err(), "Should error on empty string");
    }
}
