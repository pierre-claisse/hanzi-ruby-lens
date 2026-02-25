# Feature Specification: Timestamps, Sort Persistence & System Theme

**Feature Branch**: `030-timestamps-sort-theme`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "La date de creation indiquee sur l'apercu d'un texte dans la bibliotheque doit inclure l'heure et les minutes. Il faut aussi une date (au meme format) de derniere modification (mise a jour lors d'une correction de la segmentation ou du pinyin). Le parametre de tri par date de creation (ascendant ou descendant) doit etre persiste localement comme la palette. Par contre, le mode clair/sombre ne doit plus etre persiste, il doit, au lancement de l'application, s'accorder au reglage actuel du systeme."

## User Scenarios & Testing

### User Story 1 - Full Timestamps via Details Tooltip (Priority: P1)

As a user browsing the library, I want the preview card to remain clean and minimal (title + tags only by default), with a "Details" icon that reveals a tooltip on hover showing the creation date with hours and minutes. This lets me check precise timestamps without cluttering the card surface.

**Why this priority**: The creation timestamp is important but not needed at a glance. Moving it behind a hover interaction preserves card minimalism while still providing full date+time information on demand.

**Independent Test**: Open the library with several texts. Hover over the "Details" icon on a card. Verify the tooltip shows the creation date with hours and minutes.

**Acceptance Scenarios**:

1. **Given** a text was created on 2026-02-25 at 14:32, **When** I hover over its "Details" icon, **Then** the tooltip displays the creation date as "2026-02-25 14:32"
2. **Given** two texts were created on the same day at different times, **When** I hover over each card's "Details" icon, **Then** I can distinguish them by their creation times
3. **Given** a text was created before this feature existed (no time stored), **When** I hover over its "Details" icon, **Then** the creation date still displays correctly (with 00:00 as default time or date-only fallback)
4. **Given** a preview card in the library, **When** I view it without hovering, **Then** I see only the title and tags — no dates are visible on the card surface

---

### User Story 2 - Last Modified Date (Priority: P2)

As a user, I want to see a "last modified" date in the details tooltip, so I can know when I last corrected the segmentation or pinyin of a text. This date is updated whenever a pinyin correction, segment split, or segment merge is performed. If the text has never been modified, the "last modified" line is hidden from the tooltip.

**Why this priority**: Adds a new data point that helps users track their correction progress. Requires a schema change (new column) and updates to correction commands.

**Independent Test**: Open a text, correct its pinyin or split/merge a segment, return to library. Hover over the "Details" icon and verify the tooltip shows an updated "last modified" date with hours and minutes.

**Acceptance Scenarios**:

1. **Given** a text has never been modified after creation, **When** I hover over its "Details" icon, **Then** the tooltip shows only the creation date (no "last modified" line)
2. **Given** I correct pinyin on a text, **When** I return to the library and hover over its "Details" icon, **Then** the tooltip shows a "last modified" date reflecting the current date and time
3. **Given** I split a segment on a text, **When** I return to the library and hover over its "Details" icon, **Then** the "last modified" date is updated
4. **Given** I merge segments on a text, **When** I return to the library and hover over its "Details" icon, **Then** the "last modified" date is updated
5. **Given** a text was modified today at 09:15, **When** I hover over its "Details" icon, **Then** the "last modified" date displays in the same format as the creation date (e.g., "2026-02-25 09:15")

---

### User Story 3 - Persist Sort Order Preference (Priority: P3)

As a user, I want my chosen sort order (ascending or descending by creation date) to be remembered between sessions, so I don't have to re-set it every time I open the application.

**Why this priority**: Small quality-of-life improvement. The sort toggle already exists; this just persists the preference locally (like the color palette preference).

**Independent Test**: Toggle sort order to ascending, close the app, reopen. Verify the library displays texts in ascending order.

**Acceptance Scenarios**:

1. **Given** I set the sort order to ascending, **When** I close and reopen the application, **Then** the library displays texts sorted in ascending order
2. **Given** I have never changed the sort order, **When** I open the application for the first time, **Then** the default sort order is descending (newest first)
3. **Given** I toggle the sort order multiple times, **When** I close and reopen the application, **Then** the last chosen sort order is applied

---

### User Story 4 - System Theme Sync (Priority: P4)

As a user, I want the application to always follow my operating system's light/dark mode setting — both at launch and whenever I change the OS setting while the app is running. I can still manually switch themes during a session, but any OS theme change overrides my manual choice and re-syncs the app to the system preference.

**Why this priority**: Behavioral change to an existing feature. The current theme is persisted in localStorage; this removes that persistence and replaces it with live system detection.

**Independent Test**: Set OS to light mode, open app — it should be light. Change OS to dark mode while the app is open — it should switch to dark immediately. Manually toggle back to light in-app, then change OS to light — app stays light. Close and reopen — still light (matching system).

**Acceptance Scenarios**:

1. **Given** the OS is set to light mode, **When** I open the application, **Then** it starts in light mode
2. **Given** the OS is set to dark mode, **When** I open the application, **Then** it starts in dark mode
3. **Given** the app is running and the OS theme changes from light to dark, **When** the change occurs, **Then** the app switches to dark mode immediately
4. **Given** the app is running and the OS theme changes from dark to light, **When** the change occurs, **Then** the app switches to light mode immediately
5. **Given** I manually switch the app to dark mode, **When** the OS theme subsequently changes, **Then** the app re-syncs to the new OS theme (overriding my manual choice)
6. **Given** the OS does not report a preference (no system preference available), **When** I open the application, **Then** it defaults to light mode

---

### Edge Cases

- What happens if the creation timestamp stored in the database has no time component (legacy data)? Display date only or assume 00:00.
- What happens if the user's system clock is incorrect? Timestamps reflect the system clock as-is; no validation is performed.
- What happens if the OS theme preference changes while the app is running? The app detects the change and adapts immediately.
- What happens if localStorage is cleared between sessions? Sort order reverts to default (descending); theme follows system as it always does.

## Requirements

### Functional Requirements

- **FR-001**: The text preview card MUST show only the title and tags on its surface; dates MUST NOT appear directly on the card
- **FR-002**: Each preview card MUST include a "Details" icon that, on hover, reveals a tooltip containing the creation date with hours and minutes (format: YYYY-MM-DD HH:mm)
- **FR-003**: The system MUST store and display a "last modified" date on each text, updated whenever pinyin is corrected, a segment is split, or segments are merged
- **FR-004**: The "last modified" date MUST use the same display format as the creation date (YYYY-MM-DD HH:mm) and appear in the details tooltip
- **FR-005**: If a text has never been modified after creation, the "last modified" line MUST NOT appear in the details tooltip
- **FR-006**: The sort order preference (ascending or descending) MUST be persisted locally between sessions
- **FR-007**: The default sort order for new installations MUST be descending (newest first)
- **FR-008**: On application startup, the theme MUST match the current operating system light/dark mode setting
- **FR-009**: While the app is running, any OS theme change MUST be detected and applied immediately
- **FR-010**: The user MUST still be able to toggle between light and dark mode during a session, but an OS theme change overrides the manual choice
- **FR-011**: The theme preference MUST NOT be persisted between sessions
- **FR-012**: The creation date stored in the database MUST include hours and minutes for newly created texts
- **FR-013**: Existing texts created before this feature MUST still display correctly (graceful handling of date-only values)

### Key Entities

- **Text**: Extended with a "last modified" timestamp attribute. The creation date attribute now includes hours and minutes.
- **Sort Preference**: A locally persisted setting (ascending or descending) for library sort order.
- **Theme**: No longer persisted; follows the operating system preference at startup and reacts to live OS theme changes.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of text preview cards show a "Details" icon whose tooltip displays creation dates with hours and minutes
- **SC-002**: After any pinyin correction or segment operation, the "last modified" date updates within 1 second on the preview card
- **SC-003**: Sort order preference survives application restart with 100% reliability
- **SC-004**: On startup, the application theme matches the OS preference in 100% of cases where the OS reports a preference
- **SC-005**: All existing texts created before this feature remain visible and functional in the library

## Clarifications

### Session 2026-02-25

- Q: When a text has never been modified, should the "last modified" date be hidden or shown with the creation date value? → A: Hide "last modified" entirely if no modification has occurred.
- Q: How should creation and last-modified dates be laid out on the preview card? → A: Dates are not shown on the card surface. The card shows only the title and tags. A "Details" icon on the card reveals a tooltip on hover containing the creation date and (if applicable) the last modified date.

## Assumptions

- The date-time format used for display is YYYY-MM-DD HH:mm (24-hour format), consistent with ISO conventions and suitable for an international audience.
- "Last modified" only tracks corrections (pinyin update, split, merge), not other changes such as tag assignment or title editing.
- Legacy texts with date-only creation timestamps will display with time as 00:00 or display the date portion only.
- The OS theme is detected at startup and monitored for live changes throughout the session. Any OS theme change overrides the user's manual in-app toggle.
