use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    tauri_build::build();

    println!("cargo:rerun-if-env-changed=SYNC_PASSWORD");
    println!("cargo:rerun-if-env-changed=SYNC_PAT");
    println!("cargo:rerun-if-env-changed=SYNC_GIST_ID");

    let out_dir = PathBuf::from(env::var("OUT_DIR").expect("OUT_DIR"));
    let out_path = out_dir.join("sync_secrets.bin");

    let password = env::var("SYNC_PASSWORD").ok().filter(|s| !s.is_empty());
    let pat = env::var("SYNC_PAT").ok().filter(|s| !s.is_empty());
    let gist_id = env::var("SYNC_GIST_ID").ok().filter(|s| !s.is_empty());

    match (password, pat, gist_id) {
        (Some(pwd), Some(pat), Some(gid)) => {
            let blob = encrypt_secrets(&pwd, &pat, &gid);
            fs::write(&out_path, blob).expect("write sync_secrets.bin");
        }
        _ => {
            // Sentinel: empty file means "sync not configured" at runtime.
            fs::write(&out_path, &[] as &[u8]).expect("write empty sync_secrets.bin");
        }
    }
}

fn encrypt_secrets(password: &str, pat: &str, gist_id: &str) -> Vec<u8> {
    use aes_gcm::aead::{Aead, KeyInit};
    use aes_gcm::{Aes256Gcm, Key, Nonce};
    use argon2::Argon2;
    use rand::RngCore;

    let plaintext = serde_json::to_vec(&serde_json::json!({
        "pat": pat,
        "gist_id": gist_id,
    }))
    .expect("serialize secrets");

    let mut salt = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut salt);
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);

    let mut key_bytes = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), &salt, &mut key_bytes)
        .expect("argon2 derivation");

    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ct = cipher
        .encrypt(nonce, plaintext.as_ref())
        .expect("aes-gcm encrypt");

    let mut blob = Vec::with_capacity(16 + 12 + ct.len());
    blob.extend_from_slice(&salt);
    blob.extend_from_slice(&nonce_bytes);
    blob.extend_from_slice(&ct);
    blob
}
