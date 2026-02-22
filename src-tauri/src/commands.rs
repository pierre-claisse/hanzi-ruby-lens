use tauri::AppHandle;

use crate::domain::Text;
use crate::error::AppError;
use crate::processing;
use crate::state::ServiceAccess;

#[tauri::command]
pub fn save_text(app_handle: AppHandle, text: Text) -> Result<(), AppError> {
    app_handle.db_mut(|conn| crate::database::save_text(conn, &text))
}

#[tauri::command]
pub fn load_text(app_handle: AppHandle) -> Result<Option<Text>, AppError> {
    app_handle.db(|conn| crate::database::load_text(conn))
}

#[tauri::command]
pub fn process_text(
    app_handle: AppHandle,
    raw_input: String,
) -> Result<Text, AppError> {
    if raw_input.is_empty() {
        let text = Text {
            raw_input: String::new(),
            segments: vec![],
        };
        app_handle.db_mut(|conn| crate::database::save_text(conn, &text))?;
        return Ok(text);
    }

    let segments = processing::process_text_native(&raw_input);

    let text = Text {
        raw_input,
        segments,
    };
    app_handle.db_mut(|conn| crate::database::save_text(conn, &text))?;

    Ok(text)
}
