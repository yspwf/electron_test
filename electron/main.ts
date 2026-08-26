import 'v8-compile-cache';
import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron'
import path from 'node:path'

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;


const fadeOutSplash = (splashWindow: BrowserWindow | null, callback: () => void) => {
  if (!splashWindow) return callback();


  const duration = 300; // 淡出动画持续时间，单位：毫秒
  const steps = 30; // 动画分成多少步
  const interval = duration / steps; // 每步的时间间隔
  let currentOpacity = 1; // 当前透明度

  const fadeOutInterval = setInterval(() => {
    currentOpacity -= 1 / steps;
    if(currentOpacity <= 0) {
      clearInterval(fadeOutInterval);
      splashWindow?.close();
      splashWindow = null;
      callback();
      return;
    }

    if (splashWindow) {
      splashWindow.setOpacity(Math.max(currentOpacity, 0));
      return;
    }
  }, interval);
}


// 主窗口淡入动画（透明度 0 → 1）
function fadeInMainWindow(mainWindow: BrowserWindow | null) {
  if (!mainWindow) return;
  const duration = 300;
  const steps = 20;
  const stepTime = duration / steps;
  let currentOpacity = 0;

  mainWindow.show();          // 显示窗口（此时透明度为 0）
  mainWindow.setOpacity(0);
  mainWindow.focus();         // 聚焦窗口

  const interval = setInterval(() => {
    currentOpacity += 1 / steps;
    if (currentOpacity >= 1) {
      clearInterval(interval);
      mainWindow.setOpacity(1);
    } else {
      mainWindow.setOpacity(currentOpacity);
    }
  }, stepTime);
}


const createSplashWindow = () => {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    useContentSize: false,
    maximizable: false,  //禁止双击放大
    minimizable: false,
    center: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'));

  splashWindow.once('ready-to-show', () => {
    splashWindow?.show();
  })

  splashWindow.on('closed', () => {
    splashWindow = null;
  })
}



const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // backgroundColor: '#00000000', // 窗口背景色
    // transparent: true, // 设置透明窗体
    title: '桌面开发App',
    backgroundColor: '#f2f2f2',
    useContentSize: false, // 窗口的实际尺寸是否为web页面的尺寸，如果是true包括窗口边框的大小 稍微会大点 默认是false
    center: true, // 窗口是否在屏幕居中
    resizable: true, // 窗口大小是否可调整
    movable: true, // 窗口是否可移动
    // minimizable: true, // 窗口是否可最小化
    // maximizable: true, // 窗口是否可以最大化
    // closable: true, // 窗口是否可关闭
    focusable: true, // 窗口是否可聚焦,
    // alwaysOnTop: true, // 窗口是否永远在别的窗口之上
    // fullscreen: true, // 窗口是否全屏
    // skipTaskbar: true, // 是否在任务栏中显示窗口
    hasShadow: true, // 窗口是否有阴影
    opacity: 1, // 窗口的透明度
    show: false, // 窗口是否显示
    webPreferences: {
      // 关键：指定 preload 脚本路径
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // 必须开启，配合 preload 使用
      nodeIntegration: false,   // 渲染进程不直接集成 Node
      partition: 'persist:windows-id', // 持久化存储分区
    },
  })

  // 开发环境加载 Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境加载构建后的文件
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    fadeInMainWindow(mainWindow);
    // 关闭启动页
    if (splashWindow) {
      fadeOutSplash(splashWindow, () => {
        console.log('Splash window faded out and closed.');
        splashWindow?.close();
        splashWindow = null;
      })
    }
  })


  mainWindow.on('closed', () => {
    // 释放窗口资源
    mainWindow = null;
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


const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时,将会聚焦到win这个窗口
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  })

  app.whenReady().then(()=> {
    createSplashWindow();
    createMainWindow();
    logDisplayInfo(); // 调用函数输出显示器信息

    globalShortcut.register('CommandOrControl+F5', () => {
      // app.relaunch();
      app.exit();
    })

    globalShortcut.register('Control+Shift+i', function () {
      mainWindow?.webContents.openDevTools();
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

}





ipcMain.handle('ping', () => {
  return 'pong';
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
});

