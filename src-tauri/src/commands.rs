use std::time::Duration;

use tauri::AppHandle;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;

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
pub async fn process_text(
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

    let prompt = processing::build_prompt(&raw_input);

    let run_cli = || async {
        let mut cmd = Command::new("claude");
        cmd.args([
            "-p",
            "--model",
            "sonnet",
            "--output-format",
            "json",
            "--max-turns",
            "1",
            "--no-session-persistence",
            "--tools",
            "",
            "--setting-sources",
            "",
            "--append-system-prompt",
            processing::SYSTEM_PROMPT,
        ]);
        cmd.current_dir(std::env::temp_dir());
        cmd.stdin(std::process::Stdio::piped());
        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::piped());

        #[cfg(target_os = "windows")]
        {
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }

        let mut child = cmd.spawn()?;
        if let Some(mut stdin) = child.stdin.take() {
            stdin.write_all(prompt.as_bytes()).await?;
            drop(stdin);
        }
        child.wait_with_output().await
    };

    let parse_output = |output: std::process::Output| -> Result<Vec<crate::domain::TextSegment>, AppError> {
        let stdout = String::from_utf8_lossy(&output.stdout);
        // CLI returns exit code 1 for API errors but still produces valid JSON
        // Check is_error field in the JSON envelope before checking exit code
        if let Ok(envelope) = serde_json::from_str::<serde_json::Value>(&stdout) {
            if envelope.get("is_error") == Some(&serde_json::Value::Bool(true)) {
                let msg = envelope.get("result").and_then(|v| v.as_str()).unwrap_or("Unknown error");
                return Err(AppError::Processing(msg.to_string()));
            }
        }
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::Processing(format!(
                "Processing failed (exit code: {}{})",
                output.status.code().unwrap_or(-1),
                if stderr.is_empty() { String::new() } else {
                    format!(", stderr: {}", stderr.chars().take(200).collect::<String>())
                }
            )));
        }
        processing::parse_claude_response(&stdout)
    };

    // First attempt
    let output = tokio::time::timeout(Duration::from_secs(600), run_cli())
        .await
        .map_err(|_| AppError::Processing("Processing timed out. Please try again.".to_string()))?
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                AppError::Processing(
                    "Claude CLI not found. Please install it and ensure it is in your PATH."
                        .to_string(),
                )
            } else {
                AppError::Processing(format!("Processing failed: {e}"))
            }
        })?;

    let segments = parse_output(output)?;

    let text = Text {
        raw_input,
        segments,
    };
    app_handle.db_mut(|conn| crate::database::save_text(conn, &text))?;

    Ok(text)
}
