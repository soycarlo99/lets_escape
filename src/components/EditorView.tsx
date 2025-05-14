import React, { useRef, useEffect, useState } from "react";
import * as monaco from "monaco-editor";
import { Language } from "../App";
import { ClickableArea } from "../types/clickableAreas";

interface EditorViewProps {
  code: string;
  language: Language;
  onChange: (code: string) => void;
  editorRef: React.MutableRefObject<any>;
  currentArea?: ClickableArea | null; // Currently selected area
  onCheckSolution?: (area: ClickableArea) => void; // Callback to check solution
}

export const EditorView: React.FC<EditorViewProps> = ({
  code,
  language,
  onChange,
  editorRef,
  currentArea,
  onCheckSolution,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      // Map our language values to Monaco's language identifiers
      const monacoLanguage = getMonacoLanguage(language);

      // Initialize Monaco editor
      const editor = monaco.editor.create(containerRef.current, {
        value: code,
        language: monacoLanguage,
        theme: "vs-dark",
        automaticLayout: true,
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: "on",
        renderLineHighlight: "all",
        tabSize: 2,
      });

      // Store editor instance in the ref
      editorRef.current = editor;

      // Set up change handler
      editor.onDidChangeModelContent(() => {
        onChange(editor.getValue());
      });

      // Mark editor as ready
      setEditorReady(true);

      // Cleanup on unmount
      return () => {
        editor.dispose();
      };
    }
  }, []);

  // Update editor language when language prop changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, getMonacoLanguage(language));
      }
    }
  }, [language]);

  // Update editor content when code prop changes
  useEffect(() => {
    if (editorRef.current) {
      const editorValue = editorRef.current.getValue();
      if (code !== editorValue) {
        editorRef.current.setValue(code);
      }
    }
  }, [code]);

  // Map our language values to Monaco's language identifiers
  const getMonacoLanguage = (language: Language): string => {
    const languageMap: Record<Language, string> = {
      javascript: "javascript",
      typescript: "typescript",
      python: "python",
      java: "java",
      cpp: "cpp",
      csharp: "csharp",
      go: "go",
      rust: "rust",
    };

    return languageMap[language] || "plaintext";
  };

  // Handle checking solution
  const handleCheckSolution = () => {
    if (currentArea && onCheckSolution) {
      onCheckSolution(currentArea);
    }
  };

  return (
    <div className="editor-container">
      <div ref={containerRef} className="editor"></div>

      {/* Check Solution Button - only show if we have a puzzle area with an expected value */}
      {editorReady &&
        currentArea &&
        currentArea.expectedValue !== undefined && (
          <button
            className="check-solution-button"
            onClick={handleCheckSolution}
            title="Check your solution against the expected result"
          >
            Check Solution
          </button>
        )}
    </div>
  );
};

