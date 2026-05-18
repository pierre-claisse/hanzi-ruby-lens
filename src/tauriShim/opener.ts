// Drop-in for `@tauri-apps/plugin-opener`. Opens an external URL in a
// new tab; Tauri previously delegated to the OS shell.

export async function openUrl(url: string): Promise<void> {
  window.open(url, "_blank", "noopener,noreferrer");
}

// Some call sites import `open` instead — keep an alias for safety.
export const open = openUrl;
