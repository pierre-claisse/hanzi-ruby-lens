import { useMinWidth } from "../hooks/useMinWidth";

export function MinWidthOverlay() {
  const isBelowMinWidth = useMinWidth();

  if (!isBelowMinWidth) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper text-ink p-8">
      <p className="text-center text-lg font-sans leading-relaxed max-w-xs">
        Please widen the window to continue reading. A minimum width is required
        to preserve the integrity of the text layout.
      </p>
    </div>
  );
}
