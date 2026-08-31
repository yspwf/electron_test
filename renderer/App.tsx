import React, { useState } from 'react';
// import Editor from '@monaco-editor/react';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// 按需加载
const Editor = React.lazy(() => import('@monaco-editor/react'));


// ============================================
// 第 1 步：用 Vite ?worker 导入所有语言 Worker
// ============================================
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker?worker';



self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new JsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    return new EditorWorker();
  },
};

// ============================================
// 第 2 步：注入本地 monaco 实例，彻底禁用 CDN
// ============================================
loader.config({ monaco });

// self.MonacoEnvironment = {
//   getWorker(_: string, label: string) {
//     const base = import.meta.url; // 当前模块的 URL
//     const getWorkerUrl = (path: string) => new URL(path, base).href;
//     let workerUrl: string;
//     switch (label) {
//       case 'json':
//         workerUrl = getWorkerUrl('monaco-editor/esm/vs/language/json/json.worker.js');
//         break;
//       case 'css':
//       case 'scss':
//       case 'less':
//         workerUrl = getWorkerUrl('monaco-editor/esm/vs/language/css/css.worker.js');
//         break;
//       case 'html':
//       case 'handlebars':
//       case 'razor':
//         workerUrl = getWorkerUrl('monaco-editor/esm/vs/language/html/html.worker.js');
//         break;
//       case 'typescript':
//       case 'javascript':
//         workerUrl = getWorkerUrl('monaco-editor/esm/vs/language/typescript/ts.worker.js');
//         break;
//       default:
//         workerUrl = getWorkerUrl('monaco-editor/esm/vs/editor/editor.worker.js');
//     }
//     return new Worker(workerUrl, { type: 'module' });
//   },
// };

// loader.config({ monaco });

const defaultCode = `// ✅ Monaco Editor 已完全本地化
// 不会请求任何 CDN，符合严格 CSP
// Electron + Vite + React 示例

interface Config {
  csp: 'strict';
  cdn: false;
  offline: true;
}

function init(): Config {
  return {
    csp: 'strict',
    cdn: false,
    offline: true
  };
}

console.log(init());
`;


const files = {
  'script.js': { name: 'script.js', language: 'javascript' },
  'entry.tsx': { name: 'entry.tsx', language: 'typescript' },
  'style.css': { name: 'style.css', language: 'css' },
  'index.html': { name: 'index.html', language: 'html' },
};

type FileName = keyof typeof files;

function App() {
  const [language, setLanguage] = useState('typescript');

  const [fileName, setFileName] = useState<FileName>('script.js');
  const file = files[fileName];


   const onChange = (newValue:string | undefined) => {
    console.log(newValue)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #333',
        background: '#252526',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <h2 style={{ margin: 0, fontSize: '16px', color: '#d4d4d4' }}>
          🖊️ Monaco Editor
        </h2>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #555',
            background: '#3c3c3c',
            color: '#d4d4d4',
            cursor: 'pointer'
          }}
        >
          <option value="typescript">TypeScript</option>
          <option value="javascript">JavaScript</option>
          <option value="json">JSON</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>
        <span style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: '#89d185',
          padding: '4px 10px',
          background: '#1e3a1e',
          borderRadius: '4px'
        }}>
          ✅ CSP 严格 | ❌ CDN 已禁用
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language={language}
          value={defaultCode}
          theme="vs-dark"
          options={{
            fontSize: 14, // 字体大小
            minimap: { enabled: true },  // 开启minimap
            automaticLayout: true,   //自适应布局 默认true
            renderLineHighlight: 'all', // 行亮方式 默认all
            scrollBeyondLastLine: false,  // 取消代码后面一大段空白 禁止滚动到最后一行之后
            selectOnLineNumbers: true, // 显示行号 默认 true
            roundedSelection: false,
            readOnly: false,  // 只读
            cursorStyle: 'line',
            overviewRulerBorder: false, // 不要滚动条的边框
            wordWrap: "on",  // 自动换行
            tabSize: 2,   // Tab 缩进大小
            insertSpaces: true, // 使用空格代替tab
            // quickSuggestions: true, // 快速建议
            // parameterHints: '' , // 参数提示
            autoClosingBrackets: "always",  // 自动闭合括号
            formatOnType: true,      // 输入时自动格式化
            acceptSuggestionOnCommitCharacter: true,  // 按提交字符接受建议
            matchBrackets: 'near' as const, 
            // fontFamily: 'Fira Code, monospace, 仿宋, 微软雅黑'
            quickSuggestions: { other: true, comments: false, strings: true },
            suggestOnTriggerCharacters: true,
            parameterHints: { enabled: true },
            wordBasedSuggestions: "currentDocument"
          }}
        //   path={file.name}
          onChange={onChange}
          loading={
            <div style={{ color: '#d4d4d4', padding: '40px', textAlign: 'center' }}>
              ⏳ 正在从本地加载 Monaco Editor...
            </div>
          }
        />
      </div>
    </div>
  );
}

export default App;
