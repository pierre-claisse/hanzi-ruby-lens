# Research: Word Comments

**Feature Branch**: `034-word-comments` | **Date**: 2026-02-27

## Decision 1: Comment Storage Strategy

**Decision**: Store comments inline in the Word struct as an optional `comment` field.

**Rationale**: The entire segments array is already stored as a single JSON blob in the `segments TEXT` column. Every existing mutation (pinyin edit, split, merge) rewrites the full JSON. Adding an optional field is zero-cost for existing data (serde `skip_serializing_if = "Option::is_none"` omits null fields), requires no schema migration, and makes export/import automatic (comments travel inside the segments JSON which is already passed through as a raw string in ExportText).

**Alternatives considered**:
- Separate `word_comments` table with `(text_id, segment_index, comment)`: Rejected because segment indices are fragile (they shift on split/merge), requires JOIN queries, complicates export/import with a new payload array, and violates the monolithic-segments pattern used throughout the codebase.

## Decision 2: Comment CRUD via Existing Segments Pattern

**Decision**: Add a new Tauri command `update_word_comment` that mirrors the existing `update_segments` pattern — load segments JSON, mutate the target Word's `comment` field, serialize and UPDATE back.

**Rationale**: This is exactly how `update_segments` (pinyin edit), `split_segment_db`, and `merge_segments_db` work. Consistent pattern, minimal new code.

**Alternatives considered**:
- Direct SQL on a separate column: Rejected (no separate column exists and adding one would duplicate segment data).

## Decision 3: Split/Merge Blocking

**Decision**: Block split and merge operations when the target Word (or adjacent Word for merge) has a comment. Enforce on both frontend (disabled menu entries) and backend (validation before executing the operation).

**Rationale**: The spec explicitly requires this (FR-016, FR-017). The user must delete the comment first. This avoids complex comment migration logic on structural changes and keeps the data model simple.

**Alternatives considered**:
- Comment migration on split (attach to first) / merge (concatenate): Rejected by user during spec refinement. Adds complexity for a niche edge case.

## Decision 4: Comment Dialog Component

**Decision**: Create a new `WordCommentDialog` component following the `ManageTagsDialog` pattern — fixed overlay, centered modal, textarea, Save/Delete/Cancel buttons.

**Rationale**: ManageTagsDialog provides the established UI pattern in this codebase (overlay `fixed inset-0 z-50`, `bg-surface border border-content/20 rounded-xl`, header with close button, footer with action buttons). Reusing this pattern ensures visual consistency.

**Alternatives considered**:
- Inline editing (like pinyin edit in RubyWord): Rejected because comments can be 5000 characters — a tiny inline input is insufficient. A dialog gives proper space.

## Decision 5: Side Panel Architecture

**Decision**: Create a `CommentsPanel` component rendered alongside the TextDisplay in reading view. The panel is a fixed-width collapsible div on the right, with a toggle button. State (open/closed) is derived from whether the Text has comments, then toggleable by the user.

**Rationale**: The reading view currently uses `max-w-5xl mx-auto` centered layout with `px-8` padding. On standard desktop viewports (1280px+), there's ample space on the right for a 280-320px panel without affecting the text area. The panel sits outside the `max-w-5xl` container.

**Alternatives considered**:
- Overlay/drawer pattern: Rejected because it would cover the text content, making it hard to read while viewing comments.
- Bottom panel: Rejected because vertical space is more precious in a reading app.

## Decision 6: Visual Indicator for Commented Words

**Decision**: Use a subtle accent-colored dot below the Word (after the `<ruby>` element) as the visual indicator for Words with comments.

**Rationale**: Constitution Principle I ("Content-First Design") requires UI chrome to not compete with text. A small dot is minimal, discoverable, and doesn't interfere with the ruby annotations. Using the accent color ties it into the existing visual system.

**Alternatives considered**:
- Underline: Could be confused with a link or focus state.
- Background tint: Already used for hover/focus highlighting — would conflict.
- Icon badge: Too visually heavy for a content-first design.

## Decision 7: Export/Import Compatibility

**Decision**: No changes needed to the export/import system. Since comments are stored inline in the segments JSON, and `ExportText.segments` is a raw `String` (opaque JSON), comments are automatically included in exports and restored on imports.

**Rationale**: The export system reads segments as a raw string from the database and writes it directly to the JSON file. The import system does the reverse. Adding an optional field to Word doesn't break this — existing exports without comments will deserialize correctly (the `comment` field will be `None`/`undefined`).

**Alternatives considered**:
- Separate comments array in ExportPayload: Unnecessary since inline storage handles this automatically.
