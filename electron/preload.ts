import { contextBridge, ipcRenderer } from 'electron';

// 暴露版本信息和 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // versions: {
  //   node: process.versions.node,
  //   chrome: process.versions.chrome,
  //   electron: process.versions.electron
  // },
  ping: () => ipcRenderer.invoke('ping'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  platform: process.platform,
  openWindow: (name: string, route: string) => {
    ipcRenderer.send('open-window', { name, route });
  },
  getAppVersion: () => {
    // 使用 ipcRenderer.invoke 进行双向通信，主进程可以返回 Promise
    return ipcRenderer.invoke('get-app-version');
  },
  onThemeChange: (callback: (event: import('electron').IpcRendererEvent, theme: string) => void) => {
    // 注意：传递 callback 本身是安全的，但需要管理监听器生命周期
    ipcRenderer.on('theme-changed', callback);
  },
  removeThemeListener: () => {
    ipcRenderer.removeAllListeners('theme-changed');
  }
});
