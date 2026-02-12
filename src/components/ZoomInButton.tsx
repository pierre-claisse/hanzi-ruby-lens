import { ZoomIn } from "lucide-react";

interface ZoomInButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function ZoomInButton({ onClick, disabled }: ZoomInButtonProps) {
  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label="Zoom in"
      className="p-1.5 rounded-lg border border-ink/20 bg-paper text-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-paper"
    >
      <ZoomIn className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}
