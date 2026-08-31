import React from 'react';
import Editor from '@monaco-editor/react';

const MyEditor: React.FC = () => {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
      <Editor
        height="70vh"
        defaultLanguage="javascript"
        defaultValue={`// 欢迎使用 Monaco Editor\nfunction greet(name) {\n  console.log("Hello, " + name);\n}\n\ngreet("World");`}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default MyEditor;