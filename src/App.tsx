import React, { useState, useEffect, useRef } from "react";
import { EditorView } from "./components/EditorView";
import { OutputView } from "./components/OutputView";
import { LanguageSelector } from "./components/LanguageSelector";
import { PuzzleSelector } from "./components/PuzzleSelector";
import { puzzles } from "./data/puzzles";
import { executeJavaScript, mockExecuteCode } from "./utils/codeExecution";
import { ClickableImage } from "./components/ClickableImage";
import "./App.css";

// Define types
export type Language =
  | "javascript"
  | "python"
  | "java"
  | "cpp"
  | "csharp"
  | "go"
  | "rust"
  | "typescript";
export type TestResult = {
  input: string;
  expected: any;
  actual: any;
  passed: boolean;
};

export type PuzzleTest = {
  input: any[];
  expected: any;
};

export type Puzzle = {
  id: string;
  title: string;
  description: string;
  templates: Record<Language, string>;
  tests: PuzzleTest[];
};

// Views enum for managing which view is active
enum View {
  CodeEditor,
  InteractiveRoom,
}

const App: React.FC = () => {
  // Add a new state variable to control which view is shown
  const [activeView, setActiveView] = useState<View>(View.CodeEditor);

  // Your existing state variables
  const [currentLanguage, setCurrentLanguage] =
    useState<Language>("javascript");
  const [currentCode, setCurrentCode] = useState<string>(
    '// Write your code here\nconsole.log("Hello, world!");',
  );
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [output, setOutput] = useState<string | React.ReactNode>("");
  const editorRef = useRef<any>(null);

  // Path to your haunted room image - update this to the correct path
  const roomImagePath = "/haunted-room.jpg"; // Place this image in your public folder

  // Initial editor setup
  useEffect(() => {
    updateEditorContent();
  }, [currentLanguage, currentPuzzle]);

  // All your existing functions remain the same
  const updateEditorContent = () => {
    if (currentPuzzle) {
      // Load the template for the current puzzle and language
      setCurrentCode(currentPuzzle.templates[currentLanguage]);
    } else {
      // Default templates for each language
      switch (currentLanguage) {
        case "javascript":
          setCurrentCode(
            '// Write your JavaScript code here\nconsole.log("Hello, world!");',
          );
          break;
        case "python":
          setCurrentCode(
            '# Write your Python code here\nprint("Hello, world!")',
          );
          break;
        case "java":
          setCurrentCode(
            '// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}',
          );
          break;
        case "cpp":
          setCurrentCode(
            '// Write your C++ code here\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}',
          );
          break;
        case "csharp":
          setCurrentCode(
            '// Write your C# code here\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, world!");\n    }\n}',
          );
          break;
        case "go":
          setCurrentCode(
            '// Write your Go code here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, world!")\n}',
          );
          break;
        case "rust":
          setCurrentCode(
            '// Write your Rust code here\nfn main() {\n    println!("Hello, world!");\n}',
          );
          break;
        case "typescript":
          setCurrentCode(
            '// Write your TypeScript code here\nfunction greet(name: string): string {\n    return `Hello, ${name}!`;\n}\n\nconsole.log(greet("world"));',
          );
          break;
        default:
          setCurrentCode("// Write your code here");
      }
    }
  };

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
  };

  const handlePuzzleChange = (puzzleId: string) => {
    if (!puzzleId) {
      setCurrentPuzzle(null);
      updateEditorContent();
      return;
    }

    const selectedPuzzle = puzzles.find((p) => p.id === puzzleId) || null;
    setCurrentPuzzle(selectedPuzzle);
  };

  const handleLoadPuzzle = () => {
    updateEditorContent();
  };

  const handleCodeChange = (code: string) => {
    setCurrentCode(code);
  };

  const extractFunctionName = (
    code: string,
    language: Language,
  ): string | null => {
    let match;
    switch (language) {
      case "javascript":
      case "typescript":
        match = code.match(/function\s+([a-zA-Z0-9_]+)/);
        return match ? match[1] : null;
      case "python":
        match = code.match(/def\s+([a-zA-Z0-9_]+)/);
        return match ? match[1] : null;
      case "java":
        match = code.match(
          /(?:public|private|protected|static)?\s+\w+\s+([a-zA-Z0-9_]+)\s*\(/,
        );
        return match ? match[1] : null;
      default:
        return null;
    }
  };

  const runCode = () => {
    if (!currentCode.trim()) {
      setOutput("Please enter some code first.");
      return;
    }

    try {
      if (currentPuzzle) {
        if (currentLanguage === "javascript") {
          const functionName = extractFunctionName(
            currentCode,
            currentLanguage,
          );

          if (!functionName) {
            setOutput(
              "Could not find the function to test. Make sure you have defined the function correctly.",
            );
            return;
          }

          const testResults = executeJavaScript(
            currentCode,
            functionName,
            currentPuzzle.tests,
          );
          displayTestResults(testResults as TestResult[]);
        } else {
          mockExecuteCode(currentLanguage, currentPuzzle, displayTestResults);
        }
      } else {
        if (currentLanguage === "javascript") {
          const output = executeJavaScript(currentCode);
          setOutput(output);
        } else {
          setOutput(
            <div className="execution-message">
              <p>
                Code execution for {currentLanguage} would typically require a
                server-side component.
              </p>
              <p>
                In a production environment, this would send the code to a
                backend service that:
              </p>
              <ol>
                <li>Creates an isolated execution environment</li>
                <li>Compiles/interprets the code securely</li>
                <li>Runs the code with appropriate resource limits</li>
                <li>Returns the output or error messages</li>
              </ol>
              <p>
                For this demo, we're only displaying the code you've written.
              </p>
            </div>,
          );
        }
      }
    } catch (error: any) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const displayTestResults = (results: TestResult[]) => {
    const allPassed = results.every((r) => r.passed);

    const testResults = (
      <div className="test-results">
        {allPassed ? (
          <div className="test-success">✓ All tests passed successfully!</div>
        ) : (
          <div className="test-failure">
            ✗ Some tests failed. Check the details below.
          </div>
        )}

        <div className="test-details">
          {results.map((result, index) => (
            <div
              key={index}
              className={`test-case ${result.passed ? "passed" : "failed"}`}
            >
              <div className="test-header">
                Test #{index + 1}: {result.passed ? "Passed" : "Failed"}
              </div>
              <div className="test-body">
                <div>
                  <strong>Input:</strong> {result.input}
                </div>
                <div>
                  <strong>Expected:</strong> {JSON.stringify(result.expected)}
                </div>
                <div>
                  <strong>Actual:</strong> {JSON.stringify(result.actual)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    setOutput(testResults);
  };

  // Toggle between views
  const toggleView = () => {
    setActiveView(
      activeView === View.CodeEditor ? View.InteractiveRoom : View.CodeEditor,
    );
  };

  // Render the app with view switching
  return (
    <div
      className={`app-container ${activeView === View.CodeEditor ? "code-editor-view" : ""}`}
    >
      <div className="header">
        <h1>Code Editor / Interactive Room</h1>
        <button className="view-toggle-button" onClick={toggleView}>
          {activeView === View.CodeEditor
            ? "Switch to Interactive Room"
            : "Switch to Code Editor"}
        </button>
      </div>

      {activeView === View.CodeEditor ? (
        // Code Editor View
        <>
          <div className="controls">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />

            <PuzzleSelector
              puzzles={puzzles}
              onPuzzleChange={handlePuzzleChange}
              onLoadPuzzle={handleLoadPuzzle}
            />

            <button className="run-button" onClick={runCode}>
              Run Code
            </button>
          </div>

          {currentPuzzle && (
            <div className="puzzle-description">
              <strong>{currentPuzzle.title}:</strong>{" "}
              {currentPuzzle.description}
            </div>
          )}

          <div className="editor-output-container">
            <EditorView
              code={currentCode}
              language={currentLanguage}
              onChange={handleCodeChange}
              editorRef={editorRef}
            />

            <OutputView output={output} />
          </div>
        </>
      ) : (
        // Interactive Room View
        <div className="interactive-room-container">
          <h2>Escape Room Challenge</h2>
          <p>Click on objects in the room to interact with them</p>
          <ClickableImage imageSrc={roomImagePath} />
        </div>
      )}
    </div>
  );
};

export default App;

