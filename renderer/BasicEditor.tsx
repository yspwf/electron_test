// src/components/BasicEditor.tsx
import React from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
 
interface BasicEditorProps {
  initialValue?: string;
  language?: string;
  height?: string;
}
 
export const BasicEditor: React.FC<BasicEditorProps> = ({
  initialValue = '// 开始编辑你的代码...',
  language = 'javascript',
  height = '400px'
}) => {
  const editorRef = React.useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };
 
  return (
    <Editor
      height={height}
      defaultValue={initialValue}
      language={language}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        wordWrap: 'on'
      }}
      wrapperProps={{
        style: { border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }
      }}
    />
  );
};
