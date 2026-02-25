# Feature Specification: Text Lock

**Feature Branch**: `031-text-lock`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "Je veux ajouter la possibilité de 'verrouiller' un texte depuis la bibliothèque. Chaque carte a un discret bouton 'toggle lock' non loin du tooltip info. On peut verrouiller et déverrouiller à volonté. Si un texte est verrouillé, on ne peut pas corriger la segmentation ni le pinyin en mode lecture (les entrées associées du menu contextuel apparaissent grisées et leurs icônes sont remplacées par des cadenas)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Lock/Unlock Toggle on Library Cards (Priority: P1) 🎯 MVP

The user browses the text library and sees a small lock toggle button on each card, positioned near the existing Info tooltip icon. Clicking the toggle switches the text between locked and unlocked states. The lock state is persisted, so it survives app restarts. The toggle provides immediate visual feedback: a locked padlock icon when locked, an unlocked padlock icon when unlocked.

**Why this priority**: This is the core interaction — without the toggle, there is no way to lock or unlock texts. It must exist before the lock enforcement in reading mode can be meaningful.

**Independent Test**: Click the lock toggle on a card → icon changes to locked padlock. Restart the app → the text is still locked. Click again → icon changes back to unlocked padlock. Restart → text is unlocked.

**Acceptance Scenarios**:

1. **Given** a text card in the library with no lock state (new or existing text), **When** the user clicks the lock toggle, **Then** the icon changes to a locked padlock and the lock state is persisted.
2. **Given** a locked text card, **When** the user clicks the lock toggle, **Then** the icon changes to an unlocked padlock and the unlocked state is persisted.
3. **Given** a text that was locked in a previous session, **When** the user reopens the app, **Then** the card displays the locked padlock icon.
4. **Given** an existing text created before this feature, **When** the user views it in the library, **Then** it defaults to unlocked.

---

### User Story 2 — Correction Enforcement in Reading Mode (Priority: P2)

When the user opens a locked text in reading mode and right-clicks a word, the context menu entries related to segmentation correction (split, merge) and pinyin correction appear greyed out (disabled). Their icons are replaced by a padlock icon to clearly communicate why the actions are unavailable.

**Why this priority**: This is the enforcement side of the lock feature. It depends on the lock state existing (US1) but delivers the actual protection value — preventing accidental modifications to validated texts.

**Independent Test**: Lock a text from the library → open it in reading mode → right-click a word → segmentation and pinyin correction entries are greyed out with padlock icons. Go back to library → unlock the text → open it again → right-click → correction entries are fully functional with their normal icons.

**Acceptance Scenarios**:

1. **Given** a locked text open in reading mode, **When** the user right-clicks a word, **Then** the "Edit pinyin" context menu entry appears greyed out with a padlock icon instead of its normal icon.
2. **Given** a locked text open in reading mode, **When** the user right-clicks a word, **Then** the "Split" context menu entry appears greyed out with a padlock icon.
3. **Given** a locked text open in reading mode, **When** the user right-clicks a word, **Then** the "Merge" context menu entry appears greyed out with a padlock icon.
4. **Given** a locked text open in reading mode, **When** the user clicks on a greyed-out correction entry, **Then** nothing happens (the action is not triggered).
5. **Given** an unlocked text open in reading mode, **When** the user right-clicks a word, **Then** all correction entries appear with their normal icons and are fully functional.

---

### Edge Cases

- What happens when a text is locked while it is currently open in reading mode? The lock state is applied from the library, so the user must return to the library to lock/unlock. If the text was locked before opening, the lock is enforced immediately upon opening.
- What happens with the delete action on a locked text? Deletion is not affected by the lock — the lock only protects against segmentation and pinyin corrections. The user can still delete a locked text from the library.
- What happens with the context menu copy actions on a locked text? Copy actions (copy characters, copy pinyin) remain fully functional regardless of lock state — only correction/modification actions are disabled.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each text MUST have a lock state (locked or unlocked), defaulting to unlocked for all existing and newly created texts.
- **FR-002**: Each text preview card in the library MUST display a lock toggle button near the Info tooltip icon.
- **FR-003**: The lock toggle button MUST display a locked padlock icon when the text is locked and an unlocked padlock icon when unlocked.
- **FR-004**: Clicking the lock toggle MUST immediately switch the lock state and update the icon without requiring a page reload.
- **FR-005**: The lock state MUST be persisted so it survives application restarts.
- **FR-006**: In reading mode, when a text is locked, the context menu entries for pinyin correction, segment splitting, and segment merging MUST appear greyed out (visually disabled).
- **FR-007**: In reading mode, when a text is locked, the icons of disabled correction entries MUST be replaced by padlock icons.
- **FR-008**: In reading mode, clicking a disabled (greyed out) correction entry MUST NOT trigger any action.
- **FR-009**: The lock toggle button MUST be visually discreet — it should not dominate the card layout or compete with the title.
- **FR-010**: Non-correction actions (delete text, copy characters, copy pinyin) MUST remain functional regardless of lock state.

### Key Entities

- **Text**: Extended with a lock state attribute (locked/unlocked boolean). Defaults to unlocked. The lock state is persisted alongside other text metadata.
- **TextPreview**: Extended with the lock state so library cards can display the correct toggle state without loading the full text.

## Assumptions

- The lock toggle is a single-click action (no confirmation dialog needed) since it is freely reversible.
- The lock feature is purely a client-side protection — it prevents accidental modifications, not malicious ones.
- The lock button styling follows the existing Info icon pattern (small, muted colors, hover effect).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle the lock state of any text in under 1 second via a single click on the library card.
- **SC-002**: 100% of locked texts retain their lock state across app restarts.
- **SC-003**: 100% of correction-related context menu entries are visually disabled (greyed out with padlock icons) when a locked text is open in reading mode.
- **SC-004**: 0% of accidental corrections occur on locked texts — clicking a disabled entry triggers no action.
- **SC-005**: All non-correction actions (delete, copy) remain fully functional on locked texts.
