import React, { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { Article } from '../types';

interface Props {
  articles: Article[];
  folders: string[];
  activeId: string | null;
  onChangeActive: (folder: string, id: string) => void;
  onUpdate: (
    folder: string,
    id: string,
    patch: Partial<Pick<Article, 'title' | 'content'>>
  ) => void;
  onDelete: (folder: string, id: string) => void;
  onCreate: () => void;
  onMove: (from: string, id: string, to: string) => void;
}

const ArticlePanel: React.FC<Props> = ({
  articles,
  folders,
  activeId,
  onChangeActive,
  onUpdate,
  onDelete,
  onCreate,
  onMove,
}) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (!activeId) {
      const first = articles[0];
      if (first) onChangeActive(first.folder, first.id);
    }
  }, [activeId, articles, onChangeActive]);

  const active = useMemo(
    () => articles.find((a) => a.id === activeId) ?? null,
    [articles, activeId]
  );

  const html = useMemo(() => {
    if (!active) return '';
    const raw = marked.parse(active.content ?? '', { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [active]);

  if (!active) {
    return (
      <main className="content-panel article-panel">
        <div className="article-blank">
          <p>还没有文章</p>
          <button onClick={onCreate}>+ 新建文章</button>
        </div>
      </main>
    );
  }

  return (
    <main className="content-panel article-panel">
      <div className="article-toolbar">
        <input
          className="article-title-input"
          value={active.title}
          onChange={(e) =>
            onUpdate(active.folder, active.id, { title: e.target.value })
          }
          placeholder="文章标题"
        />

        <select
          className="article-folder-select"
          value={active.folder}
          onChange={(e) => onMove(active.folder, active.id, e.target.value)}
          title="移动文章到其它文件夹"
        >
          {folders.map((f) => (
            <option key={f} value={f}>
              📁 {f}
            </option>
          ))}
        </select>

        <div className="article-actions">
          <button
            className={mode === 'edit' ? 'active' : ''}
            onClick={() => setMode('edit')}
          >
            编辑
          </button>
          <button
            className={mode === 'preview' ? 'active' : ''}
            onClick={() => setMode('preview')}
          >
            预览
          </button>
          <button
            className="danger"
            onClick={() => {
              if (window.confirm(`确定删除「${active.title}」？`)) {
                onDelete(active.folder, active.id);
              }
            }}
          >
            删除
          </button>
        </div>
      </div>

      {mode === 'edit' ? (
        <textarea
          className="article-editor"
          value={active.content}
          onChange={(e) =>
            onUpdate(active.folder, active.id, { content: e.target.value })
          }
          placeholder="在这里写 Markdown…"
        />
      ) : (
        <div
          className="article-preview markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      <div className="article-meta">
        文件夹：{active.folder} · 文件：
        {active.filePath ?? `${active.folder}/${active.id}.md`} · 最后更新：
        {new Date(active.updatedAt).toLocaleString('zh-CN')}
      </div>
    </main>
  );
};

export default ArticlePanel;