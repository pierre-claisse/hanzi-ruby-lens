mod commands;
mod database;
mod domain;
mod error;
mod state;

use std::sync::Mutex;

use state::AppState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(AppState {
            db: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            commands::save_text,
            commands::load_text,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            let app_data_dir = handle.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let db_path = app_data_dir.join("hanzi-ruby-lens.db");
            let conn = database::initialize(db_path)?;
            *handle.state::<AppState>().db.lock().unwrap() = Some(conn);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    #[test]
    fn placeholder_rust_test() {
        assert_eq!(2 + 2, 4, "basic arithmetic works inside the container");
    }
}
