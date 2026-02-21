# hanzi-ruby-lens Development Guidelines

## Technology Stack

- **Frontend**: TypeScript 5.9, React 19, Vite 5, Tailwind CSS 3.4
- **Backend**: Rust (stable), Tauri 2
- **Database**: SQLite (rusqlite 0.38, bundled) — `%APPDATA%\com.hanzirubylens.app\hanzi-ruby-lens.db`
- **LLM**: Claude CLI (Opus) for pinyin segmentation
- **Testing**: Vitest + @testing-library/react (frontend), cargo test (Rust)
- **Key dependencies**: lucide-react, @fontsource/cactus-classical-serif, @fontsource/chocolate-classical-sans, @fontsource/lxgw-wenkai-tc, @fontsource-variable/chiron-hei-hk, @fontsource/huninn, chiron-sung-hk-webfont, @tauri-apps/plugin-opener, @tauri-apps/plugin-clipboard-manager

## Project Structure

```text
src/
├── App.tsx                    # Main component (views: empty → input → processing → reading)
├── main.tsx                   # React entry point (font imports)
├── index.css                  # Global styles, CSS variables, theme support
├── components/                # UI components (TextDisplay, RubyWord, TitleBar, etc.)
├── hooks/                     # React hooks (useTextLoader, useTheme, useTextZoom, etc.)
├── types/domain.ts            # Domain types: Text, Word, TextSegment
└── data/palettes.ts           # Color palette definitions

src-tauri/src/
├── lib.rs                     # Tauri entry point, plugin/command registration
├── commands.rs                # IPC commands: save_text, load_text, process_text
├── database.rs                # SQLite operations (initialize, save, load)
├── processing.rs              # Claude CLI integration (prompt building, response parsing)
├── domain.rs                  # Rust domain structs (mirrors TypeScript types)
├── error.rs                   # AppError type
├── state.rs                   # AppState (Mutex<db>)
└── main.rs                    # Delegates to lib.rs

tests/
├── contract/                  # Contract tests (localStorage, Tauri commands)
├── hooks/                     # Hook tests (useTextLoader)
├── integration/               # Integration tests (input → processing → reading flows)
└── unit/                      # Unit tests (CSS variables, navigation logic)
```

## Commands

```sh
npm test              # Run all tests in Docker (Vitest + cargo test)
npm run build         # Build Windows executable in Docker (output/)
npm run build:frontend  # Vite frontend build only
cargo test            # Rust tests only (inside Docker)
cargo clippy          # Rust linting (inside Docker)
```

All execution (dev, test, build) happens inside Docker containers — no local Rust/C++ toolchain required. Only Node.js and npm are needed on the host.

## Code Style

- Follow standard Rust and TypeScript conventions
- Domain language: **Text** (aggregate root = full Chinese content) and **Word** (segment = characters + pinyin)
- See `.specify/memory/constitution.md` for authoritative project principles

## Specification-Driven Development

Each feature lives in `specs/NNN-feature-name/` with:
- `spec.md` — Requirements (user stories, acceptance criteria)
- `plan.md` — Technical design (architecture, constitution check)
- `tasks.md` — Ordered implementation tasks
- `research.md` — Design decisions with alternatives considered
- `data-model.md` — Types and schema

Constitution at `.specify/memory/constitution.md` governs all decisions. Templates at `.specify/templates/`.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
