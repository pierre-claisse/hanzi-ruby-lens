import { useEffect, useCallback } from "react";
import { TextDisplay } from "./components/TextDisplay";
import { TitleBar } from "./components/TitleBar";
import { LibraryScreen } from "./components/LibraryScreen";
import { TextInputView } from "./components/TextInputView";
import { ProcessingState } from "./components/ProcessingState";
import { usePinyinVisibility } from "./hooks/usePinyinVisibility";
import { useTextZoom } from "./hooks/useTextZoom";
import { useTheme } from "./hooks/useTheme";
import { useColorPalette } from "./hooks/useColorPalette";
import { useTextLoader } from "./hooks/useTextLoader";
import { useElapsedTime } from "./hooks/useElapsedTime";

function App() {
  const {
    previews,
    activeText,
    isLoading,
    appView,
    setView,
    createText,
    openText,
    updatePinyin,
    splitSegment,
    mergeSegments,
    deleteText,
    refreshPreviews,
    isProcessing,
    processingError,
  } = useTextLoader();
  const [pinyinVisible, setPinyinVisible] = usePinyinVisibility();
  const { zoomLevel, zoomIn, zoomOut, isMinZoom, isMaxZoom } = useTextZoom();
  const [theme, setTheme] = useTheme();
  const { paletteId, setPalette, palettes } = useColorPalette();
  const { formatted: elapsedTime } = useElapsedTime(isProcessing);

  // Suppress Space key on all buttons — Enter is the only activation key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " && e.target instanceof HTMLButtonElement) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Suppress default browser context menu on right-click
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

  const handleAddText = useCallback(() => {
    setView("input");
  }, [setView]);

  const handleSubmit = useCallback((title: string, rawInput: string) => {
    createText(title, rawInput);
  }, [createText]);

  const handleCancel = useCallback(() => {
    setView("library");
  }, [setView]);

  const handleBack = useCallback(() => {
    refreshPreviews();
    setView("library");
  }, [setView, refreshPreviews]);

  const handleShowPinyin = useCallback(() => {
    setPinyinVisible(true);
  }, [setPinyinVisible]);

  const showBack = appView === "reading";

  const renderContent = () => {
    if (isLoading) return null;

    switch (appView) {
      case "library":
        return (
          <LibraryScreen
            previews={previews}
            onOpenText={openText}
            onDeleteText={deleteText}
          />
        );
      case "input":
        return (
          <div className="bg-surface text-content h-screen pt-16 pb-4 flex flex-col">
            <TextInputView
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        );
      case "processing":
        return (
          <div className="bg-surface text-content h-screen pt-24 pb-12 flex flex-col">
            <ProcessingState
              isProcessing={isProcessing}
              error={processingError}
              elapsedTime={elapsedTime}
              onProcess={handleCancel}
              onRetry={handleCancel}
              onEdit={handleCancel}
            />
          </div>
        );
      case "reading":
        return (
          <div className="bg-surface text-content min-h-screen px-8 pt-24 pb-12">
            <div className="max-w-5xl mx-auto">
              {activeText && (
                <TextDisplay text={activeText} showPinyin={pinyinVisible} zoomLevel={zoomLevel} onPinyinEdit={updatePinyin} onShowPinyin={handleShowPinyin} onSplitSegment={splitSegment} onMergeSegments={mergeSegments} />
              )}
            </div>
          </div>
        );
    }
  };

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
        palettes={palettes}
        selectedPaletteId={paletteId}
        onPaletteSelect={setPalette}
        theme={theme}
        onThemeToggle={toggleTheme}
        onBack={handleBack}
        showBack={showBack}
        rawInput={activeText?.rawInput ?? ""}
        onAddText={handleAddText}
        showAddButton={appView === "library"}
        textTitle={showBack ? activeText?.title : undefined}
      />
      {renderContent()}
    </>
  );
}

export default App;
