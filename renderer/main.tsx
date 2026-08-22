import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
// import App from './App.tsx'

function App() {
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
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
