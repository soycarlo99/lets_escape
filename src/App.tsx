import React, { useState, useEffect, useRef } from "react";
import { EditorView } from "./components/EditorView";
import { OutputView } from "./components/OutputView";
import { LanguageSelector } from "./components/LanguageSelector";
import { ClickableImage } from "./components/ClickableImage";
import { RoomEditor } from "./components/RoomEditor";
import { clickableAreas, ClickableArea } from "./types/clickableAreas";
import { executeCode } from "./utils/codeExecution";
import "./styles/main.css";
import "./styles/room-editor.css";

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

// Views enum for managing which view is active
enum View {
  CodeEditor,
  InteractiveRoom,
  RoomEditor, // Add new view for room editor
}

const App: React.FC = () => {
  // Add a new state variable to control which view is shown
  const [activeView, setActiveView] = useState<View>(View.CodeEditor);

  // State variables
  const [currentLanguage, setCurrentLanguage] =
    useState<Language>("javascript");
  const [currentCode, setCurrentCode] = useState<string>(
    '// Write your code here\nconsole.log("Hello, world!");',
  );
  const [output, setOutput] = useState<string | React.ReactNode>("");
  const editorRef = useRef<any>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(450);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const interactiveRoomRef = useRef<HTMLDivElement>(null);

  // State to track the currently selected interactive area
  const [selectedArea, setSelectedArea] = useState<ClickableArea | null>(null);

  // Effect to update editor content based on language
  useEffect(() => {
    // Default code for each language
    switch (currentLanguage) {
      case "javascript":
        setCurrentCode(
          '// Write your JavaScript code here\nconsole.log("Hello, world!");',
        );
        break;
      case "python":
        setCurrentCode('# Write your Python code here\nprint("Hello, world!")');
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
  }, [currentLanguage]);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
  };

  const handleCodeChange = (code: string) => {
    setCurrentCode(code);
  };

  // Handle loading a code template from an interaction
  const handleLoadCodeTemplate = (template: string) => {
    setCurrentCode(template);
  };

  const runCode = async () => {
    if (!currentCode.trim()) {
      setOutput("Please enter some code first.");
      return;
    }

    try {
      // Regular code execution
      const output = await executeCode(currentCode, currentLanguage);
      setOutput(output);
    } catch (error: any) {
      setOutput(`Error: ${error.message}`);
    }
  };

  // Toggle sidebar visibility in interactive view
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Switch to the Room Editor view
  const switchToRoomEditor = () => {
    setActiveView(View.RoomEditor);
  };

  // Switch between other views
  const toggleView = () => {
    if (activeView === View.CodeEditor) {
      setActiveView(View.InteractiveRoom);
      // Reset sidebar width when switching to interactive view if it was collapsed
      if (sidebarWidth < 100) {
        setSidebarWidth(450);
        setShowSidebar(true);
      }
    } else if (activeView === View.InteractiveRoom) {
      setActiveView(View.CodeEditor);
    } else {
      // If in RoomEditor, go back to Code Editor
      setActiveView(View.CodeEditor);
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
      const newWidth = window.innerWidth - e.clientX;
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
      className={`app-container ${
        activeView === View.CodeEditor
          ? "code-editor-view"
          : activeView === View.InteractiveRoom
            ? "interactive-view"
            : "room-editor-view"
      }`}
    >
      <div className="header">
        <h1>
          {activeView === View.CodeEditor
            ? "Code Editor"
            : activeView === View.InteractiveRoom
              ? "Interactive Room"
              : "Room Editor"}
        </h1>

        <div className="header-buttons">
          {activeView !== View.RoomEditor && (
            <button
              className="room-editor-button"
              onClick={switchToRoomEditor}
              title="Open the Room Editor to create your own escape rooms"
            >
              Room Editor
            </button>
          )}

          <button className="view-toggle-button" onClick={toggleView}>
            {activeView === View.CodeEditor
              ? "Switch to Interactive Room"
              : activeView === View.InteractiveRoom
                ? "Switch to Code Editor"
                : "Return to Code Editor"}
          </button>
        </div>
      </div>

      {activeView === View.CodeEditor && (
        // Code Editor View
        <>
          <div className="controls">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
            <button className="run-button" onClick={runCode}>
              Run Code
            </button>
          </div>

          <div className="editor-output-container">
            <EditorView
              code={currentCode}
              language={currentLanguage}
              onChange={handleCodeChange}
              editorRef={editorRef}
              currentArea={selectedArea}
            />

            <OutputView output={output} />
          </div>
        </>
      )}

      {activeView === View.InteractiveRoom && (
        // Interactive Room View with Monaco editor sidebar
        <div className="interactive-room-with-editor" ref={interactiveRoomRef}>
          <div className="interactive-room-container">
            <h2>Interactive Room</h2>
            <p>Click on objects in the room to interact with them</p>
            <ClickableImage
              imageSrc="/haunted-room.jpg"
              areas={clickableAreas}
              currentCode={currentCode}
              currentLanguage={currentLanguage}
              onLoadCodeTemplate={handleLoadCodeTemplate}
              onSelectArea={setSelectedArea}
            />
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {showSidebar ? "Hide Editor" : "Show Editor"}
          </button>

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
                </div>

                <div className="sidebar-editor">
                  <EditorView
                    code={currentCode}
                    language={currentLanguage}
                    onChange={handleCodeChange}
                    editorRef={editorRef}
                    currentArea={selectedArea}
                  />
                  <button className="run-button" onClick={runCode}>
                    Run Code
                  </button>
                </div>

                <div className="sidebar-output">
                  <OutputView output={output} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeView === View.RoomEditor && (
        // Room Editor View
        <RoomEditor />
      )}
    </div>
  );
};

export default App;
