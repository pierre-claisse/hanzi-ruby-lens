import { TextDisplay } from "./components/TextDisplay";
import { TitleBar } from "./components/TitleBar";
import { sampleText } from "./data/sample-text";
import { usePinyinVisibility } from "./hooks/usePinyinVisibility";

function App() {
  const [pinyinVisible, setPinyinVisible] = usePinyinVisibility();

  return (
    <>
      <TitleBar pinyinVisible={pinyinVisible} onPinyinToggle={setPinyinVisible} />
      <div className="bg-paper text-ink min-h-screen px-6 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <TextDisplay text={sampleText} showPinyin={pinyinVisible} />
        </div>
      </div>
    </>
  );
}

export default App;
