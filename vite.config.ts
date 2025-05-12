import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Type assertion needed because the plugin type might not align perfectly
    (monacoEditorPlugin as any)({
      // You can specify languages you need, or leave empty for default set
      // languages: ['javascript', 'typescript', 'css', 'html', 'json', 'python', 'java', 'cpp', 'csharp', 'go', 'rust'] 
    })
  ],
}); 