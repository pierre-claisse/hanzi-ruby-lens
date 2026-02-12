import { Maximize, Minimize } from 'lucide-react';
import { useFullscreen } from '../hooks/useFullscreen';

export function FullscreenToggle() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <button
      onClick={toggleFullscreen}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
    >
      {isFullscreen ? (
        <Minimize className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Maximize className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
}
