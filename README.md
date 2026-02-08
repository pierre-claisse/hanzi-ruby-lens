# Hanzi Ruby Lens

A Windows desktop application for Mandarin Chinese learners, providing pinyin
ruby annotations for any Chinese text via LLM.

## Prerequisites

- **Docker Desktop** — installed and running in **Windows containers mode**
- **Node.js** and **npm**

No other development tools are required. The Rust toolchain, C++ compiler,
and all build dependencies run inside Docker containers.

> **First-time note**: The Docker image includes Visual Studio Build Tools,
> Rust, Node.js, and NSIS (~10–20 GB). The first build takes 15–30 minutes.
> Subsequent runs use cached layers and complete much faster.

## Run Tests

```bash
npm run test
```

Runs Vitest (frontend) and cargo test (Rust) inside a Windows Docker
container. Produces a unified pass/fail summary.

## Build Executable

```bash
npm run build
```

Compiles the frontend and builds the Tauri application inside a Windows Docker
container. The resulting `.exe` appears in the `output/` directory.

## Project Structure

```
src/                  React frontend (TypeScript)
src-tauri/            Rust backend (Tauri 2)
docker/               Dockerfile and compose files
scripts/              Build and test orchestration scripts
specs/                Feature specifications (Spec Kit)
```
