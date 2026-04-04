# Data Model: Device-Locked Actions

**Feature**: 036-device-locked-actions
**Date**: 2026-04-04

## Summary

No persistent data model changes. This feature introduces a runtime-only boolean state derived from a hardware comparison.

## Runtime State (not persisted)

### Device Authorization

| Field            | Type    | Source                                          |
|------------------|---------|-------------------------------------------------|
| isAuthorized     | boolean | Comparison of current MachineGuid vs build-time constant |

- Computed once at app startup via `is_authorized_device` command
- Immutable for the lifetime of the app session
- Defaults to `false` if MachineGuid cannot be determined
- Passed as a prop through the component tree

## Commands (Tauri IPC)

### is_authorized_device (query)

- **Input**: None
- **Output**: `boolean`
- **Behavior**: Reads the current device's MachineGuid, compares against the build-time authorized identifier. Returns `true` if they match, `false` otherwise (including on error).
- **Side effects**: None (pure query)

## No Schema Changes

- No SQLite table additions
- No existing table modifications
- No migration needed
