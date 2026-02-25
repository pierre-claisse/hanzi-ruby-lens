/** Fixed menu width matching Tailwind w-56 (14rem = 224px at 16px base). */
export const MENU_WIDTH_PX = 224;
/** Height per menu entry (px). */
export const MENU_ITEM_HEIGHT_PX = 36;
/** Vertical padding inside the menu (px). */
export const MENU_PADDING_PX = 8;
/** Gap between the word edge and the menu (px). */
export const MENU_GAP_PX = 4;

/**
 * Pure function: compute context-menu position relative to its container
 * based on which viewport quadrant the word occupies.
 */
export function computeMenuPosition(
  wordRect: { top: number; bottom: number; left: number; right: number; width: number; height: number },
  containerRect: { top: number; left: number },
  menuEntryCount: number,
  viewportWidth: number,
  viewportHeight: number,
): { top: number; left: number; direction: "above" | "below" } {
  const menuHeight = menuEntryCount * MENU_ITEM_HEIGHT_PX + MENU_PADDING_PX;
  const wordCenterY = wordRect.top + wordRect.height / 2;
  const wordCenterX = wordRect.left + wordRect.width / 2;
  const midY = viewportHeight / 2;
  const midX = viewportWidth / 2;

  // Vertical: bottom half → above, top half (or midpoint) → below
  let top: number;
  let direction: "above" | "below";
  if (wordCenterY > midY) {
    top = wordRect.top - containerRect.top - menuHeight - MENU_GAP_PX;
    direction = "above";
  } else {
    top = wordRect.bottom - containerRect.top + MENU_GAP_PX;
    direction = "below";
  }

  // Horizontal: right half → left of word, left half (or midpoint) → right of word
  let left: number;
  if (wordCenterX > midX) {
    left = wordRect.left - containerRect.left - MENU_WIDTH_PX - MENU_GAP_PX;
  } else {
    left = wordRect.right - containerRect.left + MENU_GAP_PX;
  }

  // Clamp to keep menu within container bounds
  if (left < 0) left = 0;
  if (top < 0) top = 0;

  return { top, left, direction };
}

/**
 * Adapt a click-point {x, y} into a zero-size rect for the existing
 * computeMenuPosition algorithm. Uses containerRect = {top: 0, left: 0}
 * so the output is viewport-relative (for position: fixed menus).
 */
export function computeContextMenuPosition(
  clickX: number,
  clickY: number,
  menuEntryCount: number,
  viewportWidth: number,
  viewportHeight: number,
): { top: number; left: number; direction: "above" | "below" } {
  const syntheticRect = {
    top: clickY,
    bottom: clickY,
    left: clickX,
    right: clickX,
    width: 0,
    height: 0,
  };
  return computeMenuPosition(
    syntheticRect,
    { top: 0, left: 0 },
    menuEntryCount,
    viewportWidth,
    viewportHeight,
  );
}

/**
 * Compute submenu position given the main menu's bounding rect.
 * Horizontal: open left if main menu center X > viewport midpoint, else right.
 * Vertical: clamp to viewport bounds.
 */
export function computeSubmenuPosition(
  mainMenuRect: { top: number; left: number; width: number; height: number },
  submenuWidth: number,
  submenuHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): { top: number; left: number } {
  const mainCenterX = mainMenuRect.left + mainMenuRect.width / 2;
  const midX = viewportWidth / 2;

  // Horizontal: right half → open left, left half → open right
  let left: number;
  if (mainCenterX > midX) {
    left = mainMenuRect.left - submenuWidth - MENU_GAP_PX;
  } else {
    left = mainMenuRect.left + mainMenuRect.width + MENU_GAP_PX;
  }

  // Start aligned with main menu top
  let top = mainMenuRect.top;

  // Vertical clamping: shift up if submenu overflows bottom
  if (top + submenuHeight > viewportHeight) {
    top = viewportHeight - submenuHeight;
  }
  if (top < 0) top = 0;

  // Horizontal clamping
  if (left < 0) left = 0;
  if (left + submenuWidth > viewportWidth) {
    left = viewportWidth - submenuWidth;
  }

  return { top, left };
}
