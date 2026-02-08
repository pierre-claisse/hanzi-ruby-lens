# Implementation Plan: Development Environment & Build Pipeline

**Branch**: `001-dev-build-pipeline` | **Date**: 2026-02-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-dev-build-pipeline/spec.md`

## Summary

Scaffold the Tauri 2 + React + TypeScript project with a fully
Dockerized testing and build pipeline using Windows Docker containers.
The app displays "Hanzi Ruby Lens" as a centered heading. All test and
build execution happens inside Windows containers
(`mcr.microsoft.com/windows/servercore:ltsc2022`) with VS Build Tools,
Rust, and Node.js. No development tooling is installed on the host
beyond Docker Desktop, NodeJS, and NPM.

## Technical Context

**Language/Version**: Rust (stable, latest) + TypeScript 5.x
**Primary Dependencies**: Tauri 2, React 18+, Vite 5+, Tailwind CSS 3+,
shadcn/ui
**Storage**: N/A (no data in this scaffolding feature)
**Testing**: Vitest + React Testing Library + happy-dom (frontend);
cargo test + tauri::test (Rust)
**Target Platform**: Windows (x86_64)
**Project Type**: Desktop application (Tauri: Rust backend + React
frontend)
**Performance Goals**: Tests complete < 2 min; build completes < 10 min
(cold), < 5 min (warm with Docker cache)
**Constraints**: All execution inside Windows Docker containers; host
has only Docker Desktop + Node + NPM
**Scale/Scope**: Single developer, single window, placeholder UI only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1
design.*

### Content-First Design Gate (Principle I)

- [x] Placeholder UI centers "Hanzi Ruby Lens" as the visual focus
- [x] Minimal chrome: no competing controls

### Offline-First Data Gate (Principle II)

- [x] N/A — No data operations in scaffolding feature

### DDD + CQRS Gate (Principle III)

- [x] N/A — No domain logic in scaffolding feature
- [x] Project structure prepared for future DDD organization

### Principled Simplicity Gate (Principle IV)

- [x] No speculative features
- [x] Minimal dependencies: only what Tauri 2 + React requires
- [x] No abstractions beyond framework conventions

### Test-First Imperative Gate (Principle V)

- [x] Test infrastructure runs entirely in Docker containers
- [x] Three test levels planned: unit, integration, contract
- [x] Placeholder tests prove infrastructure works

### Docker-Only Execution Gate (Principle VI)

- [x] All tests run inside Windows Docker containers
- [x] Full build pipeline runs inside Windows Docker containers
- [x] No dev tooling required on host beyond Docker Desktop + Node + NPM
- [x] No dev mode / hot-reload (no split architecture needed)

**All gates pass. No violations.**

## Project Structure

### Documentation (this feature)

```text
specs/001-dev-build-pipeline/
├── plan.md                    # This file
├── research.md                # Phase 0 research findings
├── quickstart.md              # Validation scenarios
├── checklists/
│   └── requirements.md        # Spec quality checklist
└── tasks.md                   # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/                     # Rust backend (Tauri convention)
├── src/
│   ├── main.rs                # Tauri entry point
│   └── lib.rs                 # Library root (testable exports)
├── Cargo.toml
├── tauri.conf.json            # Tauri configuration
├── build.rs                   # Tauri build script
└── icons/                     # Application icons

src/                           # React frontend
├── main.tsx                   # React entry point
├── App.tsx                    # Root component ("Hanzi Ruby Lens")
├── App.test.tsx               # Co-located component test
├── index.css                  # Tailwind imports
└── test/
    └── setup.ts               # Vitest global setup

docker/                        # Docker infrastructure
├── Dockerfile                 # Windows container: VS Build Tools +
│                              #   Rust + Node.js (single image for
│                              #   test and build)
├── docker-compose.test.yml    # Test orchestration
└── docker-compose.build.yml   # Build orchestration

package.json                   # Frontend dependencies + npm scripts
tsconfig.json                  # TypeScript configuration
vite.config.ts                 # Vite configuration
tailwind.config.ts             # Tailwind configuration
postcss.config.js              # PostCSS for Tailwind
components.json                # shadcn/ui configuration
vitest.config.ts               # Vitest configuration
```

**Structure Decision**: Tauri 2's conventional layout with `src-tauri/`
for Rust and `src/` for the React frontend. A single Docker image
contains the full toolchain (VS Build Tools + Rust + Node.js) to
simplify orchestration. Separate Docker Compose files for test vs build
workflows. Tests co-located with source files.

## Implementation Phases

### Phase 0: Project Initialization

1. Initialize Tauri 2 project with React + TypeScript template
2. Add Tailwind CSS and shadcn/ui
3. Configure Vite for production builds
4. Create `App.tsx` with centered "Hanzi Ruby Lens" heading
5. Apply minimal Tailwind styling

### Phase 1: Docker Infrastructure

1. Create `Dockerfile` — Windows servercore base with:
   - Visual Studio Build Tools 2022 (MSVC, Windows SDK, ATL)
   - Rust stable toolchain (x86_64-pc-windows-msvc)
   - Node.js LTS + NPM
   - NSIS for installer bundling
2. Optimize Docker layers for caching (toolchain layers first,
   source code last)
3. Create `docker-compose.test.yml` — Mounts source, runs tests
4. Create `docker-compose.build.yml` — Mounts source, outputs `.exe`
   to host filesystem via bind mount

### Phase 2: Test Infrastructure

1. Write placeholder frontend tests:
   - `App.test.tsx`: App renders "Hanzi Ruby Lens" heading
   - Vitest config with happy-dom environment
2. Write placeholder Rust tests:
   - `lib.rs`: trivial assertion proving cargo test works inside
     the container
3. Create `npm run test` script that invokes
   `docker compose -f docker/docker-compose.test.yml up --build`
4. Validate all tests pass inside containers

### Phase 3: Build Pipeline

1. Create `npm run build` script that invokes
   `docker compose -f docker/docker-compose.build.yml up --build`
2. Container runs `npm install && npm run build:frontend` then
   `cargo tauri build` to produce the `.exe`
3. Bind-mount output directory so `.exe` appears on host
4. Validate the resulting `.exe` launches and displays the heading

### Phase 4: Developer Experience

1. Add prerequisite checks to npm scripts (Docker Desktop running,
   Windows containers mode enabled)
2. Add clear error messages for missing prerequisites
3. Document the workflow in README

## Complexity Tracking

> **No violations. All Constitution Check gates pass.**

No entries needed.
