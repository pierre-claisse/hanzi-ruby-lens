use serde::{Deserialize, Serialize};

// ── Export/Import payload structs ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportText {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub modified_at: Option<String>,
    pub raw_input: String,
    pub segments: String,
    pub locked: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportTag {
    pub id: i64,
    pub label: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportTextTag {
    pub text_id: i64,
    pub tag_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportSession {
    pub id: i64,
    pub date: String,
    pub start_time: String,
    pub end_time: String,
    pub kind: String,
    pub done: i64,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub author: Option<String>,
    pub created_at: String,
    #[serde(default)]
    pub modified_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportSessionText {
    pub session_id: i64,
    pub text_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportPayload {
    pub version: u32,
    pub exported_at: String,
    pub texts: Vec<ExportText>,
    pub tags: Vec<ExportTag>,
    pub text_tags: Vec<ExportTextTag>,
    #[serde(default)]
    pub sessions: Vec<ExportSession>,
    #[serde(default)]
    pub session_texts: Vec<ExportSessionText>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sync_author: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sync_timestamp: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub text_count: usize,
    pub tag_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub text_count: usize,
    pub tag_count: usize,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Word {
    pub characters: String,
    pub pinyin: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comment: Option<String>,
    /// Display name of the user who last set/edited the comment.
    /// Kept in sync with `comment`: present iff `comment` is.
    #[serde(default, rename = "commentAuthor", skip_serializing_if = "Option::is_none")]
    pub comment_author: Option<String>,
    /// Timestamp of the last comment edit, formatted "YYYY-MM-DD HH:MM GMT+8".
    /// Kept in sync with `comment`.
    #[serde(default, rename = "commentAt", skip_serializing_if = "Option::is_none")]
    pub comment_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum TextSegment {
    #[serde(rename = "word")]
    Word { word: Word },
    #[serde(rename = "plain")]
    Plain { text: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Text {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub modified_at: Option<String>,
    pub raw_input: String,
    pub segments: Vec<TextSegment>,
    pub locked: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: i64,
    pub label: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagSummary {
    pub id: i64,
    pub label: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentRef {
    pub segment_index: usize,
    pub comment_at: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SessionKind {
    LiveLesson,
    StudySession,
}

impl SessionKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            SessionKind::LiveLesson => "live_lesson",
            SessionKind::StudySession => "study_session",
        }
    }

    pub fn parse(s: &str) -> Option<SessionKind> {
        match s {
            "live_lesson" => Some(SessionKind::LiveLesson),
            "study_session" => Some(SessionKind::StudySession),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: i64,
    pub date: String,
    pub start_time: String,
    pub end_time: String,
    pub kind: SessionKind,
    pub done: bool,
    pub notes: Option<String>,
    pub author: Option<String>,
    pub text_ids: Vec<i64>,
    pub created_at: String,
    pub modified_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextPreviewWithTags {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub modified_at: Option<String>,
    pub tags: Vec<TagSummary>,
    pub locked: bool,
    pub comments: Vec<CommentRef>,
}
