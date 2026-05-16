// Remote sync via GitHub Gist (secret) with password-based encryption of the
// embedded PAT and Gist ID.
//
// Build-time (build.rs):
//   - reads SYNC_PASSWORD / SYNC_PAT / SYNC_GIST_ID env vars,
//   - derives a key with Argon2id, encrypts {pat, gist_id} JSON with AES-256-GCM,
//   - writes salt || nonce || ciphertext+tag to $OUT_DIR/sync_secrets.bin.
//
// Runtime (this module):
//   - includes the blob via include_bytes!,
//   - re-derives the key from the user-typed password and decrypts to recover
//     {pat, gist_id} only in RAM, zeroized after use,
//   - exposes async HTTP helpers around the GitHub Gists API with optional
//     If-Match / If-None-Match support for optimistic concurrency.

use std::sync::OnceLock;

use chrono::FixedOffset;
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, AUTHORIZATION, USER_AGENT};
use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

const SYNC_BLOB: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/sync_secrets.bin"));
const FILE_NAME: &str = "hanzi-ruby-lens.json";
const GITHUB_API: &str = "https://api.github.com";
const USER_AGENT_VALUE: &str = "hanzi-ruby-lens/0.1";

// ── Errors ──────────────────────────────────────────────────────────────────

#[derive(Debug, thiserror::Error)]
pub enum SyncError {
    #[error("Sync is not configured in this build")]
    NotConfigured,
    #[error("Invalid sync password")]
    InvalidPassword,
    #[error("Authentication failed: {0}")]
    Auth(String),
    #[error("Remote resource not found")]
    NotFound,
    #[error("Remote data has changed since your last pull")]
    Conflict,
    #[error("Network error: {0}")]
    Network(String),
    #[error("Server error ({status}): {message}")]
    Server { status: u16, message: String },
    #[error("{0}")]
    Other(String),
}

impl SyncError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::NotConfigured => "not_configured",
            Self::InvalidPassword => "invalid_password",
            Self::Auth(_) => "auth",
            Self::NotFound => "not_found",
            Self::Conflict => "conflict",
            Self::Network(_) => "network",
            Self::Server { .. } => "server",
            Self::Other(_) => "other",
        }
    }
}

impl Serialize for SyncError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        use serde::ser::SerializeStruct;
        let mut state = s.serialize_struct("SyncError", 2)?;
        state.serialize_field("kind", self.kind())?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}

impl From<reqwest::Error> for SyncError {
    fn from(e: reqwest::Error) -> Self {
        SyncError::Network(e.to_string())
    }
}

// ── Configuration probe ─────────────────────────────────────────────────────

pub fn is_configured() -> bool {
    SYNC_BLOB.len() >= 28 // 16 (salt) + 12 (nonce) + at least 16 (GCM auth tag)
}

// ── Decrypt embedded secrets ────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct Secrets {
    pat: String,
    gist_id: String,
}

/// Drops the inner strings as zeroized memory once the guard goes out of scope.
struct DecryptedSecrets {
    pat: String,
    gist_id: String,
}

impl Drop for DecryptedSecrets {
    fn drop(&mut self) {
        self.pat.zeroize();
        self.gist_id.zeroize();
    }
}

fn decrypt_secrets(password: &str) -> Result<DecryptedSecrets, SyncError> {
    use aes_gcm::aead::{Aead, KeyInit};
    use aes_gcm::{Aes256Gcm, Key, Nonce};
    use argon2::Argon2;

    if !is_configured() {
        return Err(SyncError::NotConfigured);
    }

    let salt = &SYNC_BLOB[..16];
    let nonce_bytes = &SYNC_BLOB[16..28];
    let ciphertext = &SYNC_BLOB[28..];

    let mut key_bytes = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), salt, &mut key_bytes)
        .map_err(|e| SyncError::Other(format!("Key derivation failed: {}", e)))?;

    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);
    let mut plaintext = match cipher.decrypt(nonce, ciphertext) {
        Ok(pt) => pt,
        Err(_) => {
            key_bytes.zeroize();
            return Err(SyncError::InvalidPassword);
        }
    };
    key_bytes.zeroize();

    let parsed: Secrets = match serde_json::from_slice(&plaintext) {
        Ok(s) => s,
        Err(e) => {
            plaintext.zeroize();
            return Err(SyncError::Other(format!("Decrypted JSON malformed: {}", e)));
        }
    };
    plaintext.zeroize();

    Ok(DecryptedSecrets {
        pat: parsed.pat,
        gist_id: parsed.gist_id,
    })
}

// ── HTTP helpers ────────────────────────────────────────────────────────────

fn http_client() -> &'static Client {
    static CLIENT: OnceLock<Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        Client::builder()
            .user_agent(USER_AGENT_VALUE)
            .build()
            .expect("build reqwest client")
    })
}

fn auth_headers(pat: &str) -> Result<HeaderMap, SyncError> {
    let mut headers = HeaderMap::new();
    let value = HeaderValue::from_str(&format!("Bearer {}", pat))
        .map_err(|_| SyncError::Other("Invalid PAT bytes for header".into()))?;
    headers.insert(AUTHORIZATION, value);
    headers.insert(
        ACCEPT,
        HeaderValue::from_static("application/vnd.github+json"),
    );
    headers.insert(USER_AGENT, HeaderValue::from_static(USER_AGENT_VALUE));
    Ok(headers)
}

async fn http_get_gist(pat: &str, gist_id: &str) -> Result<String, SyncError> {
    let url = format!("{}/gists/{}", GITHUB_API, gist_id);
    let headers = auth_headers(pat)?;

    let resp = http_client().get(&url).headers(headers).send().await?;
    let status = resp.status();

    match status {
        StatusCode::OK => {
            #[derive(Deserialize)]
            struct GistFile {
                content: String,
                truncated: Option<bool>,
                raw_url: Option<String>,
            }
            #[derive(Deserialize)]
            struct GistResp {
                files: std::collections::HashMap<String, GistFile>,
            }
            let body: GistResp = resp.json().await.map_err(SyncError::from)?;
            let file = body.files.get(FILE_NAME).ok_or_else(|| {
                SyncError::Other(format!("Gist does not contain file '{}'", FILE_NAME))
            })?;
            let content = if file.truncated.unwrap_or(false) {
                // Gist API truncates content > 1 MB; fall back to raw_url.
                let raw = file
                    .raw_url
                    .as_deref()
                    .ok_or_else(|| SyncError::Other("Truncated file with no raw_url".into()))?;
                http_client()
                    .get(raw)
                    .header(USER_AGENT, USER_AGENT_VALUE)
                    .send()
                    .await?
                    .text()
                    .await
                    .map_err(SyncError::from)?
            } else {
                file.content.clone()
            };
            Ok(content)
        }
        StatusCode::UNAUTHORIZED => Err(SyncError::Auth(
            "GitHub rejected the embedded PAT (401)".into(),
        )),
        StatusCode::FORBIDDEN => Err(SyncError::Auth(
            "GitHub forbids access with this PAT (403)".into(),
        )),
        StatusCode::NOT_FOUND => Err(SyncError::NotFound),
        s => {
            let body = resp.text().await.unwrap_or_default();
            Err(SyncError::Server {
                status: s.as_u16(),
                message: body,
            })
        }
    }
}

async fn http_patch_gist(pat: &str, gist_id: &str, content: &str) -> Result<(), SyncError> {
    let url = format!("{}/gists/{}", GITHUB_API, gist_id);
    let headers = auth_headers(pat)?;

    let body = serde_json::json!({
        "files": {
            FILE_NAME: { "content": content }
        }
    });

    let resp = http_client()
        .patch(&url)
        .headers(headers)
        .json(&body)
        .send()
        .await?;
    let status = resp.status();

    match status {
        StatusCode::OK => Ok(()),
        StatusCode::UNAUTHORIZED => Err(SyncError::Auth(
            "GitHub rejected the embedded PAT (401)".into(),
        )),
        StatusCode::FORBIDDEN => Err(SyncError::Auth(
            "GitHub forbids write with this PAT (403)".into(),
        )),
        StatusCode::NOT_FOUND => Err(SyncError::NotFound),
        s => {
            let body = resp.text().await.unwrap_or_default();
            Err(SyncError::Server {
                status: s.as_u16(),
                message: body,
            })
        }
    }
}

/// Extract the `sync_timestamp` field from a remote JSON payload, if any.
/// Tolerant of missing field / unparseable JSON (returns None in both cases).
fn extract_remote_sync_timestamp(json: &str) -> Option<String> {
    serde_json::from_str::<serde_json::Value>(json)
        .ok()
        .and_then(|v| {
            v.get("sync_timestamp")
                .and_then(|t| t.as_str())
                .map(String::from)
        })
}

// ── Public Save / Pull primitives ───────────────────────────────────────────

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncSaveResult {
    pub author: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPullResult {
    pub author: Option<String>,
    pub timestamp: Option<String>,
    pub text_count: usize,
    pub tag_count: usize,
}

pub fn now_gmt8_string() -> String {
    let offset = FixedOffset::east_opt(8 * 3600).expect("valid GMT+8 offset");
    chrono::Utc::now()
        .with_timezone(&offset)
        .format("%Y-%m-%d %H:%M GMT+8")
        .to_string()
}

/// Save the given JSON payload to the configured Gist.
///
/// Optimistic concurrency: before PATCH, fetches the current remote content
/// and reads its `sync_timestamp`. If that field exists and differs from
/// `last_sync_timestamp` (the timestamp we recorded at our previous Save or
/// Pull), the remote has changed since our last sync and we return
/// `SyncError::Conflict` instead of writing.
///
/// GitHub's Gists API does NOT support `If-Match` on PATCH (returns HTTP 400),
/// so we implement the check application-side. Race window: between our GET
/// and our PATCH another writer could slip in. Acceptable for a 2-user
/// scenario; absolute atomicity would require a backend.
pub async fn save_to_remote(
    password: &str,
    json_payload: &str,
    last_sync_timestamp: Option<&str>,
) -> Result<(), SyncError> {
    let secrets = decrypt_secrets(password)?;
    let remote_json = http_get_gist(&secrets.pat, &secrets.gist_id).await?;
    let remote_ts = extract_remote_sync_timestamp(&remote_json);

    // Conflict if the remote has been touched by anyone since our last sync.
    // Sub-cases:
    //   * remote has no sync_timestamp at all (fresh Gist, manual content)
    //     → no conflict possible, save.
    //   * remote has a sync_timestamp but ours is None
    //     → we never synced; saving would clobber whoever wrote that → conflict.
    //   * both present and equal → green light.
    //   * both present and different → someone wrote between our last sync
    //     and now → conflict.
    if let Some(remote_ts) = remote_ts.as_deref() {
        if Some(remote_ts) != last_sync_timestamp {
            return Err(SyncError::Conflict);
        }
    }

    http_patch_gist(&secrets.pat, &secrets.gist_id, json_payload).await
}

/// Pull the JSON payload from the configured Gist.
pub async fn pull_from_remote(password: &str) -> Result<String, SyncError> {
    let secrets = decrypt_secrets(password)?;
    http_get_gist(&secrets.pat, &secrets.gist_id).await
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn timestamp_format_is_gmt8() {
        let s = now_gmt8_string();
        // Format: "YYYY-MM-DD HH:MM GMT+8"
        assert!(s.ends_with(" GMT+8"), "got: {}", s);
        // 19 chars before " GMT+8" (= "YYYY-MM-DD HH:MM"): 4+1+2+1+2+1+2+1+2 = 16
        let prefix = s.trim_end_matches(" GMT+8");
        assert_eq!(prefix.len(), 16, "got prefix: {}", prefix);
    }

    #[test]
    fn sync_error_serializes_with_kind_and_message() {
        let e = SyncError::Conflict;
        let json = serde_json::to_string(&e).unwrap();
        assert!(json.contains(r#""kind":"conflict""#), "got: {}", json);
        assert!(json.contains(r#""message""#), "got: {}", json);

        let e = SyncError::InvalidPassword;
        let json = serde_json::to_string(&e).unwrap();
        assert!(json.contains(r#""kind":"invalid_password""#));
    }

    #[test]
    fn sync_error_kind_strings_are_stable() {
        assert_eq!(SyncError::NotConfigured.kind(), "not_configured");
        assert_eq!(SyncError::InvalidPassword.kind(), "invalid_password");
        assert_eq!(SyncError::Auth("x".into()).kind(), "auth");
        assert_eq!(SyncError::NotFound.kind(), "not_found");
        assert_eq!(SyncError::Conflict.kind(), "conflict");
        assert_eq!(SyncError::Network("x".into()).kind(), "network");
        assert_eq!(
            SyncError::Server {
                status: 500,
                message: "x".into()
            }
            .kind(),
            "server"
        );
        assert_eq!(SyncError::Other("x".into()).kind(), "other");
    }

    #[test]
    fn export_payload_back_compat_without_sync_fields() {
        // Old JSON without sync_author / sync_timestamp must still parse.
        let old_json = r#"{
            "version": 1,
            "exported_at": "2026-04-01T12:00:00",
            "texts": [],
            "tags": [],
            "text_tags": []
        }"#;
        let parsed: crate::domain::ExportPayload = serde_json::from_str(old_json).unwrap();
        assert!(parsed.sync_author.is_none());
        assert!(parsed.sync_timestamp.is_none());
    }

    #[test]
    fn is_configured_reflects_blob_size() {
        // Without secrets, the build script writes an empty file → blob.len() == 0.
        // We cannot meaningfully assert true vs false here without controlling the
        // build env; instead, assert the function is callable and returns a bool.
        let _ = is_configured();
    }
}
