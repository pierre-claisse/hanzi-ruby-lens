// Drop-in for `@tauri-apps/plugin-dialog`. Replaces Tauri's native
// message / confirm boxes with the browser-native equivalents — good
// enough for v1 of the PWA. A custom-styled modal could come later.

type Kind = "info" | "warning" | "error" | undefined;

export interface MessageOptions {
  title?: string;
  kind?: Kind;
}

export async function message(
  text: string,
  options: MessageOptions = {},
): Promise<void> {
  const prefix = options.title ? `${options.title}\n\n` : "";
  // window.alert is synchronous; wrap as promise for API parity.
  window.alert(prefix + text);
}

export async function confirm(
  text: string,
  options: MessageOptions = {},
): Promise<boolean> {
  const prefix = options.title ? `${options.title}\n\n` : "";
  return window.confirm(prefix + text);
}

// Save dialog: Tauri returned a string path or null. In the browser we
// don't choose paths; the export flow uses a download anchor instead.
// Callers should pass the desired filename directly and stop calling save().
export async function save(options?: {
  defaultPath?: string;
  filters?: unknown;
}): Promise<string | null> {
  return options?.defaultPath ?? "hanzi-ruby-lens-export.json";
}

// Open dialog: returns a fake string path. Real file content must reach
// the IDB importer via a different channel — see `import_database` shim,
// which now expects `fileContent` instead of `filePath`.
export async function open(_options?: {
  multiple?: boolean;
  filters?: unknown;
}): Promise<string | string[] | null> {
  return null;
}
