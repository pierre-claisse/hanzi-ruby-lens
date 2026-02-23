use tauri::AppHandle;

use crate::domain::{Text, TextPreview};
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
pub fn list_texts(app_handle: AppHandle) -> Result<Vec<TextPreview>, AppError> {
    app_handle.db(|conn| crate::database::list_all_texts(conn))
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
pub fn delete_text(app_handle: AppHandle, text_id: i64) -> Result<(), AppError> {
    app_handle.db(|conn| crate::database::delete_text(conn, text_id))
}
