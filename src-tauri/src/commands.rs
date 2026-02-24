use tauri::AppHandle;

use crate::domain::{Tag, Text, TextPreviewWithTags};
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
pub fn delete_text(app_handle: AppHandle, text_id: i64) -> Result<(), AppError> {
    app_handle.db(|conn| crate::database::delete_text(conn, text_id))
}

#[tauri::command]
pub fn list_all_tags(app_handle: AppHandle) -> Result<Vec<Tag>, AppError> {
    app_handle.db(|conn| crate::database::list_tags(conn))
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
