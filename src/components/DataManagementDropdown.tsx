import { useState, useRef, useEffect } from "react";
import { Database, Download, Upload, Trash2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { message, confirm } from "@tauri-apps/plugin-dialog";

interface ExportResult {
  textCount: number;
  tagCount: number;
}

interface ImportResult {
  textCount: number;
  tagCount: number;
}

interface DataManagementDropdownProps {
  onImportComplete: () => void;
  onResetComplete: () => void;
}

const MENU_ITEMS = [
  { id: "export", label: "Export", icon: Download },
  { id: "import", label: "Import", icon: Upload },
  { id: "reset", label: "Reset", icon: Trash2 },
] as const;

type MenuAction = (typeof MENU_ITEMS)[number]["id"];

export function DataManagementDropdown({ onImportComplete, onResetComplete }: DataManagementDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  const handleExport = async () => {
    setIsOpen(false);
    try {
      const filePath = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: "hanzi-ruby-lens-export.json",
      });
      if (!filePath) return;
      const result = await invoke<ExportResult>("export_database", { filePath });
      await message(`Export successful: ${result.textCount} text(s), ${result.tagCount} tag(s).`, {
        title: "Export",
        kind: "info",
      });
    } catch (err) {
      const msg = typeof err === "string" ? err : "Export failed. Please try again.";
      await message(msg, { title: "Export Error", kind: "error" });
    }
  };

  const handleImport = async () => {
    setIsOpen(false);
    try {
      const filePath = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
        directory: false,
      });
      if (!filePath) return;
      const confirmed = await confirm(
        "All current data will be permanently replaced by the imported file. This cannot be undone.",
        { title: "Import — Confirm Overwrite", kind: "warning" },
      );
      if (!confirmed) return;
      const result = await invoke<ImportResult>("import_database", { filePath });
      onImportComplete();
      await message(`Import successful: ${result.textCount} text(s), ${result.tagCount} tag(s).`, {
        title: "Import",
        kind: "info",
      });
    } catch (err) {
      const msg = typeof err === "string" ? err : "Import failed. The file may be invalid.";
      await message(msg, { title: "Import Error", kind: "error" });
    }
  };

  const handleReset = async () => {
    setIsOpen(false);
    try {
      const confirmed = await confirm(
        "All texts, tags, and tag assignments will be permanently deleted. This cannot be undone.",
        { title: "Reset — Confirm Deletion", kind: "warning" },
      );
      if (!confirmed) return;
      await invoke("reset_database");
      onResetComplete();
      await message("All data has been deleted.", { title: "Reset", kind: "info" });
    } catch (err) {
      const msg = typeof err === "string" ? err : "Reset failed. Please try again.";
      await message(msg, { title: "Reset Error", kind: "error" });
    }
  };

  const handleAction = (action: MenuAction) => {
    switch (action) {
      case "export":
        handleExport();
        break;
      case "import":
        handleImport();
        break;
      case "reset":
        handleReset();
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => (i + 1) % MENU_ITEMS.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
        break;
      case "Enter":
        e.preventDefault();
        handleAction(MENU_ITEMS[focusedIndex].id);
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
    }
  };

  const handleToggleClick = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      setFocusedIndex(0);
    }
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        onClick={handleToggleClick}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Data management"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
      >
        <Database className="w-5 h-5" aria-hidden="true" />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-activedescendant={`data-mgmt-${MENU_ITEMS[focusedIndex].id}`}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-content/20 bg-surface shadow-lg py-1 z-50"
        >
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isFocused = index === focusedIndex;

            return (
              <li
                key={item.id}
                id={`data-mgmt-${item.id}`}
                role="option"
                aria-selected={isFocused}
                onClick={() => handleAction(item.id)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  isFocused ? "bg-content/10" : ""
                }`}
              >
                <Icon className="w-4 h-4 text-content/60" aria-hidden="true" />
                <span className="text-sm text-content">{item.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
