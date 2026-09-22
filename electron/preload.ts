import { contextBridge, ipcRenderer } from 'electron';
import type { TabItem } from '../types/electron.d.ts'

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
  },
   // 系统 Loading 淡出通知
  onLoadingFadeOut: (callback: () => void) => {
    ipcRenderer.once('loading:fade-out', () => callback())
  },

  // 渲染进程通知主进程：业务就绪
  notifyAppReady: () => ipcRenderer.invoke('app:ready'),
  saveFile: (content: string) => {
    ipcRenderer.send('saveFile', content);
  },
  // readFile: () => {
  //   return new Promise<string>((resolve, reject) => {
  //     ipcRenderer.once('readFileResponse', (event, response) => {
  //       if (response.success) {
  //         resolve(response.content);
  //       } else {
  //         reject(new Error(response.message));
  //       }
  //     });
  //     ipcRenderer.send('readFile');
  //   });
  // },
  showContextMenu: () => {
    ipcRenderer.send('showContextMenu');
  },
  // switchTab: (idx: number) => {
  //   ipcRenderer.send('switch-tab', idx);
  // },
  // closeTab: (idx: number) => {
  //   ipcRenderer.send('close-tab', idx);
  // },
  // send: (channel, data) => ipcRenderer.send(channel, data),
  // on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  // invoke: (channel, data) => ipcRenderer.invoke(channel, data)
  /**
   * 监听主进程发送的初始化数据（标签 id 和文件路径）
   */
  onInit: (callback: (data: { id: string; filePath: string | null }) => void) => {
    ipcRenderer.on('tab:init', (_event, data) => callback(data))
  },

  /**
   * 通知主进程更新标签标题
   */
  setTitle: (title: string) => {
    ipcRenderer.send('tab:set-title', title)
  },

  /**
   * 读取文件内容
   */
  readFile: (filePath: string): Promise<string> => {
    return ipcRenderer.invoke('file:read', filePath)
  },

  /**
   * 写入文件内容
   */
  writeFile: (filePath: string, content: string): Promise<void> => {
    return ipcRenderer.invoke('file:write', filePath, content)
  },

  // ===== 标签页操作 =====
  createTab: () => ipcRenderer.invoke('tabs:create'),
  switchTab: (id: string) => ipcRenderer.invoke('tabs:switch', id),
  closeTab: (id: string) => ipcRenderer.invoke('tabs:close', id),
  listTabs: () => ipcRenderer.invoke('tabs:list'),

  onTabsUpdated: (callback: (tabs: TabItem[]) => void) => {
    // ⚠️ 先移除旧的监听，避免热重载时重复注册
    ipcRenderer.removeAllListeners('tabs:updated')
    ipcRenderer.on('tabs:updated', (_event, tabs: TabItem[]) => {
      callback(tabs)
    })
  },
});
