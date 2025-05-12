import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { Language } from '../App';

interface EditorViewProps {
  code: string;
  language: Language;
  onChange: (code: string) => void;
  editorRef: React.MutableRefObject<any>;
}

export const EditorView: React.FC<EditorViewProps> = ({ 
  code, 
  language, 
  onChange,
  editorRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      // Map our language values to Monaco's language identifiers
      const monacoLanguage = getMonacoLanguage(language);
      
      // Initialize Monaco editor
      const editor = monaco.editor.create(containerRef.current, {
        value: code,
        language: monacoLanguage,
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: {
          enabled: false
        },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        tabSize: 2
      });
      
      // Store editor instance in the ref
      editorRef.current = editor;
      
      // Set up change handler
      editor.onDidChangeModelContent(() => {
        onChange(editor.getValue());
      });
      
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
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      csharp: 'csharp',
      go: 'go',
      rust: 'rust'
    };
    
    return languageMap[language] || 'plaintext';
  };
  
  return (
    <div className="editor-container">
      <div ref={containerRef} className="editor"></div>
    </div>
  );
}; 