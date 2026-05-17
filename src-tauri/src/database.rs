use std::path::PathBuf;

use rusqlite::Connection;

use crate::domain::{
    CommentRef, ExportPayload, ExportSession, ExportSessionText, ExportTag, ExportText,
    ExportTextTag, ImportResult, Session, SessionKind, Tag, TagSummary, Text,
    TextPreviewWithTags, TextSegment,
};
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

    // Sessions schema (calendar feature).
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS sessions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            date        TEXT    NOT NULL,
            start_time  TEXT    NOT NULL,
            end_time    TEXT    NOT NULL,
            kind        TEXT    NOT NULL,
            done        INTEGER NOT NULL DEFAULT 0,
            notes       TEXT,
            author      TEXT,
            created_at  TEXT    NOT NULL,
            modified_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);

        CREATE TABLE IF NOT EXISTS session_texts (
            session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            text_id    INTEGER NOT NULL REFERENCES texts(id)    ON DELETE CASCADE,
            PRIMARY KEY (session_id, text_id)
        );",
    )?;

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

    let text_rows: Vec<(i64, String, String, Option<String>, bool, String)> = if tag_ids.is_empty() {
        let sql = format!(
            "SELECT id, title, created_at, modified_at, locked, segments FROM texts ORDER BY created_at {}",
            order
        );
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map([], |row| {
            let locked: i64 = row.get(4)?;
            Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, locked != 0, row.get(5)?))
        })?
            .collect::<Result<Vec<_>, _>>()?;
        rows
    } else {
        let placeholders: Vec<String> = tag_ids.iter().enumerate().map(|(i, _)| format!("?{}", i + 1)).collect();
        let sql = format!(
            "SELECT DISTINCT t.id, t.title, t.created_at, t.modified_at, t.locked, t.segments FROM texts t \
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
            Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, locked != 0, row.get(5)?))
        })?
        .collect::<Result<Vec<_>, _>>()?;
        rows
    };

    let mut tag_stmt =
        conn.prepare("SELECT tg.id, tg.label, tg.color FROM tags tg INNER JOIN text_tags tt ON tg.id = tt.tag_id WHERE tt.text_id = ?1")?;

    let mut results = Vec::with_capacity(text_rows.len());
    for (id, title, created_at, modified_at, locked, segments_json) in text_rows {
        let tags = tag_stmt
            .query_map(rusqlite::params![id], |row| {
                Ok(TagSummary {
                    id: row.get(0)?,
                    label: row.get(1)?,
                    color: row.get(2)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        let comments = extract_comment_refs(&segments_json);
        results.push(TextPreviewWithTags {
            id,
            title,
            created_at,
            modified_at,
            tags,
            locked,
            comments,
        });
    }
    Ok(results)
}

/// Extract comment metadata (segmentIndex + commentAt) from a serialized
/// segments JSON. Comments without a `commentAt` (legacy data written before
/// the metadata feature) are skipped — they have no stable identity for the
/// local read/unread tracker. Parse failures yield an empty list rather than
/// propagating, so a malformed row doesn't break the whole listing.
fn extract_comment_refs(segments_json: &str) -> Vec<CommentRef> {
    let segments: Vec<TextSegment> = match serde_json::from_str(segments_json) {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };
    segments
        .iter()
        .enumerate()
        .filter_map(|(idx, seg)| match seg {
            TextSegment::Word { word } => {
                match (&word.comment, &word.comment_at) {
                    (Some(_), Some(ts)) => Some(CommentRef {
                        segment_index: idx,
                        comment_at: ts.clone(),
                    }),
                    _ => None,
                }
            }
            TextSegment::Plain { .. } => None,
        })
        .collect()
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
        TextSegment::Word { word } => {
            if word.comment.is_some() {
                return Err(AppError::Validation(
                    "Cannot split a word that has a comment. Delete the comment first.".to_string(),
                ));
            }
            (word.characters.clone(), word.pinyin.clone())
        }
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
            ..Default::default()
        },
    };
    let right_word = TextSegment::Word {
        word: crate::domain::Word {
            characters: right_chars,
            pinyin: right_pinyin,
            ..Default::default()
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
        TextSegment::Word { word } => {
            if word.comment.is_some() {
                return Err(AppError::Validation(
                    "Cannot merge words that have comments. Delete the comment(s) first."
                        .to_string(),
                ));
            }
            (word.characters.clone(), word.pinyin.clone())
        }
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
        TextSegment::Word { word } => {
            if word.comment.is_some() {
                return Err(AppError::Validation(
                    "Cannot merge words that have comments. Delete the comment(s) first."
                        .to_string(),
                ));
            }
            (word.characters.clone(), word.pinyin.clone())
        }
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
            ..Default::default()
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

pub fn update_word_comment_db(
    conn: &mut Connection,
    id: i64,
    segment_index: usize,
    comment: Option<String>,
    author: Option<String>,
) -> Result<(), AppError> {
    // Load the text row (locked check + segments)
    let (locked, segments_json): (i64, String) = conn
        .query_row(
            "SELECT locked, segments FROM texts WHERE id = ?1",
            rusqlite::params![id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::Validation(format!("Text with id {} not found", id))
            }
            other => AppError::Database(other),
        })?;

    if locked != 0 {
        return Err(AppError::Validation(
            "Cannot modify comments on a locked text".to_string(),
        ));
    }

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
            match &comment {
                Some(text) if !text.is_empty() => {
                    if text.len() > 5000 {
                        return Err(AppError::Validation(
                            "Comment must not exceed 5000 characters".to_string(),
                        ));
                    }
                    word.comment = Some(text.clone());
                    word.comment_author = author.filter(|a| !a.trim().is_empty());
                    word.comment_at = Some(crate::sync::now_gmt8_string());
                }
                _ => {
                    word.comment = None;
                    word.comment_author = None;
                    word.comment_at = None;
                }
            }
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

// ── Session operations ──

fn now_gmt8_iso() -> String {
    chrono::Utc::now()
        .with_timezone(&chrono::FixedOffset::east_opt(8 * 3600).unwrap())
        .format("%Y-%m-%dT%H:%M:%S")
        .to_string()
}

fn load_session_text_ids(conn: &Connection, session_id: i64) -> Result<Vec<i64>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT text_id FROM session_texts WHERE session_id = ?1 ORDER BY text_id",
    )?;
    let ids = stmt
        .query_map(rusqlite::params![session_id], |row| row.get::<_, i64>(0))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(ids)
}

fn replace_session_texts(
    tx: &rusqlite::Transaction,
    session_id: i64,
    text_ids: &[i64],
) -> Result<(), AppError> {
    tx.execute(
        "DELETE FROM session_texts WHERE session_id = ?1",
        rusqlite::params![session_id],
    )?;
    let mut seen = std::collections::HashSet::new();
    for tid in text_ids {
        if !seen.insert(*tid) {
            continue;
        }
        tx.execute(
            "INSERT INTO session_texts (session_id, text_id) VALUES (?1, ?2)",
            rusqlite::params![session_id, tid],
        )
        .map_err(|e| match &e {
            rusqlite::Error::SqliteFailure(err, _)
                if err.code == rusqlite::ffi::ErrorCode::ConstraintViolation =>
            {
                AppError::Validation(format!("Text with id {} not found", tid))
            }
            _ => AppError::Database(e),
        })?;
    }
    Ok(())
}

struct SessionRow {
    id: i64,
    date: String,
    start_time: String,
    end_time: String,
    kind: String,
    done: i64,
    notes: Option<String>,
    author: Option<String>,
    created_at: String,
    modified_at: Option<String>,
}

pub fn list_sessions_in_range(
    conn: &Connection,
    from: &str,
    to: &str,
) -> Result<Vec<Session>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, date, start_time, end_time, kind, done, notes, author, created_at, modified_at \
         FROM sessions WHERE date >= ?1 AND date <= ?2 ORDER BY date, start_time, id",
    )?;
    let rows = stmt
        .query_map(rusqlite::params![from, to], |row| {
            Ok(SessionRow {
                id: row.get(0)?,
                date: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
                kind: row.get(4)?,
                done: row.get(5)?,
                notes: row.get(6)?,
                author: row.get(7)?,
                created_at: row.get(8)?,
                modified_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let mut sessions = Vec::with_capacity(rows.len());
    for r in rows {
        let kind = SessionKind::parse(&r.kind).ok_or_else(|| {
            AppError::Validation(format!("Unknown session kind in row {}: {}", r.id, r.kind))
        })?;
        let text_ids = load_session_text_ids(conn, r.id)?;
        sessions.push(Session {
            id: r.id,
            date: r.date,
            start_time: r.start_time,
            end_time: r.end_time,
            kind,
            done: r.done != 0,
            notes: r.notes,
            author: r.author,
            text_ids,
            created_at: r.created_at,
            modified_at: r.modified_at,
        });
    }
    Ok(sessions)
}

fn validate_session_fields(
    date: &str,
    start_time: &str,
    end_time: &str,
) -> Result<(), AppError> {
    if date.len() != 10 || date.as_bytes()[4] != b'-' || date.as_bytes()[7] != b'-' {
        return Err(AppError::Validation(format!("Invalid date format: {}", date)));
    }
    for t in [start_time, end_time] {
        if t.len() != 5 || t.as_bytes()[2] != b':' {
            return Err(AppError::Validation(format!("Invalid time format: {}", t)));
        }
    }
    if end_time <= start_time {
        return Err(AppError::Validation(
            "End time must be strictly greater than start time".to_string(),
        ));
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub fn create_session(
    conn: &mut Connection,
    date: &str,
    start_time: &str,
    end_time: &str,
    kind: SessionKind,
    done: bool,
    notes: Option<String>,
    author: Option<String>,
    text_ids: &[i64],
) -> Result<Session, AppError> {
    validate_session_fields(date, start_time, end_time)?;
    let created_at = now_gmt8_iso();

    let tx = conn.transaction()?;
    tx.execute(
        "INSERT INTO sessions (date, start_time, end_time, kind, done, notes, author, created_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            date,
            start_time,
            end_time,
            kind.as_str(),
            if done { 1 } else { 0 },
            notes,
            author,
            created_at,
        ],
    )?;
    let id = tx.last_insert_rowid();
    replace_session_texts(&tx, id, text_ids)?;
    tx.commit()?;

    let mut deduped = text_ids.to_vec();
    deduped.sort_unstable();
    deduped.dedup();

    Ok(Session {
        id,
        date: date.to_string(),
        start_time: start_time.to_string(),
        end_time: end_time.to_string(),
        kind,
        done,
        notes,
        author,
        text_ids: deduped,
        created_at,
        modified_at: None,
    })
}

#[allow(clippy::too_many_arguments)]
pub fn update_session_db(
    conn: &mut Connection,
    id: i64,
    date: &str,
    start_time: &str,
    end_time: &str,
    kind: SessionKind,
    done: bool,
    notes: Option<String>,
    text_ids: &[i64],
) -> Result<Session, AppError> {
    validate_session_fields(date, start_time, end_time)?;
    let modified_at = now_gmt8_iso();

    let tx = conn.transaction()?;
    let affected = tx.execute(
        "UPDATE sessions SET date = ?1, start_time = ?2, end_time = ?3, kind = ?4, done = ?5, \
         notes = ?6, modified_at = ?7 WHERE id = ?8",
        rusqlite::params![
            date,
            start_time,
            end_time,
            kind.as_str(),
            if done { 1 } else { 0 },
            notes,
            modified_at,
            id,
        ],
    )?;
    if affected == 0 {
        return Err(AppError::Validation(format!(
            "Session with id {} not found",
            id
        )));
    }
    replace_session_texts(&tx, id, text_ids)?;

    let (author, created_at): (Option<String>, String) = tx.query_row(
        "SELECT author, created_at FROM sessions WHERE id = ?1",
        rusqlite::params![id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;

    tx.commit()?;

    let mut deduped = text_ids.to_vec();
    deduped.sort_unstable();
    deduped.dedup();

    Ok(Session {
        id,
        date: date.to_string(),
        start_time: start_time.to_string(),
        end_time: end_time.to_string(),
        kind,
        done,
        notes,
        author,
        text_ids: deduped,
        created_at,
        modified_at: Some(modified_at),
    })
}

pub fn delete_session_db(conn: &Connection, id: i64) -> Result<(), AppError> {
    let affected = conn.execute("DELETE FROM sessions WHERE id = ?1", rusqlite::params![id])?;
    if affected == 0 {
        return Err(AppError::Validation(format!(
            "Session with id {} not found",
            id
        )));
    }
    Ok(())
}

// ── Export / Import / Reset operations ──

pub fn export_all(conn: &Connection) -> Result<ExportPayload, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, title, created_at, modified_at, raw_input, segments, locked FROM texts",
    )?;
    let texts = stmt
        .query_map([], |row| {
            Ok(ExportText {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                modified_at: row.get(3)?,
                raw_input: row.get(4)?,
                segments: row.get(5)?,
                locked: row.get(6)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let mut stmt = conn.prepare("SELECT id, label, color FROM tags")?;
    let tags = stmt
        .query_map([], |row| {
            Ok(ExportTag {
                id: row.get(0)?,
                label: row.get(1)?,
                color: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let mut stmt = conn.prepare("SELECT text_id, tag_id FROM text_tags")?;
    let text_tags = stmt
        .query_map([], |row| {
            Ok(ExportTextTag {
                text_id: row.get(0)?,
                tag_id: row.get(1)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    drop(stmt);

    let mut stmt = conn.prepare(
        "SELECT id, date, start_time, end_time, kind, done, notes, author, created_at, modified_at \
         FROM sessions ORDER BY id",
    )?;
    let sessions = stmt
        .query_map([], |row| {
            Ok(ExportSession {
                id: row.get(0)?,
                date: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
                kind: row.get(4)?,
                done: row.get(5)?,
                notes: row.get(6)?,
                author: row.get(7)?,
                created_at: row.get(8)?,
                modified_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    drop(stmt);

    let mut stmt = conn.prepare(
        "SELECT session_id, text_id FROM session_texts ORDER BY session_id, text_id",
    )?;
    let session_texts = stmt
        .query_map([], |row| {
            Ok(ExportSessionText {
                session_id: row.get(0)?,
                text_id: row.get(1)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    drop(stmt);

    let exported_at = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();

    Ok(ExportPayload {
        version: 1,
        exported_at,
        texts,
        tags,
        text_tags,
        sessions,
        session_texts,
        sync_author: None,
        sync_timestamp: None,
    })
}

pub fn validate_export_payload(payload: &ExportPayload) -> Result<(), AppError> {
    if payload.version != 1 {
        return Err(AppError::Validation(format!(
            "Unsupported export version: {}. Expected version 1.",
            payload.version
        )));
    }

    let text_ids: std::collections::HashSet<i64> = payload.texts.iter().map(|t| t.id).collect();
    if text_ids.len() != payload.texts.len() {
        return Err(AppError::Validation("Duplicate text IDs in export file".to_string()));
    }

    let tag_ids: std::collections::HashSet<i64> = payload.tags.iter().map(|t| t.id).collect();
    if tag_ids.len() != payload.tags.len() {
        return Err(AppError::Validation("Duplicate tag IDs in export file".to_string()));
    }

    for tt in &payload.text_tags {
        if !text_ids.contains(&tt.text_id) {
            return Err(AppError::Validation(format!(
                "text_tags references non-existent text_id: {}",
                tt.text_id
            )));
        }
        if !tag_ids.contains(&tt.tag_id) {
            return Err(AppError::Validation(format!(
                "text_tags references non-existent tag_id: {}",
                tt.tag_id
            )));
        }
    }

    let session_ids: std::collections::HashSet<i64> =
        payload.sessions.iter().map(|s| s.id).collect();
    if session_ids.len() != payload.sessions.len() {
        return Err(AppError::Validation(
            "Duplicate session IDs in export file".to_string(),
        ));
    }
    for s in &payload.sessions {
        if SessionKind::parse(&s.kind).is_none() {
            return Err(AppError::Validation(format!(
                "Unknown session kind \"{}\" for session id {}",
                s.kind, s.id
            )));
        }
    }

    for st in &payload.session_texts {
        if !session_ids.contains(&st.session_id) {
            return Err(AppError::Validation(format!(
                "session_texts references non-existent session_id: {}",
                st.session_id
            )));
        }
        if !text_ids.contains(&st.text_id) {
            return Err(AppError::Validation(format!(
                "session_texts references non-existent text_id: {}",
                st.text_id
            )));
        }
    }

    Ok(())
}

pub fn import_all(conn: &mut Connection, payload: ExportPayload) -> Result<ImportResult, AppError> {
    let text_count = payload.texts.len();
    let tag_count = payload.tags.len();

    let tx = conn.transaction()?;

    tx.execute_batch(
        "DELETE FROM session_texts; \
         DELETE FROM sessions; \
         DELETE FROM text_tags; \
         DELETE FROM tags; \
         DELETE FROM texts;",
    )?;

    for text in &payload.texts {
        tx.execute(
            "INSERT INTO texts (id, title, created_at, modified_at, raw_input, segments, locked) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![text.id, text.title, text.created_at, text.modified_at, text.raw_input, text.segments, text.locked],
        )?;
    }

    for tag in &payload.tags {
        tx.execute(
            "INSERT INTO tags (id, label, color) VALUES (?1, ?2, ?3)",
            rusqlite::params![tag.id, tag.label, tag.color],
        )?;
    }

    for tt in &payload.text_tags {
        tx.execute(
            "INSERT INTO text_tags (text_id, tag_id) VALUES (?1, ?2)",
            rusqlite::params![tt.text_id, tt.tag_id],
        )?;
    }

    for s in &payload.sessions {
        tx.execute(
            "INSERT INTO sessions (id, date, start_time, end_time, kind, done, notes, author, created_at, modified_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                s.id,
                s.date,
                s.start_time,
                s.end_time,
                s.kind,
                s.done,
                s.notes,
                s.author,
                s.created_at,
                s.modified_at,
            ],
        )?;
    }

    for st in &payload.session_texts {
        tx.execute(
            "INSERT INTO session_texts (session_id, text_id) VALUES (?1, ?2)",
            rusqlite::params![st.session_id, st.text_id],
        )?;
    }

    tx.commit()?;

    Ok(ImportResult {
        text_count,
        tag_count,
    })
}

pub fn reset_all(conn: &mut Connection) -> Result<(), AppError> {
    let tx = conn.transaction()?;
    tx.execute_batch(
        "DELETE FROM session_texts; \
         DELETE FROM sessions; \
         DELETE FROM text_tags; \
         DELETE FROM tags; \
         DELETE FROM texts;",
    )?;
    tx.commit()?;
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
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                date        TEXT    NOT NULL,
                start_time  TEXT    NOT NULL,
                end_time    TEXT    NOT NULL,
                kind        TEXT    NOT NULL,
                done        INTEGER NOT NULL DEFAULT 0,
                notes       TEXT,
                author      TEXT,
                created_at  TEXT    NOT NULL,
                modified_at TEXT
            );

            CREATE TABLE IF NOT EXISTS session_texts (
                session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                text_id    INTEGER NOT NULL REFERENCES texts(id)    ON DELETE CASCADE,
                PRIMARY KEY (session_id, text_id)
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
                    ..Default::default()
                },
            },
            TextSegment::Plain {
                text: "，".to_string(),
            },
            TextSegment::Word {
                word: Word {
                    characters: "世界".to_string(),
                    pinyin: "shìjiè".to_string(),
                    ..Default::default()
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
                    ..Default::default()
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
                ..Default::default()
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
                ..Default::default()
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
                word: Word { characters: "你".to_string(), pinyin: "nǐ".to_string(), comment: None, ..Default::default() },
            },
            TextSegment::Word {
                word: Word { characters: "好".to_string(), pinyin: "hǎo".to_string(), comment: None, ..Default::default() },
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
                word: Word { characters: long_chars.to_string(), pinyin: "test".to_string(), comment: None, ..Default::default() },
            },
            TextSegment::Word {
                word: Word { characters: short_chars.to_string(), pinyin: "test2".to_string(), comment: None, ..Default::default() },
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
                word: Word { characters: "好".to_string(), pinyin: "hǎo".to_string(), comment: None, ..Default::default() },
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
                word: Word { characters: "好".to_string(), pinyin: "hǎo".to_string(), comment: None, ..Default::default() },
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
                word: Word { characters: "好".to_string(), pinyin: "hǎo".to_string(), comment: None, ..Default::default() },
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

    // ── Session tests ──

    fn make_text(conn: &mut Connection, title: &str) -> i64 {
        let segments = sample_segments();
        insert_text(conn, title, "你好世界", &segments).unwrap().id
    }

    #[test]
    fn create_and_list_session_with_text_ids() {
        let mut conn = in_memory_db();
        let t1 = make_text(&mut conn, "Text 1");
        let t2 = make_text(&mut conn, "Text 2");

        let session = create_session(
            &mut conn,
            "2026-05-17",
            "14:00",
            "15:30",
            SessionKind::LiveLesson,
            false,
            Some("HSK4 vocab".to_string()),
            Some("Pierre".to_string()),
            &[t1, t2],
        )
        .unwrap();

        assert!(session.id > 0);
        assert_eq!(session.text_ids, vec![t1, t2]);
        assert_eq!(session.kind, SessionKind::LiveLesson);
        assert!(!session.done);
        assert!(session.modified_at.is_none());

        let listed = list_sessions_in_range(&conn, "2026-05-01", "2026-05-31").unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].id, session.id);
        assert_eq!(listed[0].text_ids, vec![t1, t2]);
    }

    #[test]
    fn list_sessions_in_range_filters_by_date() {
        let mut conn = in_memory_db();
        create_session(
            &mut conn, "2026-04-15", "10:00", "11:00",
            SessionKind::StudySession, false, None, None, &[],
        ).unwrap();
        create_session(
            &mut conn, "2026-05-15", "10:00", "11:00",
            SessionKind::StudySession, false, None, None, &[],
        ).unwrap();
        create_session(
            &mut conn, "2026-06-15", "10:00", "11:00",
            SessionKind::StudySession, false, None, None, &[],
        ).unwrap();

        let listed = list_sessions_in_range(&conn, "2026-05-01", "2026-05-31").unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].date, "2026-05-15");
    }

    #[test]
    fn update_session_preserves_author_and_created_at_replaces_text_ids() {
        let mut conn = in_memory_db();
        let t1 = make_text(&mut conn, "Text 1");
        let t2 = make_text(&mut conn, "Text 2");
        let t3 = make_text(&mut conn, "Text 3");

        let original = create_session(
            &mut conn, "2026-05-17", "14:00", "15:30",
            SessionKind::LiveLesson, false, None,
            Some("Pierre".to_string()), &[t1, t2],
        ).unwrap();

        let updated = update_session_db(
            &mut conn,
            original.id,
            "2026-05-18",
            "16:00",
            "17:00",
            SessionKind::StudySession,
            true,
            Some("notes".to_string()),
            &[t3],
        )
        .unwrap();

        assert_eq!(updated.id, original.id);
        assert_eq!(updated.author, Some("Pierre".to_string()));
        assert_eq!(updated.created_at, original.created_at);
        assert!(updated.modified_at.is_some());
        assert_eq!(updated.text_ids, vec![t3]);
        assert!(updated.done);
        assert_eq!(updated.kind, SessionKind::StudySession);
    }

    #[test]
    fn update_session_nonexistent_returns_error() {
        let mut conn = in_memory_db();
        let result = update_session_db(
            &mut conn, 999, "2026-05-17", "14:00", "15:00",
            SessionKind::LiveLesson, false, None, &[],
        );
        assert!(result.is_err());
    }

    #[test]
    fn delete_session_cascades_session_texts() {
        let mut conn = in_memory_db();
        let t1 = make_text(&mut conn, "Text 1");
        let session = create_session(
            &mut conn, "2026-05-17", "14:00", "15:00",
            SessionKind::LiveLesson, false, None, None, &[t1],
        ).unwrap();

        delete_session_db(&conn, session.id).unwrap();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM session_texts WHERE session_id = ?1",
                rusqlite::params![session.id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn delete_text_cascades_session_texts_but_keeps_sessions() {
        let mut conn = in_memory_db();
        let t1 = make_text(&mut conn, "Text 1");
        let session = create_session(
            &mut conn, "2026-05-17", "14:00", "15:00",
            SessionKind::LiveLesson, false, None, None, &[t1],
        ).unwrap();

        delete_text(&conn, t1).unwrap();

        let listed = list_sessions_in_range(&conn, "2026-05-01", "2026-05-31").unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].id, session.id);
        assert_eq!(listed[0].text_ids, Vec::<i64>::new());
    }

    #[test]
    fn create_session_validates_end_after_start() {
        let mut conn = in_memory_db();
        let result = create_session(
            &mut conn, "2026-05-17", "15:00", "14:00",
            SessionKind::LiveLesson, false, None, None, &[],
        );
        assert!(result.is_err(), "end <= start should be rejected");
    }

    #[test]
    fn create_session_validates_date_format() {
        let mut conn = in_memory_db();
        let result = create_session(
            &mut conn, "17/05/2026", "14:00", "15:00",
            SessionKind::LiveLesson, false, None, None, &[],
        );
        assert!(result.is_err());
    }

    #[test]
    fn create_session_rejects_unknown_text_id() {
        let mut conn = in_memory_db();
        let result = create_session(
            &mut conn, "2026-05-17", "14:00", "15:00",
            SessionKind::LiveLesson, false, None, None, &[9999],
        );
        assert!(result.is_err(), "FK constraint should fire on unknown text_id");
    }

    #[test]
    fn export_import_round_trip_with_sessions() {
        let mut conn = in_memory_db();
        let t1 = make_text(&mut conn, "Text 1");
        let _ = create_session(
            &mut conn, "2026-05-17", "14:00", "15:30",
            SessionKind::LiveLesson, true, Some("note".to_string()),
            Some("Pierre".to_string()), &[t1],
        ).unwrap();

        let payload = export_all(&conn).unwrap();
        assert_eq!(payload.sessions.len(), 1);
        assert_eq!(payload.session_texts.len(), 1);

        // Round-trip via JSON.
        let json = serde_json::to_string(&payload).unwrap();
        let parsed: ExportPayload = serde_json::from_str(&json).unwrap();

        let mut conn2 = in_memory_db();
        import_all(&mut conn2, parsed).unwrap();
        let listed = list_sessions_in_range(&conn2, "2026-05-01", "2026-05-31").unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].kind, SessionKind::LiveLesson);
        assert!(listed[0].done);
        assert_eq!(listed[0].notes, Some("note".to_string()));
        assert_eq!(listed[0].author, Some("Pierre".to_string()));
        assert_eq!(listed[0].text_ids, vec![t1]);
    }

    #[test]
    fn export_payload_back_compat_without_sessions_field() {
        let json = r#"{
            "version": 1,
            "exported_at": "2026-01-01T00:00:00",
            "texts": [],
            "tags": [],
            "text_tags": []
        }"#;
        let parsed: ExportPayload = serde_json::from_str(json).unwrap();
        assert!(parsed.sessions.is_empty());
        assert!(parsed.session_texts.is_empty());
    }

    #[test]
    fn validate_rejects_orphan_session_text() {
        let payload = ExportPayload {
            version: 1,
            exported_at: "2026-01-01".to_string(),
            texts: vec![],
            tags: vec![],
            text_tags: vec![],
            sessions: vec![],
            session_texts: vec![ExportSessionText { session_id: 1, text_id: 99 }],
            sync_author: None,
            sync_timestamp: None,
        };
        let result = validate_export_payload(&payload);
        assert!(result.is_err());
    }

    #[test]
    fn validate_rejects_unknown_session_kind() {
        let payload = ExportPayload {
            version: 1,
            exported_at: "2026-01-01".to_string(),
            texts: vec![],
            tags: vec![],
            text_tags: vec![],
            sessions: vec![ExportSession {
                id: 1, date: "2026-05-17".to_string(),
                start_time: "10:00".to_string(), end_time: "11:00".to_string(),
                kind: "bogus".to_string(), done: 0,
                notes: None, author: None,
                created_at: "2026-05-17T10:00:00".to_string(),
                modified_at: None,
            }],
            session_texts: vec![],
            sync_author: None,
            sync_timestamp: None,
        };
        let result = validate_export_payload(&payload);
        assert!(result.is_err());
    }
}
