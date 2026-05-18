use tauri::AppHandle;

use crate::domain::{
    ExportPayload, ExportResult, ImportResult, Session, SessionKind, Tag, Text,
    TextPreviewWithTags,
};
use crate::error::AppError;
use crate::processing;
use crate::state::ServiceAccess;

#[tauri::command]
pub fn create_text(
    app_handle: AppHandle,
    title: String,
    raw_input: String,
) -> Result<Text, AppError> {
    if title.trim().is_empty() {
        return Err(AppError::Validation("Title must not be empty".to_string()));
    }

    if !raw_input.chars().any(processing::is_chinese_char) {
        return Err(AppError::Validation(
            "Content must contain at least one Chinese character".to_string(),
        ));
    }

    let segments = processing::process_text_native(&raw_input);

    app_handle.db_mut(|conn| crate::database::insert_text(conn, &title, &raw_input, &segments))
}

#[tauri::command]
pub fn list_texts(
    app_handle: AppHandle,
    tag_ids: Vec<i64>,
    sort_asc: bool,
) -> Result<Vec<TextPreviewWithTags>, AppError> {
    app_handle.db(|conn| crate::database::list_all_texts(conn, &tag_ids, sort_asc))
}

#[tauri::command]
pub fn load_text(app_handle: AppHandle, text_id: i64) -> Result<Option<Text>, AppError> {
    app_handle.db(|conn| crate::database::load_text_by_id(conn, text_id))
}

#[tauri::command]
pub fn update_pinyin(
    app_handle: AppHandle,
    text_id: i64,
    segment_index: usize,
    new_pinyin: String,
) -> Result<(), AppError> {
    if new_pinyin.trim().is_empty() {
        return Err(AppError::Validation(
            "Pinyin must not be empty".to_string(),
        ));
    }

    app_handle.db_mut(|conn| {
        crate::database::update_segments(conn, text_id, segment_index, &new_pinyin)
    })
}

#[tauri::command]
pub fn split_segment(
    app_handle: AppHandle,
    text_id: i64,
    segment_index: usize,
    split_after_char_index: usize,
) -> Result<(), AppError> {
    app_handle.db_mut(|conn| {
        crate::database::split_segment_db(conn, text_id, segment_index, split_after_char_index)
    })
}

#[tauri::command]
pub fn merge_segments(
    app_handle: AppHandle,
    text_id: i64,
    segment_index: usize,
) -> Result<(), AppError> {
    app_handle.db_mut(|conn| {
        crate::database::merge_segments_db(conn, text_id, segment_index)
    })
}

#[tauri::command]
pub fn update_word_comment(
    app_handle: AppHandle,
    text_id: i64,
    segment_index: usize,
    comment: Option<String>,
    author: Option<String>,
) -> Result<(), AppError> {
    app_handle.db_mut(|conn| {
        crate::database::update_word_comment_db(conn, text_id, segment_index, comment, author)
    })
}

#[tauri::command]
pub fn toggle_lock(app_handle: AppHandle, text_id: i64) -> Result<bool, AppError> {
    app_handle.db(|conn| crate::database::toggle_lock_db(conn, text_id))
}

#[tauri::command]
pub fn delete_text(app_handle: AppHandle, text_id: i64) -> Result<(), AppError> {
    app_handle.db(|conn| crate::database::delete_text(conn, text_id))
}

#[tauri::command]
pub fn list_all_tags(app_handle: AppHandle) -> Result<Vec<Tag>, AppError> {
    app_handle.db(crate::database::list_tags)
}

#[tauri::command]
pub fn create_tag(app_handle: AppHandle, label: String, color: String) -> Result<Tag, AppError> {
    app_handle.db(|conn| crate::database::create_tag(conn, &label, &color))
}

#[tauri::command]
pub fn update_tag(
    app_handle: AppHandle,
    tag_id: i64,
    label: String,
    color: String,
) -> Result<Tag, AppError> {
    app_handle.db(|conn| crate::database::update_tag(conn, tag_id, &label, &color))
}

#[tauri::command]
pub fn delete_tag(app_handle: AppHandle, tag_id: i64) -> Result<(), AppError> {
    app_handle.db(|conn| crate::database::delete_tag(conn, tag_id))
}

#[tauri::command]
pub fn assign_tag(
    app_handle: AppHandle,
    text_ids: Vec<i64>,
    tag_id: i64,
) -> Result<(), AppError> {
    app_handle.db(|conn| crate::database::assign_tag(conn, &text_ids, tag_id))
}

#[tauri::command]
pub fn remove_tag(
    app_handle: AppHandle,
    text_ids: Vec<i64>,
    tag_id: i64,
) -> Result<(), AppError> {
    app_handle.db(|conn| crate::database::remove_tag(conn, &text_ids, tag_id))
}

// ── Data management commands ──

#[tauri::command]
pub fn export_database(app_handle: AppHandle, file_path: String) -> Result<ExportResult, AppError> {
    let payload = app_handle.db(crate::database::export_all)?;
    let text_count = payload.texts.len();
    let tag_count = payload.tags.len();
    let json = serde_json::to_string_pretty(&payload)
        .map_err(|e| AppError::Validation(format!("Failed to serialize export data: {}", e)))?;
    std::fs::write(&file_path, json)?;
    Ok(ExportResult {
        text_count,
        tag_count,
    })
}

#[tauri::command]
pub fn import_database(
    app_handle: AppHandle,
    file_path: String,
) -> Result<ImportResult, AppError> {
    let contents = std::fs::read_to_string(&file_path)?;
    let payload: ExportPayload = serde_json::from_str(&contents)
        .map_err(|e| AppError::Validation(format!("Invalid export file format: {}", e)))?;
    crate::database::validate_export_payload(&payload)?;
    app_handle.db_mut(|conn| crate::database::import_all(conn, payload))
}

#[tauri::command]
pub fn reset_database(app_handle: AppHandle) -> Result<(), AppError> {
    app_handle.db_mut(crate::database::reset_all)
}

fn check_device_authorization(
    current_id: Result<String, impl std::fmt::Debug>,
    authorized_id: Option<&str>,
) -> bool {
    let authorized_id = match authorized_id {
        Some(id) => id,
        None => return false,
    };
    match current_id {
        Ok(id) => id == authorized_id,
        Err(_) => false,
    }
}

// ── Session commands ──

fn parse_kind(kind: &str) -> Result<SessionKind, AppError> {
    SessionKind::parse(kind)
        .ok_or_else(|| AppError::Validation(format!("Unknown session kind: {}", kind)))
}

#[tauri::command]
pub fn list_sessions(
    app_handle: AppHandle,
    from: String,
    to: String,
) -> Result<Vec<Session>, AppError> {
    app_handle.db(|conn| crate::database::list_sessions_in_range(conn, &from, &to))
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
pub fn create_session(
    app_handle: AppHandle,
    date: String,
    start_time: String,
    end_time: String,
    kind: String,
    done: bool,
    notes: Option<String>,
    author: Option<String>,
    text_ids: Vec<i64>,
) -> Result<Session, AppError> {
    let kind = parse_kind(&kind)?;
    app_handle.db_mut(|conn| {
        crate::database::create_session(
            conn, &date, &start_time, &end_time, kind, done, notes, author, &text_ids,
        )
    })
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
pub fn update_session(
    app_handle: AppHandle,
    session_id: i64,
    date: String,
    start_time: String,
    end_time: String,
    kind: String,
    done: bool,
    notes: Option<String>,
    text_ids: Vec<i64>,
) -> Result<Session, AppError> {
    let kind = parse_kind(&kind)?;
    app_handle.db_mut(|conn| {
        crate::database::update_session_db(
            conn,
            session_id,
            &date,
            &start_time,
            &end_time,
            kind,
            done,
            notes,
            &text_ids,
        )
    })
}

#[tauri::command]
pub fn delete_session(app_handle: AppHandle, session_id: i64) -> Result<(), AppError> {
    app_handle.db(|conn| crate::database::delete_session_db(conn, session_id))
}

#[tauri::command]
pub fn is_authorized_device() -> bool {
    check_device_authorization(
        machine_uid::get(),
        option_env!("AUTHORIZED_MACHINE_ID"),
    )
}

// ── Remote sync (GitHub Gist) commands ──

#[tauri::command]
pub fn sync_is_configured() -> bool {
    crate::sync::is_configured()
}

#[tauri::command]
pub async fn sync_save(
    app_handle: AppHandle,
    password: String,
    author: String,
    last_sync_timestamp: Option<String>,
) -> Result<crate::sync::SyncSaveResult, crate::sync::SyncError> {
    let mut payload = app_handle
        .db(crate::database::export_all)
        .map_err(|e| crate::sync::SyncError::Other(e.to_string()))?;

    let timestamp = crate::sync::now_utc_iso();
    payload.sync_author = Some(author.clone());
    payload.sync_timestamp = Some(timestamp.clone());

    let json = serde_json::to_string(&payload).map_err(|e| {
        crate::sync::SyncError::Other(format!("Failed to serialize payload: {}", e))
    })?;

    crate::sync::save_to_remote(&password, &json, last_sync_timestamp.as_deref()).await?;

    Ok(crate::sync::SyncSaveResult { author, timestamp })
}

#[tauri::command]
pub async fn sync_pull(
    app_handle: AppHandle,
    password: String,
) -> Result<crate::sync::SyncPullResult, crate::sync::SyncError> {
    let content = crate::sync::pull_from_remote(&password).await?;

    let payload: ExportPayload = serde_json::from_str(&content).map_err(|e| {
        crate::sync::SyncError::Other(format!("Invalid remote payload: {}", e))
    })?;

    crate::database::validate_export_payload(&payload)
        .map_err(|e| crate::sync::SyncError::Other(e.to_string()))?;

    let author = payload.sync_author.clone();
    let timestamp = payload.sync_timestamp.clone();

    let imported = app_handle
        .db_mut(|conn| crate::database::import_all(conn, payload))
        .map_err(|e| crate::sync::SyncError::Other(e.to_string()))?;

    Ok(crate::sync::SyncPullResult {
        author,
        timestamp,
        text_count: imported.text_count,
        tag_count: imported.tag_count,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn authorized_when_ids_match() {
        assert!(check_device_authorization(Ok::<_, &str>("abc-123".to_string()), Some("abc-123")));
    }

    #[test]
    fn unauthorized_when_ids_differ() {
        assert!(!check_device_authorization(Ok::<_, &str>("abc-123".to_string()), Some("xyz-789")));
    }

    #[test]
    fn unauthorized_when_env_var_not_set() {
        assert!(!check_device_authorization(Ok::<_, &str>("abc-123".to_string()), None));
    }

    #[test]
    fn unauthorized_when_machine_uid_fails() {
        let err: Result<String, &str> = Err("registry error");
        assert!(!check_device_authorization(err, Some("abc-123")));
    }
}
