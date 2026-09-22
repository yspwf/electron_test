// src/main/main.ts
import { app, BaseWindow, WebContentsView, ipcMain } from 'electron'
import path from 'path'
import { TabManager } from './TabManager'

let mainWindow: BaseWindow | null = null
let tabManager: TabManager | null = null

// ✅ 新增：用于承载标签栏的 WebContentsView
let tabBarView: WebContentsView | null = null

ipcMain.handle('tabs:create', () => {
  return tabManager?.createTab()
})

ipcMain.handle('tabs:switch', (_e, id: string) => {
  tabManager?.switchTab(id)
})

ipcMain.handle('tabs:close', (_e, id: string) => {
  tabManager?.closeTab(id)
})

ipcMain.handle('tabs:list', () => {
  return tabManager?.getTabList() ?? []
})

async function bootstrap() {
  mainWindow = new BaseWindow({
    width: 1400,
    height: 900,
    title: 'Markdown Tabs',
  })

  // ✅ 创建标签栏视图
  tabBarView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  tabBarView.webContents.openDevTools({ mode: 'detach' });

  // 将标签栏视图添加到窗口
  mainWindow.contentView.addChildView(tabBarView);


  // ✅ 通过 webContents 加载页面
  await tabBarView.webContents.loadFile(
    path.join(__dirname, '../renderer/tabbar.html')
  )

  // 设置标签栏高度（例如 40px）
  const TAB_BAR_HEIGHT = 40
  const { width, height } = mainWindow.getContentBounds()

  // 标签栏固定在顶部
  tabBarView.setBounds({
    x: 0,
    y: 0,
    width,
    height: TAB_BAR_HEIGHT,
  })

  // 创建标签页管理器
  // tabManager = new TabManager(mainWindow, TAB_BAR_HEIGHT)
  tabManager = new TabManager(mainWindow, tabBarView, TAB_BAR_HEIGHT)

  // 处理窗口大小变化
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow!.getContentBounds()

    // 调整标签栏尺寸
    tabBarView?.setBounds({
      x: 0,
      y: 0,
      width,
      height: TAB_BAR_HEIGHT,
    })

    // 调整标签页视图
    tabManager?.handleResize()
  })

  // 窗口关闭时销毁所有资源
  mainWindow.on('closed', () => {
    tabManager?.destroyAll()
    tabManager = null

    // ✅ 销毁标签栏的 webContents，防止内存泄漏
    if (tabBarView && !tabBarView.webContents.isDestroyed()) {
      tabBarView.webContents.close()
    }
    tabBarView = null

    mainWindow = null
  })

  // 初始创建一个标签页
  tabManager.createTab()
}

app.whenReady().then(bootstrap).catch(console.error)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BaseWindow.getAllWindows().length === 0) {
    void bootstrap()
  }
})
