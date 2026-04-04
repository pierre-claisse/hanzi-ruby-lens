# Quickstart: Device-Locked Actions

**Feature**: 036-device-locked-actions

## What changes

### Backend (Rust)
- New dependency: `machine-uid` in `Cargo.toml`
- New command: `is_authorized_device` in `commands.rs` — reads MachineGuid, compares to build-time constant
- Register command in `lib.rs`

### Frontend (React/TypeScript)
- `App.tsx` — Call `is_authorized_device` at startup, store result, pass as prop
- `TitleBar.tsx` — Accept `isAuthorizedDevice` prop, conditionally render `DataManagementDropdown`
- `LibraryScreen.tsx` — Accept `isAuthorizedDevice` prop, conditionally render Delete entry
- `DataManagementDropdown.tsx` — Style Reset entry in red (`text-red-500`)

## Key files

| File | Change |
|------|--------|
| `src-tauri/Cargo.toml` | Add `machine-uid` dependency |
| `src-tauri/src/commands.rs` | Add `is_authorized_device` command |
| `src-tauri/src/lib.rs` | Register new command |
| `src/App.tsx` | Call command at startup, pass flag |
| `src/components/TitleBar.tsx` | Conditional DataManagementDropdown |
| `src/components/LibraryScreen.tsx` | Conditional Delete entry |
| `src/components/DataManagementDropdown.tsx` | Red Reset styling |

## Build setup

Set the `AUTHORIZED_MACHINE_ID` environment variable before building:
```sh
# Get your machine's ID first:
# In Rust: machine_uid::get().unwrap()
# Or check registry: HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid

export AUTHORIZED_MACHINE_ID="your-machine-guid-here"
npm run build
```

If the env var is not set, all devices will be treated as unauthorized.

## Testing approach

- Rust unit tests: mock the identifier comparison logic
- Frontend unit tests: render components with `isAuthorizedDevice=true/false`, verify presence/absence of Delete and DataManagement
- Manual: build and run on authorized device (full access) vs different device (restricted)
