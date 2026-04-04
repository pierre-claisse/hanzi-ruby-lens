# Feature Specification: Device-Locked Actions

**Feature Branch**: `036-device-locked-actions`
**Created**: 2026-04-04
**Status**: Draft
**Input**: User description: "Restrict risky/experimental actions (Delete text, Import/Export/Reset database) to the authorized device only. On unauthorized devices, these actions are hidden entirely. Also style the Reset entry in red like the Delete text entry."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Risky actions hidden on unauthorized devices (Priority: P1)

A user runs the application on a device that is not the authorized development machine. The Delete entry does not appear in the Library context menu, and the data management icon (Import/Export/Reset) does not appear in the top bar. The user can read, create, and annotate texts normally but cannot perform destructive operations.

**Why this priority**: This is the core protection — without it, any device running the app can delete texts or reset the database.

**Independent Test**: Install and run the app on a different computer. Verify the Delete menu entry and data management icon are absent.

**Acceptance Scenarios**:

1. **Given** the app running on an unauthorized device, **When** the user views the Library, **Then** the right-click context menu does not contain a "Delete" entry
2. **Given** the app running on an unauthorized device, **When** the user views the top bar in Library view, **Then** the data management icon (Import/Export/Reset) is not visible
3. **Given** the app running on an unauthorized device, **When** the user uses the app normally, **Then** all non-destructive features (create text, read, annotate, tag, lock/unlock) work as usual

---

### User Story 2 - Risky actions available on authorized device (Priority: P1)

The owner runs the application on their authorized development machine. All features work as before: Delete appears in the context menu, and the data management icon appears in the top bar with Export, Import, and Reset options.

**Why this priority**: Equally critical — the owner must retain full control on their own machine.

**Independent Test**: Run the app on the authorized device. Verify Delete and data management are present and functional.

**Acceptance Scenarios**:

1. **Given** the app running on the authorized device, **When** the user right-clicks a text card, **Then** the "Delete" entry appears in the context menu
2. **Given** the app running on the authorized device, **When** the user views the top bar in Library view, **Then** the data management icon is visible
3. **Given** the app running on the authorized device, **When** the user clicks the data management icon, **Then** Export, Import, and Reset options are all available

---

### User Story 3 - Reset entry styled in red (Priority: P2)

The Reset option in the data management dropdown is styled in red (matching the Delete text entry style) to clearly signal it as a destructive action.

**Why this priority**: Visual consistency for destructive actions — important but does not affect functionality.

**Independent Test**: Open the data management dropdown on the authorized device and verify the Reset entry text and icon appear in red.

**Acceptance Scenarios**:

1. **Given** the data management dropdown is open, **When** the user views the Reset entry, **Then** its text and icon are displayed in red, matching the Delete entry's styling
2. **Given** the data management dropdown is open, **When** the user views the Export and Import entries, **Then** they retain their normal (non-red) styling

---

### Edge Cases

- If the device identifier cannot be determined (e.g., system error), the app MUST default to unauthorized mode (risky actions hidden) for safety.
- The device identifier MUST be stable across reboots, OS updates, and application reinstalls — it MUST NOT change.
- The authorized device identifier is a build-time constant, not configurable at runtime.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST identify the current device using a unique, immutable hardware identifier that does not change across reboots, OS updates, or reinstalls
- **FR-002**: The system MUST compare the current device identifier against a known authorized identifier at startup
- **FR-003**: On unauthorized devices, the system MUST hide the "Delete" entry from the Library context menu entirely (not greyed out — absent)
- **FR-004**: On unauthorized devices, the system MUST hide the data management icon from the top bar entirely
- **FR-005**: On the authorized device, all existing functionality MUST remain unchanged (Delete, Export, Import, Reset)
- **FR-006**: If the device identifier cannot be determined, the system MUST default to unauthorized mode
- **FR-007**: The Reset entry in the data management dropdown MUST be styled in red (text and icon) to match the Delete text entry's destructive styling
- **FR-008**: The authorized device identifier MUST be embedded at build time, not stored in user-accessible configuration

### Key Entities

- **Device Authorization**: A boolean state (authorized/unauthorized) derived by comparing the current device's hardware identifier against a build-time constant. Determines visibility of risky UI elements.

## Assumptions

- The authorized device is the owner's current development machine. Only one device needs to be authorized.
- The identifier comparison is a simple equality check — no cryptographic verification is needed for this personal-use scenario.
- Non-destructive features (text creation, reading, annotation, tagging, locking) are always available on all devices.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On an unauthorized device, zero destructive actions are accessible through the UI (Delete, Import, Export, Reset all hidden)
- **SC-002**: On the authorized device, 100% of existing functionality remains available and unchanged
- **SC-003**: The device authorization check adds no perceptible delay to application startup
- **SC-004**: The Reset entry is visually indistinguishable in style from the Delete entry (both red)
