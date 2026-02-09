# hanzi-ruby-lens Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-08

## Active Technologies
- TypeScript 5.x (frontend), Rust stable (Tauri shell — no changes) + React 18, Tailwind CSS 3.x, @fontsource-variable/noto-sans-tc, @fontsource-variable/inter (002-ruby-text-display)
- N/A (hardcoded data, no persistence) (002-ruby-text-display)
- TypeScript 5.x (frontend), Rust stable (Tauri backend - no changes for this feature) + React 18, Tailwind CSS 3.x, @fontsource-variable/noto-sans-tc, @fontsource-variable/inter (003-ui-polish-theme-toggle)
- Browser localStorage for theme preference persistence (no SQLite involvement for this feature) (003-ui-polish-theme-toggle)

- Rust (stable, latest) + TypeScript 5.x + Tauri 2, React 18+, Vite 5+, Tailwind CSS 3+, (001-dev-build-pipeline)

## Project Structure

```text
src/
tests/
```

## Commands

cargo test; cargo clippy

## Code Style

Rust (stable, latest) + TypeScript 5.x: Follow standard conventions

## Recent Changes
- 003-ui-polish-theme-toggle: Added TypeScript 5.x (frontend), Rust stable (Tauri backend - no changes for this feature) + React 18, Tailwind CSS 3.x, @fontsource-variable/noto-sans-tc, @fontsource-variable/inter
- 002-ruby-text-display: Added TypeScript 5.x (frontend), Rust stable (Tauri shell — no changes) + React 18, Tailwind CSS 3.x, @fontsource-variable/noto-sans-tc, @fontsource-variable/inter

- 001-dev-build-pipeline: Added Rust (stable, latest) + TypeScript 5.x + Tauri 2, React 18+, Vite 5+, Tailwind CSS 3+,

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
