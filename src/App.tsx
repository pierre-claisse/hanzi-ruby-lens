import { TextDisplay } from "./components/TextDisplay";
import { TitleBar } from "./components/TitleBar";
import { sampleText } from "./data/sample-text";

function App() {
  return (
    <>
      <TitleBar />
      <div className="bg-paper text-ink min-h-screen px-6 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <TextDisplay text={sampleText} />
        </div>
      </div>
    </>
  );
}

export default App;
