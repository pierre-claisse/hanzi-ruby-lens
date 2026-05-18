// Drop-in for `@tauri-apps/api/window`. None of these operations have a
// meaningful browser equivalent (a webpage can't close its own tab or
// programmatically resize the OS window). They become no-ops in the PWA.
// Phase 8 will remove the call sites entirely.

class StubWindow {
  async close(): Promise<void> {
    // Browsers refuse `window.close()` on tabs not opened by script — silent
    // no-op is the only sane choice.
  }
  async setFullscreen(_fullscreen: boolean): Promise<void> {
    try {
      if (_fullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else if (!_fullscreen && document.fullscreenElement) {
        await document.exitFullscreen?.();
      }
    } catch {
      // Fullscreen requires a user-gesture; in tests there's none, ignore.
    }
  }
  async isFullscreen(): Promise<boolean> {
    return !!document.fullscreenElement;
  }
  async setResizable(_resizable: boolean): Promise<void> {
    // Not applicable in a browser.
  }
}

export function getCurrentWindow(): StubWindow {
  return new StubWindow();
}
