// export interface ElectronAPI {
//   openFile: () => Promise<string>,
//   platform: string,
//   ping: () => Promise<string>
// }


export interface IElectronAPI {
  openWindow: (name: string, route: string) => void;
  getAppVersion: () => Promise<string>;
  onThemeChange: (callback: (event: IpcRendererEvent, theme: string) => void) => void;
  removeThemeListener: () => void;
   openFile: () => Promise<string>;
  platform: string;
  ping: () => Promise<string>;
  onLoadingFadeOut: (callback: () => void) => void
  notifyAppReady: () => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
