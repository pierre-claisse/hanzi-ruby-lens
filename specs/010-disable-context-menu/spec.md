# Feature Specification: Disable Context Menu

**Feature Branch**: `010-disable-context-menu`
**Created**: 2026-02-13
**Status**: Draft
**Input**: User description: "right now, mouse right-clicking opens a default contextual menu with useless things... Just disable right clicking everywhere on this app for now"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - No Context Menu on Right-Click (Priority: P1)

A user right-clicks anywhere in the application window. Instead of seeing the browser's default context menu (with irrelevant options like "Inspect", "Reload", etc.), nothing happens. The right-click is silently consumed.

**Why this priority**: This is the entire feature. The default browser context menu breaks the polished desktop-app feel and exposes developer-oriented actions to end users.

**Independent Test**: Right-click anywhere in the app (title bar, text area, buttons, empty space) and verify no menu appears.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** the user right-clicks on the text display area, **Then** no context menu appears
2. **Given** the app is running, **When** the user right-clicks on the title bar, **Then** no context menu appears
3. **Given** the app is running, **When** the user right-clicks on any button, **Then** no context menu appears
4. **Given** the app is running, **When** the user right-clicks on empty background space, **Then** no context menu appears

---

### Edge Cases

- Right-clicking while a dropdown (e.g., palette selector) is open must not show a context menu and must not interfere with the dropdown's behavior
- Right-click suppression must work regardless of modifier keys (Ctrl+right-click, Shift+right-click)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Application MUST suppress the default browser context menu on right-click across the entire window
- **FR-002**: Right-click suppression MUST apply to all areas: title bar, text display, buttons, and empty space
- **FR-003**: Right-click suppression MUST NOT interfere with any existing left-click, keyboard, or pointer interactions
- **FR-004**: Right-click suppression MUST be active from app startup (no flash of default behavior)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Right-clicking anywhere in the application produces no visible menu or popup
- **SC-002**: All existing interactions (left-click, keyboard navigation, drag) continue to work identically after the change
- **SC-003**: Suppression is consistent across all app states (dropdown open/closed, fullscreen/windowed, any palette/theme)

## Assumptions

- This is a blanket suppression with no custom right-click menu replacing it
- If a custom context menu is needed in the future, this suppression will be revised in a separate feature
- The suppression is implemented at the application level (not per-component)
