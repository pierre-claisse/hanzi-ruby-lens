use tauri::AppHandle;

use crate::domain::Text;
use crate::error::AppError;
use crate::state::ServiceAccess;

#[tauri::command]
pub fn save_text(app_handle: AppHandle, text: Text) -> Result<(), AppError> {
    app_handle.db_mut(|conn| crate::database::save_text(conn, &text))
}

#[tauri::command]
pub fn load_text(app_handle: AppHandle) -> Result<Option<Text>, AppError> {
    app_handle.db(|conn| crate::database::load_text(conn))
}
