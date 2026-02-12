export interface PaletteColors {
  background: string;
  text: string;
  accent: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  lightName: string;
  darkName: string;
  light: PaletteColors;
  dark: PaletteColors;
}

export const PALETTES: readonly ColorPalette[] = [
  {
    id: "vermillion-scroll",
    name: "Vermillion Scroll",
    lightName: "Lamplit Vellum",
    darkName: "Midnight Study",
    light: { background: "#FEFCF3", text: "#2D2D2D", accent: "#C84B31" },
    dark: { background: "#0E0E22", text: "#F5F0E8", accent: "#C84B31" },
  },
  {
    id: "jade-garden",
    name: "Jade Garden",
    lightName: "Bamboo Mist",
    darkName: "Firefly Dusk",
    light: { background: "#F4F8F0", text: "#2A3A2E", accent: "#2E8B57" },
    dark: { background: "#1A1024", text: "#D8ECDB", accent: "#2E8B57" },
  },
  {
    id: "indigo-silk",
    name: "Indigo Silk",
    lightName: "Porcelain Dawn",
    darkName: "Earthen Kiln",
    light: { background: "#F7F5F0", text: "#2C2C3A", accent: "#4A69BD" },
    dark: { background: "#1E120A", text: "#E0DCD6", accent: "#4A69BD" },
  },
  {
    id: "plum-blossom",
    name: "Plum Blossom",
    lightName: "Blush Parchment",
    darkName: "Teal Forest",
    light: { background: "#FBF5F3", text: "#3A2D3D", accent: "#9B2D5E" },
    dark: { background: "#091E18", text: "#F0E4E8", accent: "#9B2D5E" },
  },
  {
    id: "golden-pavilion",
    name: "Golden Pavilion",
    lightName: "Imperial Gilt",
    darkName: "Palace Lanterns",
    light: { background: "#FDF8EE", text: "#352B1E", accent: "#C48820" },
    dark: { background: "#0E0B1F", text: "#EDE4D0", accent: "#C48820" },
  },
  {
    id: "ink-wash",
    name: "Ink Wash",
    lightName: "Rice Paper",
    darkName: "Fresh Ink",
    light: { background: "#F5F5F2", text: "#333333", accent: "#777777" },
    dark: { background: "#141414", text: "#D9D9D6", accent: "#999999" },
  },
] as const;

export const DEFAULT_PALETTE_ID = "vermillion-scroll";
