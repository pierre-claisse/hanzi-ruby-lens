import type { LucideIcon } from "lucide-react";

export type MenuAction =
  | { type: "dictionary" }
  | { type: "translate" }
  | { type: "editPinyin" }
  | { type: "copy" }
  | { type: "split"; splitAfterIndex: number }
  | { type: "mergeWithPrevious" }
  | { type: "mergeWithNext" };

export interface MenuEntry {
  label: string;
  icon: LucideIcon;
  action: MenuAction;
}

interface WordContextMenuProps {
  entries: MenuEntry[];
  focusedIndex: number;
  position: { top: number; left: number };
  direction?: "above" | "below";
  onEntryHover: (index: number) => void;
  onAction: (action: MenuAction) => void;
}

export function WordContextMenu({ entries, focusedIndex, position, direction, onEntryHover, onAction }: WordContextMenuProps) {
  return (
    <div
      role="menu"
      className="absolute z-50 w-48 rounded-lg border border-content/20 bg-surface shadow-lg py-1"
      style={{ top: position.top, left: position.left }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {entries.map(({ label, icon: Icon, action }, index) => (
        <div
          key={`${action.type}-${label}`}
          role="menuitem"
          className={`px-3 py-2 text-sm text-content cursor-default transition-colors flex items-center gap-2 ${
            index === focusedIndex ? "bg-content/10" : ""
          }`}
          onMouseEnter={() => onEntryHover(index)}
          onClick={() => onAction(action)}
        >
          <Icon size={16} strokeWidth={1.5} />
          {label}
        </div>
      ))}
    </div>
  );
}
