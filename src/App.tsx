import { useEffect } from "react";
import { TextDisplay } from "./components/TextDisplay";
import { TitleBar } from "./components/TitleBar";
import { usePinyinVisibility } from "./hooks/usePinyinVisibility";
import { useTextZoom } from "./hooks/useTextZoom";
import { useTheme } from "./hooks/useTheme";
import { useColorPalette } from "./hooks/useColorPalette";
import { useTextLoader } from "./hooks/useTextLoader";

function App() {
  const { text } = useTextLoader();
  const [pinyinVisible, setPinyinVisible] = usePinyinVisibility();
  const { zoomLevel, zoomIn, zoomOut, isMinZoom, isMaxZoom } = useTextZoom();
  const [theme, setTheme] = useTheme();
  const { paletteId, setPalette, palettes } = useColorPalette();

  // Suppress Space key on all buttons — Enter is the only activation key (FR-028)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " && e.target instanceof HTMLButtonElement) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Suppress default browser context menu on right-click (FR-001)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <div className="bg-surface text-content min-h-screen px-8 pt-24 pb-12">
        <div className="max-w-5xl mx-auto">
          <TextDisplay text={text} showPinyin={pinyinVisible} zoomLevel={zoomLevel} />
        </div>
      </div>
      <TitleBar
        pinyinVisible={pinyinVisible}
        onPinyinToggle={setPinyinVisible}
        zoomLevel={zoomLevel}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        isMinZoom={isMinZoom}
        isMaxZoom={isMaxZoom}
        palettes={palettes}
        selectedPaletteId={paletteId}
        onPaletteSelect={setPalette}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
    </>
  );
}

export default App;
