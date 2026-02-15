use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

pub struct AppState {
    pub db: Mutex<Option<Connection>>,
}

pub trait ServiceAccess {
    fn db<F, T>(&self, op: F) -> T
    where
        F: FnOnce(&Connection) -> T;

    fn db_mut<F, T>(&self, op: F) -> T
    where
        F: FnOnce(&mut Connection) -> T;
}

impl ServiceAccess for AppHandle {
    fn db<F, T>(&self, op: F) -> T
    where
        F: FnOnce(&Connection) -> T,
    {
        let state = self.state::<AppState>();
        let lock = state.db.lock().unwrap();
        let conn = lock.as_ref().expect("Database not initialized");
        op(conn)
    }

    fn db_mut<F, T>(&self, op: F) -> T
    where
        F: FnOnce(&mut Connection) -> T,
    {
        let state = self.state::<AppState>();
        let mut lock = state.db.lock().unwrap();
        let conn = lock.as_mut().expect("Database not initialized");
        op(conn)
    }
}
