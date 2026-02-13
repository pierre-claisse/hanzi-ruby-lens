import { BookSearch, Languages, Copy } from "lucide-react";

interface WordContextMenuProps {
  focusedIndex: number;
  position: { top: number; left: number };
  onEntryHover: (index: number) => void;
  onAction: (index: number) => void;
}

const MENU_ENTRIES = [
  { label: "MOE Dictionary", icon: BookSearch },
  { label: "Google Translate", icon: Languages },
  { label: "Copy", icon: Copy },
];

export function WordContextMenu({ focusedIndex, position, onEntryHover, onAction }: WordContextMenuProps) {
  return (
    <div
      role="menu"
      className="absolute z-50 w-48 rounded-lg border border-content/20 bg-surface shadow-lg py-1"
      style={{ top: position.top, left: position.left }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
    >
      {MENU_ENTRIES.map(({ label, icon: Icon }, index) => (
        <div
          key={label}
          role="menuitem"
          className={`px-3 py-2 text-sm text-content cursor-default transition-colors flex items-center gap-2 ${
            index === focusedIndex ? "bg-content/10" : ""
          }`}
          onMouseEnter={() => onEntryHover(index)}
          onClick={() => onAction(index)}
        >
          <Icon size={16} />
          {label}
        </div>
      ))}
    </div>
  );
}
