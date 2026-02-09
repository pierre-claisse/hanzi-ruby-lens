import { TextDisplay } from "./components/TextDisplay";
import { ThemeToggle } from "./components/ThemeToggle";
import { sampleText } from "./data/sample-text";

function App() {
  return (
    <div className="bg-paper text-ink min-h-screen px-6 py-12">
      <ThemeToggle />
      <div className="max-w-2xl mx-auto">
        <TextDisplay text={sampleText} />
      </div>
    </div>
  );
}

export default App;
