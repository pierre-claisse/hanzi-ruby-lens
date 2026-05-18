import { DB_NAME, __resetDatabaseForTests } from "../../../src/db";

/**
 * Wipe the IndexedDB between tests so each one starts from a clean slate.
 * Mirrors the per-test in-memory DB used in the Rust suite.
 */
export async function resetDb(): Promise<void> {
  await __resetDatabaseForTests();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("delete blocked"));
  });
}
