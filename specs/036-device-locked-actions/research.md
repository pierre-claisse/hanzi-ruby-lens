# Research: Device-Locked Actions

**Feature**: 036-device-locked-actions
**Date**: 2026-04-04

## Decision 1: Device identification method

**Decision**: Use the `machine-uid` Rust crate (v0.5) to read the Windows `MachineGuid` from the registry (`HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`).

**Rationale**: This is the most stable, lightweight identifier available on Windows without elevated permissions. It survives reboots and application reinstalls. The crate is well-maintained (469k recent downloads, last updated Oct 2025) and provides a simple `machine_uid::get()` API. No external process calls or WMI queries needed.

**Alternatives considered**:
- WMI queries (motherboard/BIOS serial via `wmi` crate): Rejected — heavier dependency, requires COM process, slower, and hardware serials can change with hardware upgrades.
- Manual registry access (`winreg` crate): Rejected — reimplements what `machine-uid` already does with proper WOW64 handling.
- `machine-id` crate: Rejected — does not support Windows (falls back to random UUID).

**Caveat**: `MachineGuid` changes on full OS reinstall. This is acceptable for the personal-use scenario described in the spec.

## Decision 2: Authorization architecture

**Decision**: Single Tauri command `is_authorized_device` that returns a boolean. Called once at app startup. The result is passed as a prop through the component tree.

**Rationale**: Simplest possible architecture. No state management, no context providers, no middleware. The authorization state is immutable for the lifetime of the app session (the device doesn't change while the app runs). A simple prop drill through App → TitleBar → LibraryScreen is sufficient given the shallow component tree.

**Alternatives considered**:
- React Context for authorization: Rejected — over-engineering for a single boolean that only 3 components consume. Violates Principled Simplicity.
- Check on every render: Rejected — wasteful. Device doesn't change during a session.
- Frontend-only check (no Rust command): Rejected — frontend cannot access Windows registry. The identifier must come from the Rust backend.

## Decision 3: Authorized identifier storage

**Decision**: Store the authorized device's MachineGuid as a compile-time constant in the Rust backend, read from an environment variable at build time via `env!()` or `option_env!()`.

**Rationale**: The spec requires the identifier to be "embedded at build time, not stored in user-accessible configuration." Using a Rust compile-time environment variable (`AUTHORIZED_MACHINE_ID`) keeps it out of source control (set in the build environment) while embedding it in the binary. If the env var is not set, the build still succeeds but defaults to unauthorized on all devices.

**Alternatives considered**:
- Hardcoded string literal in source: Rejected — exposes the identifier in version control.
- Runtime config file: Rejected — spec explicitly forbids user-accessible configuration.
- Encrypted config: Rejected — over-engineering for personal use. The binary itself provides sufficient obscurity.

## Decision 4: Reset entry red styling

**Decision**: Apply `text-red-500` to the Reset entry's icon and label in `DataManagementDropdown.tsx`, matching the existing Delete entry pattern.

**Rationale**: The Delete entry in `LibraryScreen.tsx` already uses `text-red-500` for both icon and text. Using the same class for Reset creates visual consistency. No new CSS variables or styles needed.

**Alternatives considered**:
- Custom red shade: Rejected — inconsistent with existing Delete styling.
- Red background instead of text: Rejected — too heavy, conflicts with Content-First Design.
