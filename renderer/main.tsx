import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import App from './App';
// import { BasicEditor } from './BasicEditor';

// function App() {

//   // const [inputValue, setInputValue] = useState<string>('');
//   // const [fileContent, setFileContent] = useState<string>('');

//   // const handleClick = async () => {
//   //   // 通过 window.electronAPI 访问 preload 暴露的 API
//   //   const filePath = await window.electronAPI.ping()
//   //   console.log(filePath)
//   // }

//   return (
//     <>
//       <h1>Hello World</h1>
//       <p>This is a paragraph</p>
//        <header className="App-header">
//         <h1>Monaco Editor React集成示例</h1>
//       </header>

//        <App />
      
//       {/* <button onClick={handleClick}>Open File</button>

//       <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
//       <button id="btnWrite" onClick={() => window.electronAPI.saveFile(inputValue)}>
//         在 D 盘 Blog 目录下创建一个名为 data.txt 的文件
//       </button>

//       <button onClick={() => window.electronAPI.readFile('data.txt').then((content) => setFileContent(content))}>
//         读取 D 盘 Blog 目录下名为 data.txt 的文件
//       </button>
//       <p>{fileContent}</p> */}
//     </>
//   );
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);



// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { loader } from '@monaco-editor/react';
// import * as monaco from 'monaco-editor';
// import App from './App';
// import './App.css';

// // ========== 1. 配置 Monaco 的 Worker 加载策略 ==========
// // 这个配置告诉 Monaco 如何加载各个语言的 Worker，全部走本地文件
// (window as any).MonacoEnvironment = {
//   getWorker: function (workerId: string, label: string) {
//     // 工具函数：将模块路径转换为 URL（Vite 专用）
//     const getWorkerUrl = (moduleId: string) => {
//       return new URL(moduleId, import.meta.url).href;
//     };

//     // 根据语言标签选择对应的 Worker
//     switch (label) {
//       case 'json':
//         return new Worker(getWorkerUrl('monaco-editor/esm/vs/language/json/json.worker?worker'));
//       case 'css':
//       case 'scss':
//       case 'less':
//         return new Worker(getWorkerUrl('monaco-editor/esm/vs/language/css/css.worker?worker'));
//       case 'html':
//       case 'handlebars':
//       case 'razor':
//         return new Worker(getWorkerUrl('monaco-editor/esm/vs/language/html/html.worker?worker'));
//       case 'typescript':
//       case 'javascript':
//         return new Worker(getWorkerUrl('monaco-editor/esm/vs/language/typescript/ts.worker?worker'));
//       default:
//         // 编辑器核心 Worker（文本编辑、语法高亮等基础功能）
//         return new Worker(getWorkerUrl('monaco-editor/esm/vs/editor/editor.worker?worker'));
//     }
//   },
// };

// // ========== 2. 让 @monaco-editor/react 使用本地的 monaco 实例 ==========
// loader.config({ monaco });

// // ========== 3. 正常渲染 React 应用 ==========
// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );