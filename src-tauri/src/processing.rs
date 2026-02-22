use crate::domain::{TextSegment, Word};

use std::sync::LazyLock;
use jieba_rs::Jieba;
use pinyin::ToPinyin;

static JIEBA: LazyLock<Jieba> = LazyLock::new(Jieba::new);

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

/// Look up pinyin for a Chinese word using CC-CEDICT with character-level fallback.
pub fn lookup_pinyin(word: &str) -> String {
    // Layer 1: CC-CEDICT word-level lookup
    let entries = chinese_dictionary::query_by_chinese(word);
    if let Some(entry) = entries.first() {
        return entry.pinyin_marks.replace(' ', "").to_lowercase();
    }

    // Layer 2: character-level fallback via pinyin crate
    let result: String = word.chars()
        .map(|c| {
            c.to_pinyin()
                .map(|p| p.with_tone().to_string())
                .unwrap_or_else(|| c.to_string())
        })
        .collect();
    result.to_lowercase()
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
            // Segment the Chinese run with jieba
            let jieba = &*JIEBA;
            let words = jieba.cut(&chinese_run, true);
            for word in words {
                let pinyin = lookup_pinyin(word);
                segments.push(TextSegment::Word {
                    word: Word {
                        characters: word.to_string(),
                        pinyin,
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

    // T025: Performance — 500 chars under 2 seconds (US3)
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
            elapsed.as_secs() < 2,
            "500 chars should process in under 2 seconds, took: {elapsed:?}"
        );
    }

    // T026: Performance — 5,000 chars under 10 seconds (US3)
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
            elapsed.as_secs() < 10,
            "5000 chars should process in under 10 seconds, took: {elapsed:?}"
        );
    }

    // T030: Rare characters fallback (Polish)
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
}
