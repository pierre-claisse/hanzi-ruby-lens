# hanzi-ruby-lens Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-08

## Active Technologies
- TypeScript 5.x (frontend), Rust stable (Tauri shell — no changes) + React 18, Tailwind CSS 3.x, @fontsource-variable/noto-sans-tc, @fontsource-variable/inter (002-ruby-text-display)
- N/A (hardcoded data, no persistence) (002-ruby-text-display)
- TypeScript 5.x (frontend), Rust stable (Tauri backend - no changes for this feature) + React 18, Tailwind CSS 3.x, @fontsource-variable/noto-sans-tc, @fontsource-variable/inter (003-ui-polish-theme-toggle)
- Browser localStorage for theme preference persistence (no SQLite involvement for this feature) (003-ui-polish-theme-toggle)
- TypeScript 5.x (frontend), Rust stable (Tauri backend - no changes) + React 18, Tailwind CSS 3.x, @testing-library/react, vitest (004-reading-experience-refinements)
- N/A (no data persistence changes) (004-reading-experience-refinements)
- TypeScript 5.x (frontend), Rust stable (Tauri backend) + React 18, Tauri 2, Tailwind CSS 3.x, lucide-react (icons - to be added) (005-frameless-window)
- Browser localStorage (fullscreen preference persistence only) (005-frameless-window)
- TypeScript 5.5 (frontend), Rust stable (Tauri backend - no changes) + React 18.3, Tailwind CSS 3.4, lucide-react 0.563, @tauri-apps/api 2.0 (006-pinyin-toggle)
- Browser localStorage for Pinyin visibility preference (boolean) (006-pinyin-toggle)
- TypeScript 5.5 (frontend), React 18.3 + Vitest (test runner), @testing-library/react (renderHook, act, waitFor), @tauri-apps/api 2.0 (window APIs to be mocked) (007-hook-tests)
- N/A (test-only feature, no data persistence changes) (007-hook-tests)

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
- 007-hook-tests: Added TypeScript 5.5 (frontend), React 18.3 + Vitest (test runner), @testing-library/react (renderHook, act, waitFor), @tauri-apps/api 2.0 (window APIs to be mocked)
- 006-pinyin-toggle: Added TypeScript 5.5 (frontend), Rust stable (Tauri backend - no changes) + React 18.3, Tailwind CSS 3.4, lucide-react 0.563, @tauri-apps/api 2.0
- 005-frameless-window: Added TypeScript 5.x (frontend), Rust stable (Tauri backend) + React 18, Tauri 2, Tailwind CSS 3.x, lucide-react (icons - to be added)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
