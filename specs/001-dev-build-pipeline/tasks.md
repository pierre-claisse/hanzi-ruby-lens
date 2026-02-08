# Tasks: Development Environment & Build Pipeline

**Input**: Design documents from `/specs/001-dev-build-pipeline/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Included. The constitution mandates test-first (Principle V), and
the feature spec explicitly requires placeholder tests proving the
infrastructure works.

**Organization**: Tasks grouped by user story to enable independent
implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Project Scaffolding)

**Purpose**: Initialize Tauri 2 + React + TypeScript project structure with
all configuration files. No Docker, no tests — just the skeleton.

- [ ] T001 Create package.json with project dependencies (React 18+, TypeScript 5.x, Vite 5+, Tailwind CSS 3+, @tauri-apps/cli, @tauri-apps/api, Vitest, @testing-library/react, happy-dom) in package.json
- [ ] T002 [P] Configure TypeScript compiler options in tsconfig.json
- [ ] T003 [P] Configure Vite with React plugin in vite.config.ts
- [ ] T004 [P] Configure Tailwind CSS in tailwind.config.ts and postcss.config.js
- [ ] T005 [P] Configure shadcn/ui in components.json
- [ ] T006 [P] Create Tauri 2 project scaffolding: src-tauri/Cargo.toml, src-tauri/src/main.rs, src-tauri/tauri.conf.json, src-tauri/build.rs

---

## Phase 2: Foundational (Docker Infrastructure)

**Purpose**: Build the Windows Docker image that ALL test and build execution
depends on. This is the single blocking prerequisite for both user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 Create Windows Docker image definition in docker/Dockerfile (base: mcr.microsoft.com/windows/servercore:ltsc2022, layers: VS Build Tools 2022 with MSVC + Windows SDK + ATL, Rust stable x86_64-pc-windows-msvc, Node.js LTS + NPM, NSIS; optimize layer order for caching: toolchains first, source last)

**Checkpoint**: Docker image builds successfully. All tooling available inside
the container.

---

## Phase 3: User Story 1 — Run Automated Tests (Priority: P1) MVP

**Goal**: A single `npm run test` command executes all placeholder tests
(Vitest + cargo test) inside Windows Docker containers and produces a clear
pass/fail summary.

**Independent Test**: Run `npm run test` on a clean Windows host with only
Docker Desktop + Node + NPM. All tests pass inside containers. No test
tooling exists on the host.

### Tests for User Story 1

> **NOTE: Write test files FIRST (T009, T011), then the implementation they
> test (T010, T012). Tests should fail until implementation is created.**

- [ ] T008 [P] [US1] Configure Vitest with happy-dom environment in vitest.config.ts and create global test setup in src/test/setup.ts
- [ ] T009 [P] [US1] Write placeholder frontend test in src/App.test.tsx asserting the heading "Hanzi Ruby Lens" renders
- [ ] T010 [US1] Create React frontend: src/index.css (Tailwind directives), src/main.tsx (React entry point), src/App.tsx (centered "Hanzi Ruby Lens" heading with Tailwind styling)
- [ ] T011 [US1] Write placeholder Rust test in src-tauri/src/lib.rs (trivial assertion proving cargo test compiles and runs inside the container)
- [ ] T012 [US1] Ensure src-tauri/src/main.rs has the Tauri entry point that references lib.rs
- [ ] T013 [US1] Create test orchestration in docker/docker-compose.test.yml (bind-mount source into container, run Vitest then cargo test, produce unified pass/fail output, exit cleanly)
- [ ] T014 [US1] Add `npm run test` script to package.json that invokes `docker compose -f docker/docker-compose.test.yml up --build` and surfaces the exit code

**Checkpoint**: `npm run test` passes all placeholder tests inside Docker
containers. No Rust, cargo, or Vitest installed on the host.

---

## Phase 4: User Story 2 — Produce Distributable Application (Priority: P2)

**Goal**: A single `npm run build` command compiles the frontend assets and
runs `cargo tauri build` inside a Windows Docker container, producing a
standalone `.exe` on the host filesystem via bind mount.

**Independent Test**: Run `npm run build`, then launch the resulting `.exe` on
a Windows machine without development tools. The window displays "Hanzi Ruby
Lens" as a centered heading.

### Implementation for User Story 2

- [ ] T015 [US2] Configure Tauri window title ("Hanzi Ruby Lens"), bundle identifier, and NSIS installer settings in src-tauri/tauri.conf.json
- [ ] T016 [P] [US2] Add placeholder application icons in src-tauri/icons/ (32x32, 128x128, 256x256 PNGs and .ico required by Tauri bundler)
- [ ] T017 [US2] Create build orchestration in docker/docker-compose.build.yml (bind-mount source, run npm install + npm run build:frontend + cargo tauri build, bind-mount output directory so .exe appears on host)
- [ ] T018 [US2] Add `npm run build` and `npm run build:frontend` scripts to package.json (`build` invokes docker compose, `build:frontend` runs vite build inside the container)

**Checkpoint**: `npm run build` produces a `.exe` on the host. Launching it
displays "Hanzi Ruby Lens" as a centered heading.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Developer experience improvements that apply to both user stories.

- [ ] T019 [P] Add Docker Desktop prerequisite check to npm scripts with clear error message ("Docker Desktop is not running. Please start Docker Desktop and try again.")
- [ ] T020 [P] Add Windows containers mode check with actionable error message ("Docker Desktop is not in Windows containers mode. Right-click the Docker Desktop tray icon → Switch to Windows containers.")
- [ ] T021 Document development workflow in README.md (prerequisites, npm run test, npm run build, first-time setup expectations, image size warning)
- [ ] T022 Run all four quickstart.md validation scenarios end-to-end and verify all acceptance criteria pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (Dockerfile references project structure) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 (needs Docker image to run tests)
- **User Story 2 (Phase 4)**: Depends on Phase 2 (needs Docker image to build) and Phase 3 (needs App.tsx and Rust source created by US1)
- **Polish (Phase 5)**: Depends on Phases 3 and 4

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2). No dependency on US2.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2). Depends on US1 source files (App.tsx, main.rs, lib.rs) existing — these are the code being built.

### Within Each User Story

- Tests FIRST (T009/T011 before T010/T012)
- Source code before Docker Compose config
- Docker Compose before npm script wiring
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1**: T002, T003, T004, T005, T006 can all run in parallel after T001
**Phase 3**: T008 and T009 can run in parallel (different files)
**Phase 4**: T016 can run in parallel with T015 (icons vs config)
**Phase 5**: T019 and T020 can run in parallel (different checks)

---

## Parallel Example: User Story 1

```text
# After T001 completes, launch setup configs in parallel:
Task: "Configure TypeScript in tsconfig.json"                      # T002
Task: "Configure Vite in vite.config.ts"                           # T003
Task: "Configure Tailwind CSS in tailwind.config.ts"               # T004
Task: "Configure shadcn/ui in components.json"                     # T005
Task: "Create Tauri 2 scaffolding in src-tauri/"                   # T006

# After Phase 2, launch US1 test config in parallel:
Task: "Configure Vitest in vitest.config.ts"                       # T008
Task: "Write placeholder frontend test in src/App.test.tsx"        # T009
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (project scaffolding)
2. Complete Phase 2: Foundational (Docker image)
3. Complete Phase 3: User Story 1 (test pipeline)
4. **STOP and VALIDATE**: Run `npm run test` — all tests pass inside containers
5. This proves the Docker infrastructure and test toolchain work

### Incremental Delivery

1. Setup + Foundational → Skeleton ready
2. User Story 1 → `npm run test` works → MVP validated
3. User Story 2 → `npm run build` produces `.exe` → Full pipeline proven
4. Polish → Prerequisite checks, docs, final validation

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US1]/[US2] labels map tasks to spec.md user stories
- Constitution Principle V (Test-First): test files written before implementation source
- Constitution Principle VI (Docker-Only): all execution inside Windows containers
- Single Docker image strategy (VS Build Tools + Rust + Node.js) per research.md R1
- Image size: 10–20 GB estimated; acceptable for full toolchain replacement
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
