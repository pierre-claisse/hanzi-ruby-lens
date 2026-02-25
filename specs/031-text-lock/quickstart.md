# Quickstart: Text Lock

## Scenario 1 — Lock a text from the library

1. Open the app → library screen shows text cards
2. On any card, click the lock toggle button (unlocked padlock icon near the Info icon)
3. Icon changes to a locked padlock
4. Close and reopen the app
5. **Expected**: The card still shows the locked padlock icon

## Scenario 2 — Unlock a previously locked text

1. Find a card with a locked padlock icon
2. Click the lock toggle button
3. Icon changes to an unlocked padlock
4. **Expected**: The text is now unlocked and corrections are allowed in reading mode

## Scenario 3 — Correction disabled on locked text

1. Lock a text from the library (Scenario 1)
2. Click the card to open it in reading mode
3. Right-click on any word to open the context menu
4. **Expected**: "Edit Pinyin", "Split after X", and "Merge with..." entries appear greyed out with padlock icons
5. Click on a greyed-out entry
6. **Expected**: Nothing happens — no pinyin editor opens, no split/merge occurs

## Scenario 4 — Correction works on unlocked text

1. Unlock a text from the library (Scenario 2)
2. Open it in reading mode
3. Right-click on a word
4. **Expected**: All correction entries appear with normal icons (Pencil, Scissors, Combine) and are clickable

## Scenario 5 — Non-correction actions on locked text

1. Lock a text from the library
2. Open it in reading mode
3. Right-click on a word
4. **Expected**: "MOE Dictionary", "Google Translate", and "Copy" remain fully functional with normal icons
5. Return to library, right-click the locked card
6. **Expected**: "Delete" and "Tags" options are fully functional

## Scenario 6 — Migration of existing texts

1. Update the app with the new version
2. Open the library
3. **Expected**: All existing texts show the unlocked padlock icon (default state)
