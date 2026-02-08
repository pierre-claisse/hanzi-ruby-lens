pub fn run() {
    tauri::Builder::default()
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
