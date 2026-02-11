import { ThemeToggle } from './ThemeToggle';
import { FullscreenToggle } from './FullscreenToggle';
import { CloseButton } from './CloseButton';

export function TitleBar() {
  return (
    <header
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-12 bg-paper border-b border-ink/10 flex items-center justify-between px-4 z-50"
    >
      <h1 className="text-sm text-ink font-medium">Hanzi Ruby Lens</h1>

      <div className="flex gap-2">
        <ThemeToggle />
        <FullscreenToggle />
        <CloseButton />
      </div>
    </header>
  );
}
