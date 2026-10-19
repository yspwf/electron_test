import { AppRouter } from '@/router';

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>✅ Electron + React + TypeScript 集成成功</h1>
      <p>基于 Electron Forge + Vite 构建</p>
      <p>{import.meta.env.MODE}</p>
      <AppRouter/>
    </div>
  );
}