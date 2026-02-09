import { TextDisplay } from "./components/TextDisplay";
import { sampleText } from "./data/sample-text";

function App() {
  return (
    <div className="bg-paper text-ink min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <TextDisplay text={sampleText} />
      </div>
    </div>
  );
}

export default App;
