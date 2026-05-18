import "@testing-library/jest-dom/vitest";
// Shim IndexedDB so the db/ layer can be tested under happy-dom (which
// doesn't ship IDB) and Node.
import "fake-indexeddb/auto";
