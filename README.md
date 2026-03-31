# Hanzi Ruby Lens

A Windows desktop application for Mandarin Chinese learners, providing pinyin
ruby annotations for any Chinese text via native Rust text processing.

## Prerequisites

- **Node.js** and **npm**
- **Rust** toolchain (install via [rustup](https://rustup.rs/))

## Run Tests

```bash
npm test
```

Runs Vitest (frontend) and cargo test (Rust).

## Build Executable

```bash
npm run build
```

Compiles the frontend and builds the Tauri application. The resulting
installer appears in `src-tauri/target/release/bundle/nsis/`.

## Project Structure

```
src/                  React frontend (TypeScript)
src-tauri/            Rust backend (Tauri 2)
scripts/              Utility scripts
specs/                Feature specifications (Spec Kit)
```
