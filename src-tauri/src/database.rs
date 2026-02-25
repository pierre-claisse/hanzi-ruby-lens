use std::path::PathBuf;

use rusqlite::Connection;

use crate::domain::{Tag, TagSummary, Text, TextPreviewWithTags, TextSegment};
use crate::error::AppError;

pub fn initialize(db_path: PathBuf) -> Result<Connection, AppError> {
    let conn = Connection::open(&db_path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS texts (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT    NOT NULL,
            created_at TEXT    NOT NULL,
            raw_input  TEXT    NOT NULL,
            segments   TEXT    NOT NULL DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS tags (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT    NOT NULL UNIQUE COLLATE NOCASE,
            color TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS text_tags (
            text_id INTEGER NOT NULL REFERENCES texts(id) ON DELETE CASCADE,
            tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            PRIMARY KEY (text_id, tag_id)
        );",
    )?;

    // Migration: add modified_at column (idempotent — ignore if already exists)
    let _ = conn.execute_batch("ALTER TABLE texts ADD COLUMN modified_at TEXT");

    // Migration: add locked column (idempotent — ignore if already exists)
    let _ = conn.execute_batch("ALTER TABLE texts ADD COLUMN locked INTEGER NOT NULL DEFAULT 0");

    Ok(conn)
}

pub fn insert_text(
    conn: &mut Connection,
    title: &str,
    raw_input: &str,
    segments: &[TextSegment],
) -> Result<Text, AppError> {
    let created_at = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let segments_json = serde_json::to_string(segments)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    let tx = conn.transaction()?;
    tx.execute(
        "INSERT INTO texts (title, created_at, raw_input, segments) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![title, created_at, raw_input, segments_json],
    )?;
    let id = tx.last_insert_rowid();
    tx.commit()?;

    Ok(Text {
        id,
        title: title.to_string(),
        created_at,
        modified_at: None,
        raw_input: raw_input.to_string(),
        segments: segments.to_vec(),
        locked: false,
    })
}

pub fn list_all_texts(
    conn: &Connection,
    tag_ids: &[i64],
    sort_asc: bool,
) -> Result<Vec<TextPreviewWithTags>, AppError> {
    let order = if sort_asc { "ASC" } else { "DESC" };

    let text_rows: Vec<(i64, String, String, Option<String>, bool)> = if tag_ids.is_empty() {
        let sql = format!(
            "SELECT id, title, created_at, modified_at, locked FROM texts ORDER BY created_at {}",
            order
        );
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map([], |row| {
            let locked: i64 = row.get(4)?;
            Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, locked != 0))
        })?
            .collect::<Result<Vec<_>, _>>()?;
        rows
    } else {
        let placeholders: Vec<String> = tag_ids.iter().enumerate().map(|(i, _)| format!("?{}", i + 1)).collect();
        let sql = format!(
            "SELECT DISTINCT t.id, t.title, t.created_at, t.modified_at, t.locked FROM texts t \
             INNER JOIN text_tags tt ON t.id = tt.text_id \
             WHERE tt.tag_id IN ({}) \
             ORDER BY t.created_at {}",
            placeholders.join(", "),
            order
        );
        let mut stmt = conn.prepare(&sql)?;
        let params: Vec<&dyn rusqlite::types::ToSql> =
            tag_ids.iter().map(|id| id as &dyn rusqlite::types::ToSql).collect();
        let rows = stmt.query_map(params.as_slice(), |row| {
            let locked: i64 = row.get(4)?;
            Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, locked != 0))
        })?
        .collect::<Result<Vec<_>, _>>()?;
        rows
    };

    let mut tag_stmt =
        conn.prepare("SELECT tg.id, tg.label, tg.color FROM tags tg INNER JOIN text_tags tt ON tg.id = tt.tag_id WHERE tt.text_id = ?1")?;

    let mut results = Vec::with_capacity(text_rows.len());
    for (id, title, created_at, modified_at, locked) in text_rows {
        let tags = tag_stmt
            .query_map(rusqlite::params![id], |row| {
                Ok(TagSummary {
                    id: row.get(0)?,
                    label: row.get(1)?,
                    color: row.get(2)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        results.push(TextPreviewWithTags {
            id,
            title,
            created_at,
            modified_at,
            tags,
            locked,
        });
    }
    Ok(results)
}

pub fn load_text_by_id(conn: &Connection, id: i64) -> Result<Option<Text>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, title, created_at, modified_at, raw_input, segments, locked FROM texts WHERE id = ?1",
    )?;
    let mut rows = stmt.query(rusqlite::params![id])?;
    match rows.next()? {
        Some(row) => {
            let segments_json: String = row.get(5)?;
            let segments = serde_json::from_str(&segments_json).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    0,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;
            let locked: i64 = row.get(6)?;
            Ok(Some(Text {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                modified_at: row.get(3)?,
                raw_input: row.get(4)?,
                segments,
                locked: locked != 0,
            }))
        }
        None => Ok(None),
    }
}

pub fn update_segments(
    conn: &mut Connection,
    id: i64,
    segment_index: usize,
    new_pinyin: &str,
) -> Result<(), AppError> {
    let mut stmt = conn.prepare("SELECT segments FROM texts WHERE id = ?1")?;
    let segments_json: String = stmt
        .query_row(rusqlite::params![id], |row| row.get(0))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::Validation(format!("Text with id {} not found", id))
            }
            other => AppError::Database(other),
        })?;

    let mut segments: Vec<TextSegment> = serde_json::from_str(&segments_json).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;

    if segment_index >= segments.len() {
        return Err(AppError::Validation(format!(
            "Segment index {} out of bounds (length {})",
            segment_index,
            segments.len()
        )));
    }

    match &mut segments[segment_index] {
        TextSegment::Word { word } => {
            word.pinyin = new_pinyin.to_string();
        }
        TextSegment::Plain { .. } => {
            return Err(AppError::Validation(format!(
                "Segment at index {} is not a word",
                segment_index
            )));
        }
    }

    let updated_json = serde_json::to_string(&segments)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    let modified_at = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    conn.execute(
        "UPDATE texts SET segments = ?1, modified_at = ?2 WHERE id = ?3",
        rusqlite::params![updated_json, modified_at, id],
    )?;

    Ok(())
}

/// Split a word segment into two at the given character boundary.
/// The pinyin is partitioned using the tokenizer to match character counts.
pub fn split_segment_db(
    conn: &mut Connection,
    id: i64,
    segment_index: usize,
    split_after_char_index: usize,
) -> Result<(), AppError> {
    let mut stmt = conn.prepare("SELECT segments FROM texts WHERE id = ?1")?;
    let segments_json: String = stmt
        .query_row(rusqlite::params![id], |row| row.get(0))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::Validation(format!("Text with id {} not found", id))
            }
            other => AppError::Database(other),
        })?;

    let mut segments: Vec<TextSegment> = serde_json::from_str(&segments_json).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;

    if segment_index >= segments.len() {
        return Err(AppError::Validation(format!(
            "Segment index {} out of bounds (length {})",
            segment_index,
            segments.len()
        )));
    }

    let (characters, pinyin) = match &segments[segment_index] {
        TextSegment::Word { word } => (word.characters.clone(), word.pinyin.clone()),
        TextSegment::Plain { .. } => {
            return Err(AppError::Validation(format!(
                "Segment at index {} is not a word",
                segment_index
            )));
        }
    };

    let chars: Vec<char> = characters.chars().collect();
    let char_count = chars.len();

    if char_count < 2 || split_after_char_index >= char_count - 1 {
        return Err(AppError::Validation(format!(
            "Split point {} out of range for word with {} characters",
            split_after_char_index, char_count
        )));
    }

    // Tokenize pinyin into per-character syllables
    let syllables = crate::processing::tokenize_pinyin(&pinyin, char_count)?;

    let left_chars: String = chars[..=split_after_char_index].iter().collect();
    let right_chars: String = chars[split_after_char_index + 1..].iter().collect();
    let left_pinyin: String = syllables[..=split_after_char_index].join("");
    let right_pinyin: String = syllables[split_after_char_index + 1..].join("");

    let left_word = TextSegment::Word {
        word: crate::domain::Word {
            characters: left_chars,
            pinyin: left_pinyin,
        },
    };
    let right_word = TextSegment::Word {
        word: crate::domain::Word {
            characters: right_chars,
            pinyin: right_pinyin,
        },
    };

    // Replace original segment with two new segments
    segments.splice(segment_index..=segment_index, [left_word, right_word]);

    let updated_json = serde_json::to_string(&segments)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    let modified_at = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    conn.execute(
        "UPDATE texts SET segments = ?1, modified_at = ?2 WHERE id = ?3",
        rusqlite::params![updated_json, modified_at, id],
    )?;

    Ok(())
}

/// Merge two adjacent word segments into one.
/// The left segment at `segment_index` is merged with the segment at `segment_index + 1`.
pub fn merge_segments_db(
    conn: &mut Connection,
    id: i64,
    segment_index: usize,
) -> Result<(), AppError> {
    let mut stmt = conn.prepare("SELECT segments FROM texts WHERE id = ?1")?;
    let segments_json: String = stmt
        .query_row(rusqlite::params![id], |row| row.get(0))
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::Validation(format!("Text with id {} not found", id))
            }
            other => AppError::Database(other),
        })?;

    let mut segments: Vec<TextSegment> = serde_json::from_str(&segments_json).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
    })?;

    if segment_index >= segments.len() {
        return Err(AppError::Validation(format!(
            "Segment index {} out of bounds (length {})",
            segment_index,
            segments.len()
        )));
    }

    let (left_chars, left_pinyin) = match &segments[segment_index] {
        TextSegment::Word { word } => (word.characters.clone(), word.pinyin.clone()),
        TextSegment::Plain { .. } => {
            return Err(AppError::Validation(format!(
                "Segment at index {} is not a word",
                segment_index
            )));
        }
    };

    if segment_index + 1 >= segments.len() {
        return Err(AppError::Validation(format!(
            "No segment after index {} to merge with",
            segment_index
        )));
    }

    let (right_chars, right_pinyin) = match &segments[segment_index + 1] {
        TextSegment::Word { word } => (word.characters.clone(), word.pinyin.clone()),
        TextSegment::Plain { .. } => {
            return Err(AppError::Validation(format!(
                "Segment at index {} is not a word",
                segment_index + 1
            )));
        }
    };

    let merged_chars = format!("{}{}", left_chars, right_chars);
    if merged_chars.chars().count() > 12 {
        return Err(AppError::Validation(format!(
            "Merged word would have {} characters, exceeding the 12-character limit",
            merged_chars.chars().count()
        )));
    }

    let merged_pinyin = format!("{}{}", left_pinyin, right_pinyin);

    let merged_word = TextSegment::Word {
        word: crate::domain::Word {
            characters: merged_chars,
            pinyin: merged_pinyin,
        },
    };

    // Replace two segments with one
    segments.splice(segment_index..=segment_index + 1, [merged_word]);

    let updated_json = serde_json::to_string(&segments)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    let modified_at = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    conn.execute(
        "UPDATE texts SET segments = ?1, modified_at = ?2 WHERE id = ?3",
        rusqlite::params![updated_json, modified_at, id],
    )?;

    Ok(())
}

// ── Tag operations ──

pub fn list_tags(conn: &Connection) -> Result<Vec<Tag>, AppError> {
    let mut stmt = conn.prepare("SELECT id, label, color FROM tags ORDER BY label")?;
    let tags = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                label: row.get(1)?,
                color: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(tags)
}

pub fn create_tag(conn: &Connection, label: &str, color: &str) -> Result<Tag, AppError> {
    let label = label.trim();
    if label.is_empty() {
        return Err(AppError::Validation("Tag label must not be empty".to_string()));
    }

    conn.execute(
        "INSERT INTO tags (label, color) VALUES (?1, ?2)",
        rusqlite::params![label, color],
    )
    .map_err(|e| match &e {
        rusqlite::Error::SqliteFailure(err, _)
            if err.code == rusqlite::ffi::ErrorCode::ConstraintViolation =>
        {
            AppError::Validation(format!("A tag with label \"{}\" already exists", label))
        }
        _ => AppError::Database(e),
    })?;

    let id = conn.last_insert_rowid();
    Ok(Tag {
        id,
        label: label.to_string(),
        color: color.to_string(),
    })
}

pub fn update_tag(conn: &Connection, tag_id: i64, label: &str, color: &str) -> Result<Tag, AppError> {
    let label = label.trim();
    if label.is_empty() {
        return Err(AppError::Validation("Tag label must not be empty".to_string()));
    }

    let affected = conn
        .execute(
            "UPDATE tags SET label = ?1, color = ?2 WHERE id = ?3",
            rusqlite::params![label, color, tag_id],
        )
        .map_err(|e| match &e {
            rusqlite::Error::SqliteFailure(err, _)
                if err.code == rusqlite::ffi::ErrorCode::ConstraintViolation =>
            {
                AppError::Validation(format!("A tag with label \"{}\" already exists", label))
            }
            _ => AppError::Database(e),
        })?;

    if affected == 0 {
        return Err(AppError::Validation(format!("Tag with id {} not found", tag_id)));
    }

    Ok(Tag {
        id: tag_id,
        label: label.to_string(),
        color: color.to_string(),
    })
}

pub fn delete_tag(conn: &Connection, tag_id: i64) -> Result<(), AppError> {
    let affected = conn.execute("DELETE FROM tags WHERE id = ?1", rusqlite::params![tag_id])?;
    if affected == 0 {
        return Err(AppError::Validation(format!("Tag with id {} not found", tag_id)));
    }
    Ok(())
}

pub fn assign_tag(conn: &Connection, text_ids: &[i64], tag_id: i64) -> Result<(), AppError> {
    for text_id in text_ids {
        conn.execute(
            "INSERT OR IGNORE INTO text_tags (text_id, tag_id) VALUES (?1, ?2)",
            rusqlite::params![text_id, tag_id],
        )?;
    }
    Ok(())
}

pub fn remove_tag(conn: &Connection, text_ids: &[i64], tag_id: i64) -> Result<(), AppError> {
    for text_id in text_ids {
        conn.execute(
            "DELETE FROM text_tags WHERE text_id = ?1 AND tag_id = ?2",
            rusqlite::params![text_id, tag_id],
        )?;
    }
    Ok(())
}

pub fn toggle_lock_db(conn: &Connection, id: i64) -> Result<bool, AppError> {
    let affected = conn.execute(
        "UPDATE texts SET locked = NOT locked WHERE id = ?1",
        rusqlite::params![id],
    )?;
    if affected == 0 {
        return Err(AppError::Validation(format!(
            "Text with id {} not found",
            id
        )));
    }
    let locked: i64 = conn.query_row(
        "SELECT locked FROM texts WHERE id = ?1",
        rusqlite::params![id],
        |row| row.get(0),
    )?;
    Ok(locked != 0)
}

pub fn delete_text(conn: &Connection, id: i64) -> Result<(), AppError> {
    let affected = conn.execute("DELETE FROM texts WHERE id = ?1", rusqlite::params![id])?;
    if affected == 0 {
        return Err(AppError::Validation(format!(
            "Text with id {} not found",
            id
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::Word;

    fn in_memory_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS texts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                title       TEXT    NOT NULL,
                created_at  TEXT    NOT NULL,
                raw_input   TEXT    NOT NULL,
                segments    TEXT    NOT NULL DEFAULT '[]',
                modified_at TEXT,
                locked      INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS tags (
                id    INTEGER PRIMARY KEY AUTOINCREMENT,
                label TEXT    NOT NULL UNIQUE COLLATE NOCASE,
                color TEXT    NOT NULL
            );

            CREATE TABLE IF NOT EXISTS text_tags (
                text_id INTEGER NOT NULL REFERENCES texts(id) ON DELETE CASCADE,
                tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                PRIMARY KEY (text_id, tag_id)
            );",
        )
        .unwrap();
        conn
    }

    fn sample_segments() -> Vec<TextSegment> {
        vec![
            TextSegment::Word {
                word: Word {
                    characters: "你好".to_string(),
                    pinyin: "nǐhǎo".to_string(),
                },
            },
            TextSegment::Plain {
                text: "，".to_string(),
            },
            TextSegment::Word {
                word: Word {
                    characters: "世界".to_string(),
                    pinyin: "shìjiè".to_string(),
                },
            },
        ]
    }

    #[test]
    fn insert_and_load_round_trip() {
        let mut conn = in_memory_db();
        let segments = sample_segments();

        let text = insert_text(&mut conn, "Test Title", "你好世界", &segments).unwrap();
        assert!(text.id > 0);
        assert_eq!(text.title, "Test Title");
        assert_eq!(text.raw_input, "你好世界");
        assert_eq!(text.segments.len(), 3);

        let loaded = load_text_by_id(&conn, text.id).unwrap().unwrap();
        assert_eq!(loaded.id, text.id);
        assert_eq!(loaded.title, "Test Title");
        assert_eq!(loaded.raw_input, "你好世界");
        assert_eq!(loaded.segments.len(), 3);
    }

    #[test]
    fn list_texts_returns_previews_ordered_by_date() {
        let conn = in_memory_db();

        conn.execute(
            "INSERT INTO texts (title, created_at, raw_input, segments) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params!["Older", "2026-01-01T00:00:00", "旧", "[]"],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO texts (title, created_at, raw_input, segments) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params!["Newer", "2026-02-01T00:00:00", "新", "[]"],
        )
        .unwrap();

        let previews = list_all_texts(&conn, &[], false).unwrap();
        assert_eq!(previews.len(), 2);
        assert_eq!(previews[0].title, "Newer");
        assert_eq!(previews[1].title, "Older");
    }

    #[test]
    fn load_nonexistent_returns_none() {
        let conn = in_memory_db();
        let result = load_text_by_id(&conn, 999).unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn update_segments_patches_pinyin() {
        let mut conn = in_memory_db();
        let segments = sample_segments();
        let text = insert_text(&mut conn, "Test", "你好世界", &segments).unwrap();

        update_segments(&mut conn, text.id, 0, "nihao").unwrap();

        let loaded = load_text_by_id(&conn, text.id).unwrap().unwrap();
        match &loaded.segments[0] {
            TextSegment::Word { word } => assert_eq!(word.pinyin, "nihao"),
            _ => panic!("expected Word segment"),
        }
    }

    #[test]
    fn update_segments_rejects_plain() {
        let mut conn = in_memory_db();
        let segments = sample_segments();
        let text = insert_text(&mut conn, "Test", "你好世界", &segments).unwrap();

        let result = update_segments(&mut conn, text.id, 1, "test");
        assert!(result.is_err());
    }

    #[test]
    fn update_segments_rejects_out_of_bounds() {
        let mut conn = in_memory_db();
        let segments = sample_segments();
        let text = insert_text(&mut conn, "Test", "你好世界", &segments).unwrap();

        let result = update_segments(&mut conn, text.id, 99, "test");
        assert!(result.is_err());
    }

    #[test]
    fn delete_text_removes_row() {
        let mut conn = in_memory_db();
        let segments = sample_segments();
        let text = insert_text(&mut conn, "Test", "你好世界", &segments).unwrap();

        delete_text(&conn, text.id).unwrap();
        assert!(load_text_by_id(&conn, text.id).unwrap().is_none());
    }

    #[test]
    fn delete_nonexistent_returns_error() {
        let conn = in_memory_db();
        let result = delete_text(&conn, 999);
        assert!(result.is_err());
    }

    #[test]
    fn initialize_creates_schema() {
        let dir = tempfile::tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let conn = initialize(db_path).unwrap();

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM texts", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn corrupted_db_returns_error() {
        let dir = tempfile::tempdir().unwrap();
        let db_path = dir.path().join("corrupted.db");
        std::fs::write(&db_path, b"this is not a sqlite file").unwrap();

        let result = initialize(db_path);
        assert!(result.is_err());
    }

    // ── split_segment_db tests (T006) ──

    fn three_char_word_segments() -> Vec<TextSegment> {
        vec![
            TextSegment::Word {
                word: Word {
                    characters: "你好嗎".to_string(),
                    pinyin: "nǐhǎoma".to_string(),
                },
            },
        ]
    }

    #[test]
    fn split_nihao_at_index_0() {
        let mut conn = in_memory_db();
        let segments = vec![TextSegment::Word {
            word: Word {
                characters: "你好".to_string(),
                pinyin: "nǐhǎo".to_string(),
            },
        }];
        let text = insert_text(&mut conn, "Test", "你好", &segments).unwrap();

        split_segment_db(&mut conn, text.id, 0, 0).unwrap();

        let loaded = load_text_by_id(&conn, text.id).unwrap().unwrap();
        assert_eq!(loaded.segments.len(), 2);
        match &loaded.segments[0] {
            TextSegment::Word { word } => {
                assert_eq!(word.characters, "你");
                assert_eq!(word.pinyin, "nǐ");
            }
            _ => panic!("Expected Word"),
        }
        match &loaded.segments[1] {
            TextSegment::Word { word } => {
                assert_eq!(word.characters, "好");
                assert_eq!(word.pinyin, "hǎo");
            }
            _ => panic!("Expected Word"),
        }
    }

    #[test]
    fn split_3char_word_at_each_boundary() {
        let mut conn = in_memory_db();
        let segments = three_char_word_segments();
        let text = insert_text(&mut conn, "Test", "你好嗎", &segments).unwrap();

        // Split at index 0: "你" + "好嗎"
        split_segment_db(&mut conn, text.id, 0, 0).unwrap();
        let loaded = load_text_by_id(&conn, text.id).unwrap().unwrap();
        assert_eq!(loaded.segments.len(), 2);
        match &loaded.segments[0] {
            TextSegment::Word { word } => assert_eq!(word.characters, "你"),
            _ => panic!("Expected Word"),
        }
        match &loaded.segments[1] {
            TextSegment::Word { word } => assert_eq!(word.characters, "好嗎"),
            _ => panic!("Expected Word"),
        }

        // Now split "好嗎" at index 0: "好" + "嗎"
        split_segment_db(&mut conn, text.id, 1, 0).unwrap();
        let loaded = load_text_by_id(&conn, text.id).unwrap().unwrap();
        assert_eq!(loaded.segments.len(), 3);
        match &loaded.segments[2] {
            TextSegment::Word { word } => assert_eq!(word.characters, "嗎"),
            _ => panic!("Expected Word"),
        }
    }

    #[test]
    fn split_3char_at_index_1() {
        let mut conn = in_memory_db();
        let segments = three_char_word_segments();
        let text = insert_text(&mut conn, "Test", "你好嗎", &segments).unwrap();

        // Split at index 1: "你好" + "嗎"
        split_segment_db(&mut conn, text.id, 0, 1).unwrap();
        let loaded = load_text_by_id(&conn, text.id).unwrap().unwrap();
        assert_eq!(loaded.segments.len(), 2);
        match &loaded.segments[0] {
            TextSegment::Word { word } => {
                assert_eq!(word.characters, "你好");
                assert_eq!(word.pinyin, "nǐhǎo");
            }
            _ => panic!("Expected Word"),
        }
        match &loaded.segments[1] {
            TextSegment::Word { word } => {
                assert_eq!(word.characters, "嗎");
                assert_eq!(word.pinyin, "ma");
            }
            _ => panic!("Expected Word"),
        }
    }

    #[test]
    fn split_out_of_range_returns_error() {
        let mut conn = in_memory_db();
        let segments = vec![TextSegment::Word {
            word: Word {
                characters: "你好".to_string(),
                pinyin: "nǐhǎo".to_string(),
            },
        }];
        let text = insert_text(&mut conn, "Test", "你好", &segments).unwrap();

        // split_after_char_index = 1 is out of range for 2-char word (max is 0)
        let result = split_segment_db(&mut conn, text.id, 0, 1);
        assert!(result.is_err(), "Split point out of range should error");
    }

    #[test]
    fn split_plain_segment_returns_error() {
        let mut conn = in_memory_db();
        let segments = vec![TextSegment::Plain { text: "，".to_string() }];
        let text = insert_text(&mut conn, "Test", "，", &segments).unwrap();

        let result = split_segment_db(&mut conn, text.id, 0, 0);
        assert!(result.is_err(), "Splitting a Plain segment should error");
    }

    #[test]
    fn split_index_out_of_bounds_returns_error() {
        let mut conn = in_memory_db();
        let segments = sample_segments();
        let text = insert_text(&mut conn, "Test", "你好世界", &segments).unwrap();

        let result = split_segment_db(&mut conn, text.id, 99, 0);
        assert!(result.is_err(), "Segment index out of bounds should error");
    }

    // ── merge_segments_db tests (T013) ──

    #[test]
    fn merge_two_words() {
        let mut conn = in_memory_db();
        let segments = vec![
            TextSegment::Word {
                word: Word { characters: "你".to_string(), pinyin: "nǐ".to_string() },
            },
            TextSegment::Word {
                word: Word { characters: "好".to_string(), pinyin: "hǎo".to_string() },
            },
        ];
        let text = insert_text(&mut conn, "Test", "你好", &segments).unwrap();

        merge_segments_db(&mut conn, text.id, 0).unwrap();

        let loaded = load_text_by_id(&conn, text.id).unwrap().unwrap();
        assert_eq!(loaded.segments.len(), 1);
        match &loaded.segments[0] {
            TextSegment::Word { word } => {
                assert_eq!(word.characters, "你好");
                assert_eq!(word.pinyin, "nǐhǎo");
            }
            _ => panic!("Expected Word"),
        }
    }

    #[test]
    fn merge_exceeds_12_chars_returns_error() {
        let mut conn = in_memory_db();
        let long_chars = "一二三四五六七八九十";  // 10 chars
        let short_chars = "甲乙丙";  // 3 chars = total 13
        let segments = vec![
            TextSegment::Word {
                word: Word { characters: long_chars.to_string(), pinyin: "test".to_string() },
            },
            TextSegment::Word {
                word: Word { characters: short_chars.to_string(), pinyin: "test2".to_string() },
            },
        ];
        let raw = format!("{}{}", long_chars, short_chars);
        let text = insert_text(&mut conn, "Test", &raw, &segments).unwrap();

        let result = merge_segments_db(&mut conn, text.id, 0);
        assert!(result.is_err(), "Merge exceeding 12 chars should error");
    }

    #[test]
    fn merge_left_plain_returns_error() {
        let mut conn = in_memory_db();
        let segments = vec![
            TextSegment::Plain { text: "，".to_string() },
            TextSegment::Word {
                word: Word { characters: "好".to_string(), pinyin: "hǎo".to_string() },
            },
        ];
        let text = insert_text(&mut conn, "Test", "，好", &segments).unwrap();

        let result = merge_segments_db(&mut conn, text.id, 0);
        assert!(result.is_err(), "Left segment is Plain should error");
    }

    #[test]
    fn merge_right_plain_returns_error() {
        let mut conn = in_memory_db();
        let segments = vec![
            TextSegment::Word {
                word: Word { characters: "好".to_string(), pinyin: "hǎo".to_string() },
            },
            TextSegment::Plain { text: "，".to_string() },
        ];
        let text = insert_text(&mut conn, "Test", "好，", &segments).unwrap();

        let result = merge_segments_db(&mut conn, text.id, 0);
        assert!(result.is_err(), "Right segment is Plain should error");
    }

    #[test]
    fn merge_no_right_segment_returns_error() {
        let mut conn = in_memory_db();
        let segments = vec![
            TextSegment::Word {
                word: Word { characters: "好".to_string(), pinyin: "hǎo".to_string() },
            },
        ];
        let text = insert_text(&mut conn, "Test", "好", &segments).unwrap();

        let result = merge_segments_db(&mut conn, text.id, 0);
        assert!(result.is_err(), "No right segment should error");
    }

    #[test]
    fn merge_index_out_of_bounds_returns_error() {
        let mut conn = in_memory_db();
        let segments = sample_segments();
        let text = insert_text(&mut conn, "Test", "你好世界", &segments).unwrap();

        let result = merge_segments_db(&mut conn, text.id, 99);
        assert!(result.is_err(), "Segment index out of bounds should error");
    }
}
