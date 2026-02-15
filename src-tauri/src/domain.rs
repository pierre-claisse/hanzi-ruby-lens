use serde::{Deserialize, Serialize};

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
    pub raw_input: String,
    pub segments: Vec<TextSegment>,
}
