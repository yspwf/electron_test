import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron'
import path from 'node:path'

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    // backgroundColor: '#00000000', // 窗口背景色
    // transparent: true, // 设置透明窗体
    title: '主窗口',
    backgroundColor: '#f2f2f2',
    webPreferences: {
      // 关键：指定 preload 脚本路径
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // 必须开启，配合 preload 使用
      nodeIntegration: false,   // 渲染进程不直接集成 Node
    },
  })

  // 开发环境加载 Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    // 生产环境加载构建后的文件
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  win.on('closed', () => {
    // 释放窗口资源
    win.destroy()
  })
  
}


function logDisplayInfo() {
  const allDisplays = screen.getAllDisplays();
  console.log(`检测到 ${allDisplays.length} 个显示器:`);
 
  allDisplays.forEach((display, index) => {
    console.log(`\n--- 显示器 ${index} ---`);
    console.log(`  物理尺寸: ${display.size.width} x ${display.size.height}`);
    console.log(`  桌面位置: (x: ${display.bounds.x}, y: ${display.bounds.y})`);
    console.log(`  可用工作区: (x: ${display.workArea.x}, y: ${display.workArea.y}, 宽: ${display.workAreaSize.width}, 高: ${display.workAreaSize.height})`);
    console.log(`  缩放比例: ${display.scaleFactor}`);
    console.log(`  是否为主显示器: ${screen.getPrimaryDisplay().id === display.id}`);
  });
}

app.whenReady().then(()=> {
  createWindow()
  logDisplayInfo(); // 调用函数输出显示器信息

  globalShortcut.register('CommandOrControl+F5', () => {
    // app.relaunch();
    app.exit();
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


ipcMain.handle('ping', () => {
  return 'pong';
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
});

