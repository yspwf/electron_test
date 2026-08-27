import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
// import App from './App.tsx'

function App() {

  const [inputValue, setInputValue] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');

  const handleClick = async () => {
    // 通过 window.electronAPI 访问 preload 暴露的 API
    const filePath = await window.electronAPI.ping()
    console.log(filePath)
  }

  return (
    <>
      <h1>Hello World</h1>
      <p>This is a paragraph</p>
      <button onClick={handleClick}>Open File</button>

      <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
      <button id="btnWrite" onClick={() => window.electronAPI.saveFile(inputValue)}>
        在 D 盘 Blog 目录下创建一个名为 data.txt 的文件
      </button>

      <button onClick={() => window.electronAPI.readFile('data.txt').then((content) => setFileContent(content))}>
        读取 D 盘 Blog 目录下名为 data.txt 的文件
      </button>
      <p>{fileContent}</p>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
