// src/main/TabManager.ts
import { BaseWindow, WebContentsView } from 'electron'
import type { WebContents } from 'electron'
import path from 'path'

export interface TabInfo {
  id: string
  title: string
  view: WebContentsView
  filePath: string | null
}

export class TabManager {
  private window: BaseWindow
  private tabs: Map<string, TabInfo> = new Map()
  private activeTabId: string | null = null
  private idCounter = 0
  private tabBarHeight: number
  private tabBarView: WebContentsView

  constructor(
    window: BaseWindow,
    tabBarView: WebContentsView,
    tabBarHeight: number = 40
  ) {
    this.window = window
    this.tabBarView = tabBarView
    this.tabBarHeight = tabBarHeight
  }

//   private notifyTabBar(): void {
//     if (this.tabBarView.webContents.isDestroyed()) return
//     this.tabBarView.webContents.send('tabs:updated', this.getTabList())
//   }

  createTab(filePath: string | null = null): string {
    const id = `tab-${++this.idCounter}`

    const view = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    })

    view.setVisible(false)
    this.window.contentView.addChildView(view)

    view.webContents.once('did-finish-load', () => {
      view.webContents.send('tab:init', { id, filePath })
    })

    const params = new URLSearchParams({ id })
    if (filePath) {
      params.set('file', filePath)
    }

    void view.webContents.loadFile(
      path.join(__dirname, '../renderer/index.html'),
      { search: `?${params.toString()}` }
    )

    view.webContents.on('page-title-updated', (_event, title) => {
      const tab = this.tabs.get(id)
      if (tab) {
        tab.title = title
        if (tab.id === this.activeTabId) {
          this.updateWindowTitle(title)
        }
        this.notifyTabBar()
      }
    })

    const tabInfo: TabInfo = { id, title: 'Untitled', view, filePath }
    this.tabs.set(id, tabInfo)

    this.switchTab(id)
    this.notifyTabBar()

    return id
  }

  switchTab(id: string): void {
    const target = this.tabs.get(id)
    if (!target) return

    this.activeTabId = id
    this.updateWindowTitle(target.title)

    const { width, height } = this.window.getContentBounds()
    const contentHeight = height - this.tabBarHeight

    // 隐藏所有标签视图
    this.tabs.forEach((tab) => {
      tab.view.setVisible(false)
    })

    // ✅ 标签页视图从标签栏下方开始
    target.view.setBounds({
      x: 0,
      y: this.tabBarHeight,
      width,
      height: contentHeight,
    })
    target.view.setVisible(true)

    this.notifyTabBar()
  }

  setTabTitleByWebContents(webContents: WebContents, title: string): void {
    const nextTitle = title.trim() || 'Untitled'

    for (const tab of this.tabs.values()) {
      if (tab.view.webContents === webContents) {
        tab.title = nextTitle

        if (tab.id === this.activeTabId) {
          this.updateWindowTitle(nextTitle)
        }

        this.notifyTabBar()
        return
      }
    }
  }

  setTabTitle(id: string, title: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return

    const nextTitle = title.trim() || 'Untitled'
    tab.title = nextTitle

    if (tab.id === this.activeTabId) {
      this.updateWindowTitle(nextTitle)
    }

    this.notifyTabBar()
  }

  closeTab(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return

    this.window.contentView.removeChildView(tab.view)

    if (!tab.view.webContents.isDestroyed()) {
      tab.view.webContents.close()
    }

    this.tabs.delete(id)

    // if (this.activeTabId === id) {
    //   const remainingIds = Array.from(this.tabs.keys())
    //   this.activeTabId = remainingIds.length > 0
    //     ? remainingIds[remainingIds.length - 1]
    //     : null

    //   if (this.activeTabId) {
    //     this.switchTab(this.activeTabId)
    //   }
    // }
    if (this.activeTabId === id) {
        const remainingIds = Array.from(this.tabs.keys())

        if (remainingIds.length > 0) {
            // 用非空断言或显式取值
            this.activeTabId = remainingIds[remainingIds.length - 1] ?? null
        } else {
            this.activeTabId = null
        }

        if (this.activeTabId) {
            this.switchTab(this.activeTabId)
        }
    }

    this.notifyTabBar()
  }

  getTabList(): Array<{ id: string; title: string; active: boolean }> {
    return Array.from(this.tabs.values()).map((tab) => ({
      id: tab.id,
      title: tab.title,
      active: tab.id === this.activeTabId,
    }))
  }

  handleResize(): void {
    const { width, height } = this.window.getContentBounds()
    const contentHeight = height - this.tabBarHeight

    this.tabs.forEach((tab) => {
      if (tab.id === this.activeTabId) {
        tab.view.setBounds({
          x: 0,
          y: this.tabBarHeight,
          width,
          height: contentHeight,
        })
      }
    })
  }

  private notifyTabBar(): void {
    const tabList = this.getTabList()
    // ✅ 通知主窗口的 contentView 中第一个子视图（标签栏）
    // 更稳健的方式是保存 tabBarView 的引用，这里简化处理
    this.window.contentView.children.forEach((child) => {
      if (child instanceof WebContentsView && !child.webContents.isDestroyed()) {
        child.webContents.send('tabs:updated', tabList)
      }
    })
  }

  private updateWindowTitle(title: string): void {
    this.window.setTitle(`${title} - Markdown Tabs`)
  }

  destroyAll(): void {
    this.tabs.forEach((tab) => {
      this.safeRemoveAndCloseView(tab.view)
    })
    this.tabs.clear()
    this.activeTabId = null
  }

  private safeRemoveAndCloseView(view: WebContentsView): void {
    try {
      this.window.contentView.removeChildView(view)
    } catch {
      // The window may already have destroyed child views while closing.
    }

    try {
      if (!view.webContents.isDestroyed()) {
        view.webContents.close()
      }
    } catch {
      // Accessing webContents can throw after the underlying object is destroyed.
    }
  }
}
