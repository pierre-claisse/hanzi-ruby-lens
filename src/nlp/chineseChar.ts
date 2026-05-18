/**
 * True for a CJK Unified Ideograph (incl. extensions A–H) or a CJK
 * Compatibility Ideograph. Same ranges as the previous Rust
 * `processing::is_chinese_char`.
 */
export function isChineseChar(codePoint: number): boolean {
  return (
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x20000 && codePoint <= 0x2a6df) ||
    (codePoint >= 0x2a700 && codePoint <= 0x2b73f) ||
    (codePoint >= 0x2b740 && codePoint <= 0x2b81f) ||
    (codePoint >= 0x2b820 && codePoint <= 0x2ceaf) ||
    (codePoint >= 0x2ceb0 && codePoint <= 0x2ebef) ||
    (codePoint >= 0x30000 && codePoint <= 0x3134f) ||
    (codePoint >= 0x31350 && codePoint <= 0x323af) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff)
  );
}

/** Convenience wrapper accepting a single-character string. */
export function isChineseCharStr(ch: string): boolean {
  const cp = ch.codePointAt(0);
  return cp !== undefined && isChineseChar(cp);
}
