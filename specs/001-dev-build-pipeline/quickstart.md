# Quickstart: Development Environment & Build Pipeline

**Feature**: `001-dev-build-pipeline`
**Prerequisites**: Docker Desktop installed and running in **Windows
containers mode**, Node.js + NPM installed.

## Scenario 1: Run Tests

```bash
npm run test
```

**Expected result**:
1. Docker builds (or reuses) the Windows container image with
   VS Build Tools, Rust, and Node.js
2. Frontend tests (Vitest) and Rust tests (cargo test) execute
   inside the container
3. Console shows a unified pass/fail summary

**Validation**:
- [ ] All placeholder tests pass
- [ ] Output clearly shows pass/fail for each test
- [ ] No test tooling (Rust, cargo, Vitest) is installed on the host
- [ ] Container exits cleanly after tests complete

## Scenario 2: Build Executable

```bash
npm run build
```

**Expected result**:
1. Docker builds (or reuses) the Windows container image
2. Frontend assets are compiled, then `cargo tauri build` produces
   a Windows executable inside the container
3. The `.exe` is placed in a designated output directory on the host
   via bind mount

**Validation**:
- [ ] An `.exe` file exists in the output directory on the host
- [ ] Launching the `.exe` displays "Hanzi Ruby Lens" as a centered
  heading
- [ ] The executable runs without requiring development tools on the
  target machine

## Scenario 3: First-Time Setup

```bash
git clone <repo-url>
cd hanzi-ruby-lens
npm install
npm run test
```

**Expected result**:
1. Docker image is built on first run (may take 15–30 minutes due to
   VS Build Tools and Rust toolchain installation)
2. Subsequent runs use cached image layers (< 2 minutes for tests,
   < 5 minutes for builds)

**Validation**:
- [ ] Works on a freshly cloned repository
- [ ] Clear error message if Docker Desktop is not running
- [ ] Clear error message if Docker is not in Windows containers mode
- [ ] Only Docker Desktop, Node.js, and NPM are needed on the host

## Scenario 4: Error Handling

```bash
# With Docker Desktop stopped:
npm run test
```

**Expected result**:
1. Command fails immediately with a clear message: "Docker Desktop
   is not running" or similar

**Validation**:
- [ ] Error message names the prerequisite and suggests the fix
- [ ] No cryptic Docker daemon errors reach the user
