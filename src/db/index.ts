export { getDatabase, __resetDatabaseForTests } from "./connection";
export { DB_NAME } from "./schema";
export {
  insertText,
  listTexts,
  loadText,
  updatePinyin,
  splitSegment,
  mergeSegments,
  updateWordComment,
  toggleLock,
  deleteText,
  type TokenizePinyin,
} from "./textsRepo";
export {
  listTags,
  createTag,
  updateTag,
  deleteTag,
  assignTag,
  removeTag,
} from "./tagsRepo";
export {
  listSessionsInRange,
  createSession,
  updateSession,
  deleteSession,
  type CreateSessionInput,
  type UpdateSessionInput,
} from "./sessionsRepo";
export {
  exportAll,
  importAll,
  validateExportPayload,
  resetAll,
  type ExportPayload,
  type ExportText,
  type ExportTag,
  type ExportTextTag,
  type ExportSession,
  type ExportSessionText,
  type ImportResult,
} from "./exportImport";
