import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MenuPanel from './components/MenuPanel';
import ArticleMenu from './components/ArticleMenu';
import CommunicationPanel from './panels/CommunicationPanel';
import ArticlePanel from './panels/ArticlePanel';
import { useArticles } from './hooks/useArticles';
import type { SidebarItem, SidebarKey, MenuMap } from './types';

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'frame', label: '框架', icon: 'frame' },
  { key: 'system', label: '系统', icon: 'system' },
  { key: 'hardware', label: '硬件', icon: 'hardware' },
  { key: 'effects', label: '特效', icon: 'effects' },
  { key: 'cross', label: 'cross', icon: 'cross' },
  { key: 'articles', label: '文章', icon: 'articles' },
];

const MENU_MAP: MenuMap = {
  frame: ['通信', 'http服务', 'socket服务', 'json数据库', 'sqlite数据库', '任务', '自动更新', '软件调用', 'java', '测试'],
  system: ['系统信息', '进程管理', '环境变量'],
  hardware: ['设备列表', '串口通信', 'USB 设备'],
  effects: ['动画', '窗口特效'],
  cross: ['跨域配置'],
  articles: [],
};

const App: React.FC = () => {
  const [activeSidebar, setActiveSidebar] = useState<SidebarKey>('frame');
  const [activeMenu, setActiveMenu] = useState<string>('通信');
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  const {
    articles,
    folders,
    createArticle,
    updateArticle,
    removeArticle,
    moveArticle,
    createFolder,
    removeFolder,
    renameFolder,
    error,
  } = useArticles();

  const handleSidebarChange = (key: SidebarKey) => {
    setActiveSidebar(key);
    if (key !== 'articles') {
      const list = MENU_MAP[key] ?? [];
      setActiveMenu(list[0] ?? '');
    }
  };

  const handleSelect = (_folder: string, id: string) => {
    setActiveArticleId(id);
  };

  const handleCreateArticle = async (folder: string) => {
    const item = await createArticle('未命名文章', folder);
    if (item) setActiveArticleId(item.id);
  };

  const handleDeleteArticle = async (folder: string, id: string) => {
    await removeArticle(folder, id);
    if (activeArticleId === id) {
      const rest = articles.filter((a) => a.id !== id);
      const next = rest[0];
      setActiveArticleId(next ? next.id : null);
    }
  };

  const handleRevealDir = async () => {
    await window.articlesAPI.revealDir();
  };

  return (
    <div className="app">
      <div className="title-bar">
        <div className="traffic-lights">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <span className="title-text">EE 框架</span>
      </div>

      <div className="body">
        <Sidebar items={SIDEBAR_ITEMS} active={activeSidebar} onChange={handleSidebarChange} />

        {activeSidebar === 'articles' ? (
          <ArticleMenu
            articles={articles}
            folders={folders}
            activeId={activeArticleId}
            onSelect={handleSelect}
            onCreateArticle={handleCreateArticle}
            onCreateFolder={createFolder}
            onDeleteArticle={handleDeleteArticle}
            onDeleteFolder={removeFolder}
            onRenameFolder={renameFolder}
            onRevealDir={handleRevealDir}
          />
        ) : (
          <MenuPanel
            items={MENU_MAP[activeSidebar] ?? []}
            active={activeMenu}
            onChange={setActiveMenu}
          />
        )}

        {activeSidebar === 'articles' ? (
          <ArticlePanel
            articles={articles}
            folders={folders}
            activeId={activeArticleId}
            onChangeActive={handleSelect}
            onUpdate={updateArticle}
            onDelete={handleDeleteArticle}
            onCreate={() => handleCreateArticle('默认')}
            onMove={moveArticle}
          />
        ) : activeMenu === '通信' ? (
          <CommunicationPanel />
        ) : (
          <main className="content-panel">
            <div className="placeholder">{activeMenu} 面板（待实现）</div>
            {error && (
              <div style={{ color: '#ef4444', marginTop: 12 }}>错误：{error}</div>
            )}
          </main>
        )}
      </div>
    </div>
  );
};

export default App;