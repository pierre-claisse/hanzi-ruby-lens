# Research: Text Lock

## R1: Lock State Storage

**Decision**: Add a `locked INTEGER NOT NULL DEFAULT 0` column to the `texts` table via idempotent `ALTER TABLE` migration (same pattern as `modified_at`).

**Rationale**: Boolean as INTEGER (0/1) is SQLite's standard boolean representation. Using `NOT NULL DEFAULT 0` ensures all existing texts default to unlocked without a data migration step. The idempotent ALTER pattern is already established in the codebase.

**Alternatives considered**:
- Separate `text_locks` table: Rejected — over-engineered for a simple boolean property of the Text aggregate.
- localStorage on frontend: Rejected — violates Constitution II (Offline-First Data, all data in SQLite) and wouldn't survive database export/import.

## R2: Lock Toggle Command Pattern

**Decision**: New Tauri command `toggle_lock(text_id)` that flips the lock state in the database and returns the new state.

**Rationale**: Follows existing CQRS pattern — a command that writes to the database. Toggle (flip) is simpler than set-to-value since the UI always knows the current state and wants to switch it. Returning the new boolean avoids a separate read query.

**Alternatives considered**:
- `set_lock(text_id, locked: bool)`: Viable but unnecessary — the toggle interaction is always a flip. A toggle command is more expressive of the user intent.
- Optimistic UI update without return value: Rejected — returning the new state confirms the write succeeded.

## R3: Context Menu Disabled State

**Decision**: Extend the existing `MenuEntry` type with optional `disabled` and `disabledIcon` fields. The `WordContextMenu` component renders disabled entries with greyed-out text/opacity and replaces the icon with the padlock icon.

**Rationale**: This keeps the existing `buildMenuEntries` function structure intact. The `TextDisplay` component passes the `locked` boolean to `buildMenuEntries`, which marks correction entries as disabled when the text is locked. The menu component handles the visual rendering.

**Alternatives considered**:
- Completely hiding correction entries when locked: Rejected — the spec requires entries to be visible but greyed out with padlock icons, communicating *why* actions are unavailable.
- Adding a separate "locked" banner/overlay: Rejected — the spec specifically calls for greyed-out menu entries with padlock icons, not a generic lock indicator.

## R4: Lock Toggle UI Placement

**Decision**: Place the lock toggle button in the card header row, between the title and the Info icon. Use `LockKeyhole` (locked) and `Unlock` (unlocked) icons from lucide-react with the same muted styling as the Info icon.

**Rationale**: Positioning near the Info icon follows the spec requirement. Using the same `w-4 h-4 text-content/30` styling keeps it discreet per FR-009. The toggle is a `<button>` that stops event propagation to prevent triggering the card's `onClick`.

**Alternatives considered**:
- Lock icon after the Info icon: Viable but puts two icons together. Between title and icons gives visual balance.
- Lock icon in the tags area: Rejected — tags area is semantically different and may be empty.

## R5: lucide-react Lock Icons

**Decision**: Use `Lock` (locked state) and `Unlock` (unlocked state) for the card toggle. Use `Lock` for the disabled menu entry icon replacement.

**Rationale**: lucide-react is already a project dependency. `Lock` and `Unlock` are the canonical padlock icons in the library. Using `Lock` for disabled menu entries clearly communicates the restriction reason.

**Alternatives considered**:
- `LockKeyhole` / `LockKeyholeOpen`: More detailed but less universally recognized. `Lock`/`Unlock` are simpler and more readable at 16px.
- Custom SVG: Rejected — lucide-react already provides suitable icons.
