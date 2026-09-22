import {app, BrowserWindow, Tray, Menu } from 'electron';
import path from 'node:path';

export const createTray = (mainWindow:BrowserWindow) => {
    const iconPath = app.isPackaged ? path.join(process.resourcesPath, 'libs/ele.png') : path.join(app.getAppPath(), 'electron/libs/ele.png');
    
        const tray = new Tray(iconPath);
        const contextMenu = Menu.buildFromTemplate([
            { label: '显示主窗口', click: () => { mainWindow?.show(); } },
            { label: '退出', click: () => { 
                    const allWindows = BrowserWindow.getAllWindows();
                    allWindows.forEach(win => {
                        win.destroy(); // 直接销毁窗口，避免触发 close 事件
                    });
                    tray.destroy();
                    app.quit(); 
                } 
            }
        ]);
        tray.setContextMenu(contextMenu);
    
        tray.setToolTip('桌面开发App');
    
        tray.on('click', () => {
          if (mainWindow) {
            if (mainWindow.isVisible()) { 
              mainWindow.hide();
            } else {
              mainWindow.show();
            }
    
             mainWindow.isVisible() ? mainWindow.setSkipTaskbar(false) : mainWindow.setSkipTaskbar(true);
          }
        });
}