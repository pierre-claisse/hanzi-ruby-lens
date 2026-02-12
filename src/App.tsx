import { TextDisplay } from "./components/TextDisplay";
import { TitleBar } from "./components/TitleBar";
import { sampleText } from "./data/sample-text";
import { usePinyinVisibility } from "./hooks/usePinyinVisibility";
import { useTextZoom } from "./hooks/useTextZoom";

function App() {
  const [pinyinVisible, setPinyinVisible] = usePinyinVisibility();
  const { zoomLevel, zoomIn, zoomOut, isMinZoom, isMaxZoom } = useTextZoom();

  return (
    <>
      <TitleBar
        pinyinVisible={pinyinVisible}
        onPinyinToggle={setPinyinVisible}
        zoomLevel={zoomLevel}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        isMinZoom={isMinZoom}
        isMaxZoom={isMaxZoom}
      />
      <div className="bg-paper text-ink min-h-screen px-6 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <TextDisplay text={sampleText} showPinyin={pinyinVisible} zoomLevel={zoomLevel} />
        </div>
      </div>
    </>
  );
}

export default App;
