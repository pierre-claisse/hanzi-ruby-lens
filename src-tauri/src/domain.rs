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
pub struct ExportPayload {
    pub version: u32,
    pub exported_at: String,
    pub texts: Vec<ExportText>,
    pub tags: Vec<ExportTag>,
    pub text_tags: Vec<ExportTextTag>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Word {
    pub characters: String,
    pub pinyin: String,
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
pub struct TextPreviewWithTags {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub modified_at: Option<String>,
    pub tags: Vec<TagSummary>,
    pub locked: bool,
}
