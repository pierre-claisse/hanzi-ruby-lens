import { useEffect, useRef, useCallback } from "react";
import { TextDisplay } from "./components/TextDisplay";
import { TitleBar } from "./components/TitleBar";
import { EmptyState } from "./components/EmptyState";
import { TextInputView } from "./components/TextInputView";
import { ProcessingState } from "./components/ProcessingState";
import { usePinyinVisibility } from "./hooks/usePinyinVisibility";
import { useTextZoom } from "./hooks/useTextZoom";
import { useTheme } from "./hooks/useTheme";
import { useColorPalette } from "./hooks/useColorPalette";
import { useTextLoader } from "./hooks/useTextLoader";
import type { AppView } from "./hooks/useTextLoader";

function App() {
  const {
    text,
    isLoading,
    appView,
    setView,
    saveText,
    processText,
    updatePinyin,
    isProcessing,
    processingError,
    retryProcessing,
  } = useTextLoader();
  const [pinyinVisible, setPinyinVisible] = usePinyinVisibility();
  const { zoomLevel, zoomIn, zoomOut, isMinZoom, isMaxZoom } = useTextZoom();
  const [theme, setTheme] = useTheme();
  const { paletteId, setPalette, palettes } = useColorPalette();
  const previousViewRef = useRef<AppView>(appView);

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

  const handleEnterText = useCallback(() => {
    previousViewRef.current = appView;
    setView("input");
  }, [appView, setView]);

  const handleSubmit = useCallback(async (rawInput: string) => {
    await saveText(rawInput);
    if (rawInput === "") {
      setView("empty");
    } else {
      setView("processing");
      processText(rawInput).catch(() => {
        // Error is handled by processingError state in useTextLoader
      });
    }
  }, [saveText, setView, processText]);

  const handleCancel = useCallback(() => {
    setView(previousViewRef.current);
  }, [setView]);

  const handleEdit = useCallback(() => {
    previousViewRef.current = appView;
    setView("input");
  }, [appView, setView]);

  const handleShowPinyin = useCallback(() => {
    setPinyinVisible(true);
  }, [setPinyinVisible]);

  const showEdit = appView === "reading" || appView === "processing";

  const renderContent = () => {
    if (isLoading) return null;

    switch (appView) {
      case "empty":
        return (
          <div className="bg-surface text-content min-h-screen pt-24 pb-12">
            <EmptyState onEnterText={handleEnterText} />
          </div>
        );
      case "input":
        return (
          <div className="bg-surface text-content h-screen pt-16 pb-4 flex flex-col">
            <TextInputView
              initialValue={text?.rawInput ?? ""}
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
              onProcess={retryProcessing}
              onRetry={retryProcessing}
              onEdit={handleEdit}
            />
          </div>
        );
      case "reading":
        return (
          <div className="bg-surface text-content min-h-screen px-8 pt-24 pb-12">
            <div className="max-w-5xl mx-auto">
              <TextDisplay text={text!} showPinyin={pinyinVisible} zoomLevel={zoomLevel} onPinyinEdit={updatePinyin} onShowPinyin={handleShowPinyin} />
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {renderContent()}
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
        onEdit={handleEdit}
        showEdit={showEdit}
      />
    </>
  );
}

export default App;
