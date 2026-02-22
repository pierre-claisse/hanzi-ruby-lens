# Quickstart: Processing Elapsed Timer

**Branch**: `021-processing-timer` | **Date**: 2026-02-22

## Files to Create

1. **`src/hooks/useElapsedTime.ts`** — Custom hook: starts/stops a 1-second interval timer driven by an `isRunning` boolean. Exports `formatElapsed()` for direct testing.

2. **`src/hooks/useElapsedTime.test.ts`** — Unit tests using `vi.useFakeTimers()` to verify: starts at 0, increments each second, resets on restart, stops cleanly, formats correctly.

## Files to Modify

3. **`src/App.tsx`** — Import `useElapsedTime`, call it with `isProcessing`, pass `formatted` to `ProcessingState`.

4. **`src/components/ProcessingState.tsx`** — Add `elapsedTime?: string` prop. When `isProcessing` and `elapsedTime` is provided, render: `Processing text... ({elapsedTime})`.

## Implementation Order

1. `useElapsedTime` hook + `formatElapsed` function
2. `useElapsedTime.test.ts` (TDD: write tests first or alongside)
3. Wire hook in `App.tsx`
4. Update `ProcessingState.tsx` to display the prop
5. Run `npm test` to verify all tests pass
