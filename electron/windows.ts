import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';

export type WindowPoolOptions = BrowserWindowConstructorOptions & {
  url: string;
  brandNew?: boolean;
};

interface WindowEntry {
  id: string;
  win: BrowserWindow;
  url: string;
  ready: boolean;   // ready-to-show 已触发（窗口"热透"）
  isPre: boolean;   // 是否为预热窗口
}

export const getOpenUrl = (url: string): string => {
  const baseUrl =
    import.meta.env.MODE === 'dev'
      ? import.meta.env.VITE_DEV_SERVER_URL
      : `file://${resolve(__dirname, '../renderer/index.html')}`;
  return url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `${baseUrl}#${url}`;
};

class WindowPoolManager {
  private static instance: WindowPoolManager | null = null;
  private poolSize: number;
  private windows = new Map<string, WindowEntry>();      // id → entry
  private urlIndex = new Map<string, string>();          // url → id
  private warmUpTimer?: NodeJS.Timeout | undefined;
  private snapshotEnabled = false;

  private constructor(poolSize: number) {
    this.poolSize = poolSize;
  }

  public static getInstance(poolSize = 2): WindowPoolManager {
    if (!WindowPoolManager.instance) {
      WindowPoolManager.instance = new WindowPoolManager(poolSize);
    }
    return WindowPoolManager.instance;
  }

  /**
   * 快照探测：渲染进程能否拿到 snapshotResult 决定预热节奏。
   * 没快照时单窗口热透 ~1s，需要拉长间隔；有快照 ~300ms，可加密。
   */
  public setSnapshotEnabled(enabled: boolean): void {
    this.snapshotEnabled = enabled;
  }

  // ---------------- 对外 API ----------------

  /** 渐进预热：同一时刻只有一个窗口在冷启动，不与主窗口抢资源 */
  public warmUpGradually(intervalMs?: number): void {
    if (this.warmUpTimer) return;
    const gap = intervalMs ?? (this.snapshotEnabled ? 150 : 500);
    let pending = this.poolSize;
    this.warmUpTimer = setInterval(() => {
      if (pending <= 0) {
        clearInterval(this.warmUpTimer!);
        this.warmUpTimer = undefined;
        return;
      }
      this.createWindow(this.defaultOptions(), true);
      pending--;
    }, gap);
  }

  /** 用户正在等窗口 / 系统休眠时，暂停预热让路 */
  public pauseWarmUp(): void {
    if (this.warmUpTimer) {
      clearInterval(this.warmUpTimer);
      this.warmUpTimer = undefined;
    }
  }

  public openWindow(options: WindowPoolOptions): BrowserWindow {
    this.pauseWarmUp();                     // 借出窗口时预热让路
    const { url, brandNew } = options;

    // 1. 同 URL 复用（brandNew 强制新开）
    if (!brandNew && this.urlIndex.has(url)) {
      const entry = this.windows.get(this.urlIndex.get(url)!);
      if (entry) {
        this.activate(entry.win);
        return entry.win;
      }
      this.urlIndex.delete(url);
    }

    // 2. 取"热透"的预热窗口；没有则冷创建（有快照时这段也被加速）
    const entry = this.takePreWindow() ?? this.createWindow(options, false);

    // 3. 导航到目标路由
    entry.isPre = false;
    entry.url = url;
    entry.win.loadURL(getOpenUrl(url)).catch((err) =>
      console.error(`[WindowPool] loadURL failed: ${url}`, err));

    // 4. 登记 + 关闭清理（按 id，杜绝 brandNew 场景下索引误删）
    this.urlIndex.set(url, entry.id);
    entry.win.once('closed', () => {
      this.windows.delete(entry.id);
      if (this.urlIndex.get(url) === entry.id) this.urlIndex.delete(url);
      this.replenishPool();
    });

    this.activate(entry.win);
    this.replenishPool();
    return entry.win;
  }

  public resizePool(size: number): void {
    this.poolSize = Math.max(0, size);
    this.replenishPool();
  }

  // ---------------- 内部实现 ----------------

  private activate(win: BrowserWindow): void {
    if (win.isMinimized()) win.restore();
    win.show();
    win.moveTop();
    win.focus();
  }

  private defaultOptions(): WindowPoolOptions {
    return {
      width: 880, height: 640,
      minWidth: 640, minHeight: 480,
      show: false,
      webPreferences: { preload: join(__dirname, '../preload/index.cjs') },
      url: `/preWindow/${randomUUID()}`,   // 唯一占位 URL，避免互相覆盖
    };
  }

  private createWindow(options: WindowPoolOptions, isPre: boolean): WindowEntry {
    const { url, brandNew: _b, ...winOptions } = options;
    const win = new BrowserWindow({ ...winOptions, show: false });
    const entry: WindowEntry = { id: randomUUID(), win, url, ready: false, isPre };

    win.once('ready-to-show', () => { entry.ready = true; });
    this.windows.set(entry.id, entry);

    win.loadURL(getOpenUrl(url)).catch((err) =>
      console.error(`[WindowPool] init loadURL failed: ${url}`, err));

    if (isPre) {
      // 预热窗口自身崩溃/被杀也要补池
      win.once('closed', () => {
        this.windows.delete(entry.id);
        this.replenishPool();
      });
    }
    return entry;
  }

  private takePreWindow(): WindowEntry | null {
    for (const entry of this.windows.values()) {
      if (entry.isPre && entry.ready && !entry.win.isVisible()) {
        this.windows.delete(entry.id);
        return entry;
      }
    }
    return null;
  }

  private replenishPool(): void {
    let pre = 0;
    for (const e of this.windows.values()) if (e.isPre) pre++;
    while (pre < this.poolSize) {
      this.createWindow(this.defaultOptions(), true);
      pre++;
    }
  }
}

export default WindowPoolManager;
