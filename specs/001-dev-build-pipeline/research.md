# Research: Development Environment & Build Pipeline

**Feature**: `001-dev-build-pipeline`
**Date**: 2026-02-08

## R1: Tauri 2 Build Strategies from Docker

### Decision

**Windows Docker containers** with the full Windows SDK, Visual Studio
Build Tools, Rust toolchain, and NSIS/WiX for bundling. All test and
build execution happens inside these containers.

### Rationale

Pierre's decision: the development machine will always run Windows, so
the cross-platform reproducibility trade-off is acceptable.
Containerization serves two purposes here:
1. **Isolation**: No dev tooling clutters the host machine
2. **Reproducibility across Windows machines**: Any Windows host with
   Docker Desktop produces identical results

### Approaches Evaluated

| Approach | Viability | Chosen? |
|----------|-----------|---------|
| Linux Docker + cargo-xwin | Produces raw `.exe` only; cannot run Tauri bundler (NSIS/WiX) | No |
| Linux Docker + cross-rs | Only `-gnu` target; incompatible with WebView2 COM bindings | No |
| Windows Docker (servercore) | Full native build; MSVC, NSIS, WiX all work natively | **Yes** |
| GitHub Actions windows-latest | Works for CI/CD; not for local builds | Complementary |
| Native host build | Works but clutters host with Rust, MSVC, etc. | No (violates constitution) |

### Windows Docker Container Details

**Base image**: `mcr.microsoft.com/windows/servercore:ltsc2022`

**Required tooling inside the container**:
- Visual Studio Build Tools 2022 (MSVC compiler, Windows SDK, ATL)
- Rust stable toolchain (`x86_64-pc-windows-msvc` target)
- Node.js LTS + NPM
- NSIS (for `.exe` installer bundling)
- WiX Toolset (for `.msi` installer bundling, optional)

**Image size**: Estimated 10–20 GB. This is large but acceptable for
a build toolchain that replaces all local installation.

**Caching strategy**: Use Docker layer caching aggressively:
1. Base image + VS Build Tools (changes rarely)
2. Rust toolchain (changes on Rust updates)
3. Node.js + NPM dependencies (changes on package.json)
4. Source code (changes every build)

**Volume strategy**: Mount the source directory as a bind mount into
the Windows container. The build output directory is also bind-mounted
so the `.exe` appears on the host filesystem.

### Rust Cross-Compilation Target

The correct target is `x86_64-pc-windows-msvc` (not `-gnu`). The
`webview2-com-sys` crate requires MSVC-compatible COM interop headers
and libraries. Inside a Windows Docker container with VS Build Tools,
this is natively available — no cross-compilation needed.

---

## R2: Testing Tauri 2 + React in Docker

### Decision

**Three-layer headless testing strategy**, all running inside Windows
Docker containers.

### Test Layers

**Layer 1 — Rust tests (`cargo test`)**

Tauri 2 ships `tauri::test` with `mock_builder()`, `mock_context()`,
and `MockRuntime`. Creates a Tauri app in memory without opening a
window. Inside a Windows container with VS Build Tools, all native
dependencies are available for compilation and linking.

**Layer 2 — React tests (Vitest + React Testing Library)**

Vitest with `happy-dom` environment runs entirely in Node.js. Tauri 2
provides `@tauri-apps/api/mocks` with `mockIPC()` to intercept
`invoke()` calls. Docker image needs only Node.js.

**Layer 3 — Contract tests**

Frontend tests assert `invoke()` calls with correct command names and
argument shapes. Rust tests assert command handlers accept those
arguments and return expected types. Together they guarantee IPC
interface consistency.

### What Does NOT Work in Docker

Full E2E tests (launching the actual Tauri window via `tauri-driver` +
WebDriver) require a display server. Not needed for this scaffolding
feature; can be evaluated later if required.

### Recommended Frameworks

| Concern | Tool | Reason |
|---------|------|--------|
| Rust test runner | `cargo test` | Standard |
| Rust Tauri mocking | `tauri::test` | Official, built-in |
| Frontend test runner | Vitest | Native Vite integration |
| Component testing | React Testing Library | DOM-centric, standard |
| IPC mocking | `@tauri-apps/api/mocks` | Official Tauri 2 utilities |
| Virtual DOM | `happy-dom` | Faster than jsdom |

### Docker Architecture

Two containers via Docker Compose:

1. **Rust test container**: Windows servercore + VS Build Tools + Rust.
   Runs `cargo test` in `src-tauri/`. No display server.
2. **Frontend test container**: Windows servercore + Node.js. Runs
   `npx vitest run`. No system dependencies beyond Node.

Alternatively, a single Windows container with both Rust and Node.js
installed to simplify orchestration (the build image already has both).

Single host command:
```
npm run test
```
Which invokes Docker Compose under the hood.

---

## R3: Dev Mode Decision

### Decision

**Dev mode with hot-reload is out of scope.** The developer edits code
in their IDE and uses `npm run test` and `npm run build` to validate.

### Rationale

Pierre's decision: hot-reload development adds complexity (split
architecture, Vite polling, volume mount performance) without
sufficient benefit. The test-and-build workflow is sufficient for
iterative development.

This eliminates:
- Split architecture (Vite in Docker + Tauri on host)
- Volume mount file-watching configuration
- The only Principle VI violation (Tauri dev mode on host)

---

## R4: Constitutional Impact

### Assessment

With Windows Docker containers and no dev mode, **all constitutional
principles are satisfied without amendment**:

| Principle | Status |
|-----------|--------|
| I. Content-First Design | N/A (placeholder UI) |
| II. Offline-First Data | N/A (no data) |
| III. DDD + CQRS | N/A (no domain logic) |
| IV. Principled Simplicity | Satisfied (minimal scope) |
| V. Test-First Imperative | Satisfied (all tests in Docker) |
| VI. Docker-Only Execution | **Satisfied** (Windows Docker containers) |

No constitutional amendment is required.
