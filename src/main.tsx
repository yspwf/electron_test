
import { createRoot } from 'react-dom/client';
import App from './App';
import { StrictMode } from 'react';
 
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error('❌ 未找到 id 为 root 的 DOM 节点，请检查 HTML 模板');
}