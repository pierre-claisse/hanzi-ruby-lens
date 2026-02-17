use crate::domain::TextSegment;
use crate::error::AppError;

pub const SYSTEM_PROMPT: &str = "\
You are a Chinese text segmentation tool. Segment the input into a JSON array.

Rules:
- Group characters into natural Chinese words (lexical units, not individual characters).
- Each Chinese word gets a pinyin string determined at the word level (context-dependent pronunciation).
- Pinyin MUST use tone marks (e.g., jīntiān), NOT tone numbers (e.g., jin1tian1).
- Pinyin MUST be a single concatenated string per word (e.g., \"xiànzài\" not \"xiàn zài\").
- Both traditional and simplified characters are supported.
- Punctuation, whitespace, numbers, and non-Chinese text become \"plain\" segments.
- Every input character must appear in exactly one segment, in order.
- Do not add, remove, or reorder any characters from the input.

Output format: Return ONLY a JSON array, no markdown fences, no explanation. Each element:
- Word: {\"type\":\"word\",\"word\":{\"characters\":\"...\",\"pinyin\":\"...\"}}
- Plain: {\"type\":\"plain\",\"text\":\"...\"}

Example: [{\"type\":\"word\",\"word\":{\"characters\":\"你好\",\"pinyin\":\"nǐhǎo\"}},{\"type\":\"plain\",\"text\":\"，\"},{\"type\":\"word\",\"word\":{\"characters\":\"世界\",\"pinyin\":\"shìjiè\"}}]";

pub fn build_prompt(raw_input: &str) -> String {
    raw_input.to_string()
}

pub fn parse_claude_response(stdout: &str) -> Result<Vec<TextSegment>, AppError> {
    let envelope: serde_json::Value = serde_json::from_str(stdout).map_err(|e| {
        let preview: String = stdout.chars().take(300).collect();
        AppError::Processing(format!(
            "Failed to parse CLI response: {e}\nStdout preview ({} chars): {preview}",
            stdout.len()
        ))
    })?;

    let result = envelope
        .get("result")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            let keys: Vec<&str> = envelope.as_object().map_or(vec![], |o| o.keys().map(|k| k.as_str()).collect());
            AppError::Processing(format!(
                "CLI response missing result field. Envelope keys: {keys:?}"
            ))
        })?;

    let json_str = strip_code_fences(result);

    let segments: Vec<TextSegment> = serde_json::from_str(&json_str).map_err(|e| {
        let preview: String = json_str.chars().take(300).collect();
        AppError::Processing(format!(
            "Failed to parse segments: {e}\nResponse preview ({} chars): {preview}",
            json_str.len()
        ))
    })?;

    Ok(segments)
}

fn strip_code_fences(s: &str) -> String {
    let trimmed = s.trim();
    if let Some(rest) = trimmed.strip_prefix("```") {
        // Remove opening fence (possibly with language tag like ```json)
        let after_open = rest.find('\n').map_or(rest, |pos| &rest[pos + 1..]);
        // Remove closing fence
        if let Some(pos) = after_open.rfind("```") {
            return after_open[..pos].trim().to_string();
        }
    }
    trimmed.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_prompt_contains_raw_input() {
        let result = build_prompt("今天天氣很好");
        assert_eq!(result, "今天天氣很好");
    }

    #[test]
    fn build_prompt_preserves_mixed_content() {
        let result = build_prompt("Hello世界！2025年");
        assert!(result.contains("Hello世界！2025年"));
    }

    #[test]
    fn parse_valid_response_returns_segments() {
        let json = r#"{
            "type": "result",
            "result": "[{\"type\":\"word\",\"word\":{\"characters\":\"今天\",\"pinyin\":\"jīntiān\"}},{\"type\":\"plain\",\"text\":\"，\"},{\"type\":\"word\",\"word\":{\"characters\":\"天氣\",\"pinyin\":\"tiānqì\"}}]",
            "session_id": "test",
            "is_error": false,
            "duration_ms": 1000
        }"#;

        let segments = parse_claude_response(json).unwrap();
        assert_eq!(segments.len(), 3);

        match &segments[0] {
            TextSegment::Word { word } => {
                assert_eq!(word.characters, "今天");
                assert_eq!(word.pinyin, "jīntiān");
            }
            _ => panic!("Expected Word segment"),
        }

        match &segments[1] {
            TextSegment::Plain { text } => assert_eq!(text, "，"),
            _ => panic!("Expected Plain segment"),
        }
    }

    #[test]
    fn parse_response_with_code_fences() {
        let json = r#"{
            "type": "result",
            "result": "```json\n[{\"type\":\"word\",\"word\":{\"characters\":\"你好\",\"pinyin\":\"nǐhǎo\"}}]\n```"
        }"#;

        let segments = parse_claude_response(json).unwrap();
        assert_eq!(segments.len(), 1);
        match &segments[0] {
            TextSegment::Word { word } => assert_eq!(word.characters, "你好"),
            _ => panic!("Expected Word segment"),
        }
    }

    #[test]
    fn parse_malformed_json_returns_error() {
        let result = parse_claude_response("not valid json");
        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("Processing error"));
    }

    #[test]
    fn parse_missing_result_field_returns_error() {
        let json = r#"{ "type": "result" }"#;
        let result = parse_claude_response(json);
        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("result"));
    }

    #[test]
    fn parse_invalid_segments_json_returns_error() {
        let json = r#"{ "type": "result", "result": "not valid json" }"#;
        let result = parse_claude_response(json);
        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("parse"));
    }

    #[test]
    fn strip_code_fences_removes_json_fence() {
        let input = "```json\n[1,2,3]\n```";
        assert_eq!(strip_code_fences(input), "[1,2,3]");
    }

    #[test]
    fn strip_code_fences_preserves_plain_json() {
        let input = "[1,2,3]";
        assert_eq!(strip_code_fences(input), "[1,2,3]");
    }
}
