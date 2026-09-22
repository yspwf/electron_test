// export interface ElectronAPI {
//   openFile: () => Promise<string>,
//   platform: string,
//   ping: () => Promise<string>
// }

export interface TabItem {
  id: string
  title: string
  active: boolean
}

export interface IElectronAPI {
  openWindow: (name: string, route: string) => void;
  getAppVersion: () => Promise<string>;
  onThemeChange: (callback: (event: IpcRendererEvent, theme: string) => void) => void;
  removeThemeListener: () => void;
   openFile: () => Promise<string>;
  platform: string;
  ping: () => Promise<string>;
  onLoadingFadeOut: (callback: () => void) => void
  notifyAppReady: () => Promise<boolean>,
  saveFile: (content: string) => void,
  readFile: (fileName: string) => Promise<string>,
  showContextMenu: () => void,
  onInit: (callback: (data: { id: string; filePath: string | null }) => void) => void,
  setTitle: (title: string) => void,
  readFile: (filePath: string) => Promise<string>,
  writeFile: (filePath: string, content: string) => Promise<void>,
  // ===== 标签页操作 =====
  createTab: () => Promise<string>,
  switchTab: (id: string) => Promise<void>,
  closeTab: (id: string) => Promise<void>,
  listTabs: () => Promise<TabItem[]>,
  onTabsUpdated: (callback: (tabs: TabItem[]) => void) => void,
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
