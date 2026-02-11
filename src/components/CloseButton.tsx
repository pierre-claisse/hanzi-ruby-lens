import { X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function CloseButton() {
  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  return (
    <button
      onClick={handleClose}
      aria-label="Close application"
      className="p-2 rounded-lg border border-ink/20 bg-paper text-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 transition-colors"
    >
      <X className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}
