interface WordContextMenuProps {
  focusedIndex: number;
  position: { top: number; left: number };
  onEntryHover: (index: number) => void;
}

const MENU_ENTRIES = ["Option 1", "Option 2"];

export function WordContextMenu({ focusedIndex, position, onEntryHover }: WordContextMenuProps) {
  return (
    <div
      role="menu"
      className="absolute z-50 w-40 rounded-lg border border-content/20 bg-surface shadow-lg py-1"
      style={{ top: position.top, left: position.left }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
    >
      {MENU_ENTRIES.map((label, index) => (
        <div
          key={label}
          role="menuitem"
          className={`px-3 py-2 text-sm text-content cursor-default transition-colors ${
            index === focusedIndex ? "bg-content/10" : ""
          }`}
          onMouseEnter={() => onEntryHover(index)}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
