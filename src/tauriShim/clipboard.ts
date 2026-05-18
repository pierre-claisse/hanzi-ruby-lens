// Drop-in for `@tauri-apps/plugin-clipboard-manager`. The browser's
// Clipboard API is well-supported in modern Chromium / Firefox / Safari.

export async function writeText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older browsers (no permission policy needed): copy via a
  // hidden textarea + execCommand. Deprecated but still widely supported.
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } finally {
    ta.remove();
  }
}
