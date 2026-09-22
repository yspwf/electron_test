import React, { useState } from 'react';
import type { Article } from '../types';

interface Props {
  articles: Article[];
  folders: string[];
  activeId: string | null;
  onSelect: (folder: string, id: string) => void;
  onCreateArticle: (folder: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteArticle: (folder: string, id: string) => void;
  onDeleteFolder: (folder: string) => void;
  onRenameFolder: (oldName: string, newName: string) => void;
  onRevealDir?: () => void;
}

const ArticleMenu: React.FC<Props> = ({
  articles,
  folders,
  activeId,
  onSelect,
  onCreateArticle,
  onCreateFolder,
  onDeleteArticle,
  onDeleteFolder,
  onRenameFolder,
  onRevealDir,
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [folderDraft, setFolderDraft] = useState<string | null>(null);

  const toggle = (folder: string) =>
    setCollapsed((prev) => ({ ...prev, [folder]: !prev[folder] }));

  const confirmCreateFolder = () => {
    const name = (folderDraft ?? '').trim();
    if (name) onCreateFolder(name);
    setFolderDraft(null);
  };

  return (
    <nav className="menu-panel article-menu">
      <div className="article-menu-top">
        <button className="article-new-btn" onClick={() => onCreateArticle('默认')}>
          + 新建文章
        </button>
        <button
          className="article-new-folder-btn"
          onClick={() => setFolderDraft('')}
        >
          + 新建文件夹
        </button>
      </div>

      {folderDraft !== null && (
        <div className="folder-draft">
          <input
            autoFocus
            value={folderDraft}
            onChange={(e) => setFolderDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmCreateFolder();
              if (e.key === 'Escape') setFolderDraft(null);
            }}
            placeholder="文件夹名称"
          />
          <button onClick={confirmCreateFolder}>确定</button>
          <button onClick={() => setFolderDraft(null)}>取消</button>
        </div>
      )}

      <div className="article-list">
        {folders.length === 0 && <div className="article-empty">暂无文件夹</div>}
        {folders.map((folder) => {
          const items = articles.filter((a) => a.folder === folder);
          const isCollapsed = !!collapsed[folder];
          return (
            <div key={folder} className="folder-block">
              <div className="folder-header">
                <span className="folder-toggle" onClick={() => toggle(folder)}>
                  {isCollapsed ? '▸' : '▾'}
                </span>
                <span className="folder-icon">📁</span>
                <span
                  className="folder-name"
                  onDoubleClick={() => {
                    const name = window.prompt('重命名文件夹', folder);
                    if (name && name !== folder) onRenameFolder(folder, name);
                  }}
                  title="双击重命名"
                >
                  {folder}
                </span>
                <span className="folder-count">({items.length})</span>
                <span
                  className="folder-new"
                  title="在此文件夹新建文章"
                  onClick={() => onCreateArticle(folder)}
                >
                  ＋
                </span>
                {folder !== '默认' && (
                  <span
                    className="folder-del"
                    title="删除文件夹"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          `确定删除文件夹「${folder}」及其中全部文章？此操作不可恢复。`
                        )
                      ) {
                        onDeleteFolder(folder);
                      }
                    }}
                  >
                    ×
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <div className="folder-children">
                  {items.length === 0 && <div className="folder-empty">（空）</div>}
                  {items.map((a) => (
                    <div
                      key={a.id}
                      className={`menu-item article-item ${
                        activeId === a.id ? 'active' : ''
                      }`}
                      onClick={() => onSelect(a.folder, a.id)}
                    >
                      <span className="article-title">{a.title || a.id}</span>
                      <span
                        className="article-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`确定删除「${a.title || a.id}」？`)) {
                            onDeleteArticle(a.folder, a.id);
                          }
                        }}
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {onRevealDir && (
        <button className="article-dir-btn" onClick={onRevealDir} title="打开文章目录">
          📁 打开目录
        </button>
      )}
    </nav>
  );
};

export default ArticleMenu;