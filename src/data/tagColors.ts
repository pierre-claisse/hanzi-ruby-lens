export interface TagColor {
  key: string;
  label: string;
  bg: string;
  text: string;
}

export const TAG_COLORS: readonly TagColor[] = [
  { key: "red",     label: "Red",     bg: "#EF4444", text: "#FFFFFF" },
  { key: "orange",  label: "Orange",  bg: "#F97316", text: "#FFFFFF" },
  { key: "amber",   label: "Amber",   bg: "#F59E0B", text: "#1A1A1A" },
  { key: "green",   label: "Green",   bg: "#22C55E", text: "#FFFFFF" },
  { key: "teal",    label: "Teal",    bg: "#14B8A6", text: "#FFFFFF" },
  { key: "blue",    label: "Blue",    bg: "#3B82F6", text: "#FFFFFF" },
  { key: "indigo",  label: "Indigo",  bg: "#6366F1", text: "#FFFFFF" },
  { key: "purple",  label: "Purple",  bg: "#A855F7", text: "#FFFFFF" },
  { key: "pink",    label: "Pink",    bg: "#EC4899", text: "#FFFFFF" },
  { key: "slate",   label: "Slate",   bg: "#64748B", text: "#FFFFFF" },
] as const;
