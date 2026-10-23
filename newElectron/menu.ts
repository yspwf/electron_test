import { app, Menu, BrowserWindow } from "electron";

const isMac = process.platform === 'darwin'
console.log(isMac);
export const createMenu = () => {
  // const template: Electron.MenuItemConstructorOptions[] = [
  //   ...(isMac ? [{
  //   label: app.name,  // macOS必须的应用名菜单
  //   submenu: [
  //     { role: 'about' },
  //     { type: 'separator' },
  //     { role: 'services' },
  //     { role: 'hide' },
  //     { role: 'quit' }
  //   ]
  // }] : []),
  //   {
  //     label: app.name,
  //     submenu: [
  //       {
  //         label: '打开',
  //         accelerator: 'CmdOrCtrl+O',
  //         click: () => {
  //           const win = BrowserWindow.getFocusedWindow()
  //           win?.webContents.send('menu-open-file')
  //         }
  //       }
  //     ]
  //   }
  // ];

  // 定义菜单模板
  const template = [
    {
      label: '文件', // macOS上第一个菜单项label会被应用名替换，但这里仍按习惯写
      submenu: [
        {
          label: '新建便签',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // 通知渲染进程创建新便签
            mainWindow.webContents.send('create-new-note');
          }
        },
        { type: 'separator' },
        {
          label: '导入...',
          click: async () => {
            const { dialog } = require('electron');
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [{ name: '文本文件', extensions: ['txt', 'md'] }]
            });
            if (!result.canceled) {
              mainWindow.webContents.send('import-note', result.filePaths[0]);
            }
          }
        },
        {
          label: '导出...',
          click: async () => {
            const { dialog } = require('electron');
            const result = await dialog.showSaveDialog(mainWindow, {
              filters: [{ name: 'Markdown', extensions: ['md'] }]
            });
            if (!result.canceled) {
              mainWindow.webContents.send('export-note', result.filePath);
            }
          }
        },
        { type: 'separator' },
        {
          label: '设置',
          accelerator: 'CmdOrCtrl+,',
          click: () => { mainWindow.webContents.send('open-settings'); }
        },
        { type: 'separator' },
        {
          role: 'quit', // 使用预定义角色，Electron会处理平台差异
          label: '退出' // Windows/Linux上显示“退出”，macOS上自动变为“退出 应用名”
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '学习更多',
          // click: async () => {
          //   await shell.openExternal('https://electronjs.org');
          // }
        },
        {
          label: '关于',
          // click: () => {
          //   // 可以弹出一个自定义的关于窗口
          //   // require('./aboutWindow').createAboutWindow();
          // }
        }
      ]
    }
  ];

  // 根据平台调整模板
  if (process.platform === 'darwin') {
     template.unshift({ label: '' });
  };

  const menu = Menu.buildFromTemplate(template);    
  Menu.setApplicationMenu(menu);
}