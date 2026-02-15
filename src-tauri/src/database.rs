use std::path::PathBuf;

use rusqlite::Connection;

use crate::domain::Text;
use crate::error::AppError;

pub fn initialize(db_path: PathBuf) -> Result<Connection, AppError> {
    let conn = Connection::open(&db_path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS texts (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            raw_input TEXT NOT NULL DEFAULT '',
            segments TEXT NOT NULL DEFAULT '[]'
        );",
    )?;
    Ok(conn)
}

pub fn save_text(conn: &mut Connection, text: &Text) -> Result<(), AppError> {
    let segments_json = serde_json::to_string(&text.segments)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM texts", [])?;
    tx.execute(
        "INSERT INTO texts (id, raw_input, segments) VALUES (1, ?1, ?2)",
        rusqlite::params![text.raw_input, segments_json],
    )?;
    tx.commit()?;
    Ok(())
}

pub fn load_text(conn: &Connection) -> Result<Option<Text>, AppError> {
    let mut stmt = conn.prepare("SELECT raw_input, segments FROM texts WHERE id = 1")?;
    let mut rows = stmt.query([])?;
    match rows.next()? {
        Some(row) => {
            let raw_input: String = row.get(0)?;
            let segments_json: String = row.get(1)?;
            let segments = serde_json::from_str(&segments_json)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;
            Ok(Some(Text {
                raw_input,
                segments,
            }))
        }
        None => Ok(None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{TextSegment, Word};

    fn in_memory_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS texts (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                raw_input TEXT NOT NULL DEFAULT '',
                segments TEXT NOT NULL DEFAULT '[]'
            );",
        )
        .unwrap();
        conn
    }

    fn sample_text() -> Text {
        Text {
            raw_input: "你好世界".to_string(),
            segments: vec![
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
            ],
        }
    }

    // T012: test save/load round-trip with mixed Word+Plain segments
    #[test]
    fn save_load_round_trip() {
        let mut conn = in_memory_db();
        let text = sample_text();

        save_text(&mut conn, &text).unwrap();
        let loaded = load_text(&conn).unwrap().expect("should return Some");

        assert_eq!(loaded.raw_input, "你好世界");
        assert_eq!(loaded.segments.len(), 3);

        match &loaded.segments[0] {
            TextSegment::Word { word } => {
                assert_eq!(word.characters, "你好");
                assert_eq!(word.pinyin, "nǐhǎo");
            }
            _ => panic!("expected Word segment at index 0"),
        }
        match &loaded.segments[1] {
            TextSegment::Plain { text } => assert_eq!(text, "，"),
            _ => panic!("expected Plain segment at index 1"),
        }
        match &loaded.segments[2] {
            TextSegment::Word { word } => {
                assert_eq!(word.characters, "世界");
                assert_eq!(word.pinyin, "shìjiè");
            }
            _ => panic!("expected Word segment at index 2"),
        }
    }

    // T012: test load on empty DB returns None
    #[test]
    fn load_empty_db_returns_none() {
        let conn = in_memory_db();
        let result = load_text(&conn).unwrap();
        assert!(result.is_none());
    }

    // T012: test initialize creates schema
    #[test]
    fn initialize_creates_schema() {
        let dir = tempfile::tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let conn = initialize(db_path).unwrap();

        // Verify the texts table exists by querying it
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM texts", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    // T012: test opening a non-SQLite file returns error (FR-010)
    #[test]
    fn corrupted_db_returns_error() {
        let dir = tempfile::tempdir().unwrap();
        let db_path = dir.path().join("corrupted.db");
        std::fs::write(&db_path, b"this is not a sqlite file").unwrap();

        let result = initialize(db_path);
        assert!(result.is_err(), "should return error for corrupted DB file");
    }

    // T019 (US2): save Text A, save Text B, load returns only Text B
    #[test]
    fn save_replaces_previous() {
        let mut conn = in_memory_db();

        let text_a = Text {
            raw_input: "文本A".to_string(),
            segments: vec![TextSegment::Word {
                word: Word {
                    characters: "文本".to_string(),
                    pinyin: "wénběn".to_string(),
                },
            }],
        };

        let text_b = Text {
            raw_input: "文本B".to_string(),
            segments: vec![TextSegment::Plain {
                text: "plain B".to_string(),
            }],
        };

        save_text(&mut conn, &text_a).unwrap();
        save_text(&mut conn, &text_b).unwrap();

        let loaded = load_text(&conn).unwrap().expect("should return Some");
        assert_eq!(loaded.raw_input, "文本B");
        assert_eq!(loaded.segments.len(), 1);
        match &loaded.segments[0] {
            TextSegment::Plain { text } => assert_eq!(text, "plain B"),
            _ => panic!("expected Plain segment"),
        }
    }

    // T020 (US2): save empty Text, load returns Some(Text) with empty segments
    #[test]
    fn save_empty_text() {
        let mut conn = in_memory_db();

        let empty_text = Text {
            raw_input: "".to_string(),
            segments: vec![],
        };

        save_text(&mut conn, &empty_text).unwrap();
        let loaded = load_text(&conn).unwrap().expect("should return Some");
        assert_eq!(loaded.raw_input, "");
        assert!(loaded.segments.is_empty());
    }

    // T021 (US3): verify file exists at expected path after initialize + save
    #[test]
    fn db_file_exists_after_save() {
        let dir = tempfile::tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let mut conn = initialize(db_path.clone()).unwrap();

        let text = sample_text();
        save_text(&mut conn, &text).unwrap();

        assert!(db_path.exists(), "database file should exist at the expected path");
    }

    // T022 (US3): open saved DB with fresh connection, verify data readable
    #[test]
    fn db_readable_by_external_connection() {
        let dir = tempfile::tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let mut conn = initialize(db_path.clone()).unwrap();

        let text = sample_text();
        save_text(&mut conn, &text).unwrap();
        drop(conn);

        // Open with a fresh connection (simulating external tool)
        let external_conn = Connection::open(&db_path).unwrap();
        let raw_input: String = external_conn
            .query_row("SELECT raw_input FROM texts WHERE id = 1", [], |row| row.get(0))
            .unwrap();
        assert_eq!(raw_input, "你好世界");

        let segments_json: String = external_conn
            .query_row("SELECT segments FROM texts WHERE id = 1", [], |row| row.get(0))
            .unwrap();
        assert!(!segments_json.is_empty());
        assert!(segments_json.contains("nǐhǎo"));
    }
}
