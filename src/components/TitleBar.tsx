import { PinyinToggle } from './PinyinToggle';
import { ThemeToggle } from './ThemeToggle';
import { FullscreenToggle } from './FullscreenToggle';
import { CloseButton } from './CloseButton';

interface TitleBarProps {
  pinyinVisible: boolean;
  onPinyinToggle: (visible: boolean) => void;
}

export function TitleBar({ pinyinVisible, onPinyinToggle }: TitleBarProps) {
  return (
    <header
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-12 bg-paper border-b border-ink/10 flex items-center justify-between px-4 z-50"
    >
      <h1 data-tauri-drag-region className="text-sm text-ink font-medium">Hanzi Ruby Lens</h1>

      <div className="flex gap-1">
        <PinyinToggle visible={pinyinVisible} onToggle={onPinyinToggle} />
        <ThemeToggle />
        <FullscreenToggle />
        <CloseButton />
      </div>
    </header>
  );
}
