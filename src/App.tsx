import React, { useState, useEffect, useRef } from "react";
import { EditorView } from "./components/EditorView";
import { OutputView } from "./components/OutputView";
import { LanguageSelector } from "./components/LanguageSelector";
import { PuzzleSelector } from "./components/PuzzleSelector";
import { puzzles } from "./data/puzzles";
import {
  executeCode,
  executeJavaScriptLocal,
  mockExecuteCode,
} from "./utils/codeExecution";
import { ClickableImage } from "./components/ClickableImage";
import { clickableAreas, ClickableArea } from "./types/clickableAreas";
import { PuzzleSpec, generateTemplates } from "./utils/templateGenerator";
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
  templates?: Record<Language, string>;
  tests: PuzzleTest[];
  puzzleSpec?: PuzzleSpec;
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
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(450); // Initial sidebar width in pixels
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const interactiveRoomRef = useRef<HTMLDivElement>(null); // Ref for the container of room and sidebar

  // State to track the currently selected interactive area
  const [selectedArea, setSelectedArea] = useState<ClickableArea | null>(null);

  // Add state to track solved puzzles
  const [solvedPuzzles, setSolvedPuzzles] = useState<Set<string>>(new Set());

  // Effect to update editor content based on language, selected puzzle, or selected area
  useEffect(() => {
    let newCode: string | undefined = undefined;

    if (activeView === View.InteractiveRoom && selectedArea?.puzzleSpec) {
      // In InteractiveRoom, if a clickable area with a puzzle is selected, it takes precedence
      const templates = generateTemplates(selectedArea.puzzleSpec);
      newCode = templates[currentLanguage];
    } else if (currentPuzzle) {
      // Otherwise, if a puzzle is selected via the PuzzleSelector
      if (currentPuzzle.puzzleSpec) {
        const templates = generateTemplates(currentPuzzle.puzzleSpec);
        newCode = templates[currentLanguage];
      }
      // Fallback to pre-defined templates if puzzleSpec didn't yield one or doesn't exist for the current puzzle
      if (!newCode && currentPuzzle.templates) {
        newCode = currentPuzzle.templates[currentLanguage];
      }
    }

    if (newCode) {
      setCurrentCode(newCode);
    } else {
      // Default code if no specific puzzle template applies for the current context and language
      // This also covers the case where currentPuzzle is null and not in InteractiveRoom with a puzzle area
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
  }, [currentLanguage, currentPuzzle, selectedArea, activeView]);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
  };

  const handlePuzzleChange = (puzzleId: string) => {
    if (!puzzleId) {
      setCurrentPuzzle(null);
      return;
    }

    const selectedPuzzle = puzzles.find((p) => p.id === puzzleId) || null;
    setCurrentPuzzle(selectedPuzzle);
  };

  const handleLoadPuzzle = () => {};

  const handleCodeChange = (code: string) => {
    setCurrentCode(code);
  };

  // Handle loading a code template from an interaction - FIXED
  const handleLoadCodeTemplate = (template: string) => {
    setCurrentCode(template);
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

  const runCode = async () => {
    if (!currentCode.trim()) {
      setOutput("Please enter some code first.");
      return;
    }

    try {
      if (currentPuzzle) {
        const functionName = extractFunctionName(currentCode, currentLanguage);

        if (!functionName && currentLanguage !== "javascript") {
          setOutput(
            "Could not find the function to test. Make sure you have defined the function correctly.",
          );
          return;
        }

        // Use the new async executeCode function
        const testResults = await executeCode(
          currentCode,
          currentLanguage,
          functionName,
          currentPuzzle.tests,
        );

        if (Array.isArray(testResults)) {
          displayTestResults(testResults as TestResult[]);
        } else {
          setOutput(testResults);
        }
      } else {
        // Regular code execution
        const output = await executeCode(currentCode, currentLanguage);
        setOutput(output);
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

  // Handle when a puzzle is solved in the escape room
  const handlePuzzleSolved = (areaId: string) => {
    console.log(`Puzzle solved: ${areaId}`);

    // Add this puzzle to the solved puzzles set
    const newSolvedPuzzles = new Set(solvedPuzzles);
    newSolvedPuzzles.add(areaId);
    setSolvedPuzzles(newSolvedPuzzles);

    // Show a celebration message or trigger other events
    // For example, you could show a modal, play a sound, etc.
  };

  // Handle checking puzzle solution from the editor with universal function name
  const handleCheckPuzzleSolution = (area: ClickableArea) => {
    try {
      if (!currentCode || currentCode.trim() === "") {
        alert("Please write some code in the editor first.");
        return;
      }

      // Universal function name - same for all puzzles
      const UNIVERSAL_FUNCTION_NAME = "solution";

      console.log("Checking solution for puzzle:", area.name);
      console.log("Expected value:", area.expectedValue);
      console.log("Using universal function name:", UNIVERSAL_FUNCTION_NAME);

      // Step 1: Execute user code to define functions
      try {
        eval(currentCode);
      } catch (evalError: any) {
        throw new Error(`Error in your code: ${evalError.message}`);
      }

      // Step 2: Try to call the universal function
      let userFunction;
      try {
        userFunction = eval(UNIVERSAL_FUNCTION_NAME);
      } catch (e) {
        // Function might not be in global scope, try as a property of window
        userFunction = (window as any)[UNIVERSAL_FUNCTION_NAME];
      }

      // Also try checking for language-specific function names as fallback
      if (typeof userFunction !== "function") {
        // For languages like Java/C# that use class methods
        const languageSpecificChecks = [
          "PuzzleClass.solution",
          "PuzzleClass.Solution",
          // Add any other patterns if needed
        ];

        for (const funcName of languageSpecificChecks) {
          try {
            userFunction = eval(funcName);
            if (typeof userFunction === "function") {
              console.log(`Found function using: ${funcName}`);
              break;
            }
          } catch (e) {
            // Continue to next check
          }
        }
      }

      if (typeof userFunction !== "function") {
        // Show current puzzle info in error
        throw new Error(`Function 'solution()' is not defined for the ${area.name} puzzle.

Current Puzzle: ${area.name}
${area.description || "No description available"}

Expected: You should define a function named exactly 'solution()' that returns ${area.expectedValue}

Please check the puzzle template for the correct function signature.`);
      }

      // Step 3: Call the function and get result
      const result = userFunction();
      console.log("Function result:", result);

      // Compare results (handle different types)
      let isCorrect = false;
      if (typeof result === typeof area.expectedValue) {
        isCorrect = result === area.expectedValue;
      } else {
        // Try loose comparison for number/string conversions
        isCorrect = result == area.expectedValue;
      }

      if (isCorrect) {
        // Mark as solved locally
        const newSolvedPuzzles = new Set(solvedPuzzles);
        newSolvedPuzzles.add(area.id);
        setSolvedPuzzles(newSolvedPuzzles);

        // Update selected area
        setSelectedArea({
          ...area,
          puzzleCompleted: true,
        });

        alert(`🎉 Excellent! You've solved the ${area.name} puzzle!

Your solution: ${result}
Expected: ${area.expectedValue}

The door unlocks with a satisfying click!`);
      } else {
        alert(`❌ Not the right answer for ${area.name}

Your result: ${result} (${typeof result})
Expected: ${area.expectedValue} (${typeof area.expectedValue})

Try reviewing the puzzle description and hints.`);
      }
    } catch (error: any) {
      console.error("Error in handleCheckPuzzleSolution:", error);
      alert(`Error checking your solution: ${error.message}`);
    }
  };

  // Toggle sidebar visibility in interactive view
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Toggle between views
  const toggleView = () => {
    setActiveView(
      activeView === View.CodeEditor ? View.InteractiveRoom : View.CodeEditor,
    );
    // Reset sidebar width when switching to interactive view if it was collapsed
    if (activeView === View.CodeEditor && sidebarWidth < 100) {
      setSidebarWidth(450);
      setShowSidebar(true);
    }
  };

  // Handlers for sidebar resizing
  const handleMouseDownOnResizeHandle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !interactiveRoomRef.current) return;
      // Calculate new width based on mouse position relative to the right edge of the screen
      // or the edge of the interactiveRoomRef if it's not full screen.
      const newWidth = window.innerWidth - e.clientX;

      // Apply constraints to sidebar width (e.g., min 200px, max 800px or 50% of window)
      const minWidth = 200;
      const maxWidth = Math.min(800, window.innerWidth * 0.7);

      if (newWidth > minWidth && newWidth < maxWidth) {
        setSidebarWidth(newWidth);
      } else if (newWidth <= minWidth) {
        setSidebarWidth(minWidth);
      } else {
        setSidebarWidth(maxWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Render the app with view switching
  return (
    <div
      className={`app-container ${activeView === View.CodeEditor ? "code-editor-view" : "interactive-view"}`}
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
              currentArea={selectedArea}
              onCheckSolution={handleCheckPuzzleSolution}
            />

            <OutputView output={output} />
          </div>
        </>
      ) : (
        // Interactive Room View with Monaco editor sidebar
        <div className="interactive-room-with-editor" ref={interactiveRoomRef}>
          <div className="interactive-room-container">
            <h2>Escape Room Challenge</h2>
            <p>Click on objects in the room to interact with them</p>
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              {showSidebar ? "Hide Editor" : "Show Editor"}
            </button>
            <ClickableImage
              imageSrc="/haunted-room.jpg"
              areas={clickableAreas}
              currentCode={currentCode}
              currentLanguage={currentLanguage}
              onPuzzleSolved={handlePuzzleSolved}
              onLoadCodeTemplate={handleLoadCodeTemplate}
              onSelectArea={setSelectedArea}
            />
          </div>

          {showSidebar && (
            <>
              <div
                className="resize-handle"
                onMouseDown={handleMouseDownOnResizeHandle}
              />
              <div
                className="editor-sidebar"
                style={{ width: `${sidebarWidth}px` }}
              >
                <div className="sidebar-controls">
                  <LanguageSelector
                    currentLanguage={currentLanguage}
                    onLanguageChange={handleLanguageChange}
                  />
                  <button className="run-button" onClick={runCode}>
                    Run Code
                  </button>
                </div>

                <div className="sidebar-editor">
                  <EditorView
                    code={currentCode}
                    language={currentLanguage}
                    onChange={handleCodeChange}
                    editorRef={editorRef}
                    currentArea={selectedArea}
                    onCheckSolution={handleCheckPuzzleSolution}
                  />
                </div>

                <div className="sidebar-output">
                  <OutputView output={output} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
