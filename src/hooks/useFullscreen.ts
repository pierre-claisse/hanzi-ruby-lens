import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
}

export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(() => {
    return localStorage.getItem('fullscreenPreference') === 'true';
  });

  // Apply saved state on mount
  useEffect(() => {
    const appWindow = getCurrentWindow();
    appWindow.setFullscreen(isFullscreen);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.code === 'Escape' && isFullscreen) {
        await toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    const appWindow = getCurrentWindow();
    const newState = !isFullscreen;

    if (newState) {
      await appWindow.setResizable(false);
      await appWindow.setFullscreen(true);
    } else {
      await appWindow.setFullscreen(false);
      await appWindow.setResizable(true);
    }

    setIsFullscreen(newState);
    localStorage.setItem('fullscreenPreference', String(newState));
  };

  return { isFullscreen, toggleFullscreen };
}
