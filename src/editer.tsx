'use client';

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

/* ========================= 类型 ========================= */

interface Note {
  id: number;
  title: string;
  date: string;
  content: string;
}

interface DeletedBackup {
  note: Note;
  index: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  targetId: number;
}

/* ========================= 初始数据 ========================= */

const INITIAL_NOTES: Note[] = [
  {
    id: 1,
    title: '统一对称的渐变',
    date: '2024/10/25 19:00',
    content: `
      <h1 contenteditable="true">统一对称的渐变</h1>
      <p>现在，无论是点击添加还是删除，左侧列表的背景和文字都遵循<strong>完全一致的纯透明度与微缩放过渡</strong>。</p>
      <blockquote>
        没有高度从 0 展开的挤压感，只有元素像水面上的倒影一样，平滑地浮现和消隐。下方的列表会通过 FLIP 动画，极其柔和地让出或填补空间。
      </blockquote>
      <p>💡 交互提示：双击标题重命名，右键更多操作，支持 Ctrl+F 搜索、上下键切换。</p>
    `,
  },
  {
    id: 2,
    title: '关于人类编辑习惯',
    date: '2024/10/24 10:05',
    content: `<h1 contenteditable="true">关于人类编辑习惯</h1><h2>符合直觉的交互</h2><p>平滑滚动、智能选中、键盘导航，符合桌面端用户的使用习惯。</p>`,
  },
  {
    id: 3,
    title: '技术架构说明',
    date: '2024/10/22 16:30',
    content: `<h1 contenteditable="true">技术架构说明</h1><h2>技术细节</h2><p>纯前端实现，利用 Web API 打造丝滑质感，基于 FLIP 思想实现高性能列表动画。</p>`,
  },
  {
    id: 4,
    title: '交互设计原则',
    date: '2024/10/20 09:12',
    content: `<h1 contenteditable="true">交互设计原则</h1><p>好的交互应该是无感的，用户只需要关注内容本身，而不是如何操作。</p>`,
  },
];

/* ========================= 工具函数 ========================= */

function getCurrentTime(): string {
  const d = new Date();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(
    d.getHours(),
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 兼容 SSR：没有 document 时退化为正则去标签 */
function stripHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr.replace(/\//g, '-'));
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return `今天 ${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes(),
    ).padStart(2, '0')}`;
  }
  if (diffDays === 1) {
    return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes(),
    ).padStart(2, '0')}`;
  }
  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }
  return dateStr.split(' ')[0] || '';
}

function highlightKeyword(text: string, keyword: string): React.ReactNode {
  if (!keyword) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  const lowerKeyword = keyword.toLowerCase();
  return parts.map((part, i) =>
    part.toLowerCase() === lowerKeyword ? (
      <span key={i} className="search-highlight">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

/* ========================= 样式（全部在组件内注入） ========================= */

const STYLES = `
    :root {
        --bg-app: #090b0f;
        --bg-sidebar: #0e1015;
        --bg-editor: #14171d;
        --bg-hover: #1c2027;
        --bg-active: #242a34;
        --bg-code: #0d1117;
        --border-subtle: #21262d;
        --border-strong: #30363d;
        --text-primary: #f0f6fc;
        --text-secondary: #c9d1d9;
        --text-tertiary: #8b949e;
        --text-quaternary: #6e7681;
        --accent-color: #2f81f7;
        --danger-color: #f85149;
    }

    .notes-app,
    .notes-app * { box-sizing: border-box; margin: 0; padding: 0; }

    .notes-app {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
        background-color: var(--bg-app);
        color: var(--text-secondary);
        height: 100vh;
        display: flex;
        overflow: hidden;
        -webkit-font-smoothing: antialiased;
    }

    .notes-app ::selection {
        background-color: rgba(47, 129, 247, 0.3);
        color: var(--text-primary);
    }

    .notes-app ::-webkit-scrollbar { width: 8px; height: 8px; }
    .notes-app ::-webkit-scrollbar-track { background: transparent; }
    .notes-app ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
    .notes-app ::-webkit-scrollbar-thumb:hover { background: #484f58; }

    .sidebar {
        width: 280px;
        background-color: var(--bg-sidebar);
        border-right: 1px solid var(--border-subtle);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        position: relative;
    }

    .sidebar-header {
        padding: 18px 16px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .brand {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 0.02em;
        user-select: none;
    }

    .actions { display: flex; gap: 4px; }
    .actions button {
        background: transparent;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .actions button:hover:not(:disabled) { background-color: var(--bg-hover); color: var(--text-primary); }
    .actions button:active:not(:disabled) { transform: scale(0.85); }
    .actions button:disabled { opacity: 0.35; cursor: not-allowed; }
    .delete-btn:hover:not(:disabled) { color: var(--danger-color); }

    .search-container { padding: 0 12px 10px; }
    .search-input {
        width: 100%;
        height: 30px;
        padding: 0 10px 0 30px;
        background-color: var(--bg-editor);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        color: var(--text-secondary);
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s ease, background-color 0.2s ease;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: 10px center;
    }
    .search-input:focus { border-color: var(--accent-color); background-color: var(--bg-sidebar); }
    .search-input::placeholder { color: var(--text-quaternary); }

    .note-list {
        flex: 1;
        overflow-y: auto;
        padding: 4px 12px 8px;
        overflow-x: hidden;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
    }

    .note-item-wrapper {
        position: relative;
        margin-bottom: 2px;
        transform-origin: top center;
        transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .note-item-wrapper.fade-hidden {
        opacity: 0;
        transform: scale(0.96);
        pointer-events: none;
    }

    .note-item {
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        background-color: transparent;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: flex-start;
        gap: 8px;
    }
    .note-item:hover { background-color: var(--bg-hover); }
    .note-item.active { background-color: var(--bg-active); }
    .note-item:focus-visible { outline: 2px solid var(--accent-color); outline-offset: -2px; }

    .note-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%) scaleY(0);
        width: 3px;
        height: 16px;
        background-color: var(--accent-color);
        border-radius: 0 4px 4px 0;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .note-item.active::before { opacity: 1; transform: translateY(-50%) scaleY(1); }

    .note-item.highlight { animation: noteHighlight 1.2s ease-out forwards; }
    @keyframes noteHighlight {
        0% { background-color: rgba(47, 129, 247, 0.18); }
        100% { background-color: transparent; }
    }

    .note-item-content { flex: 1; min-width: 0; }

    .note-title {
        font-size: 13.5px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.4;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.3s ease 0.05s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.05s;
    }
    .note-item-wrapper:not(.fade-hidden) .note-title { opacity: 1; transform: translateY(0); }

    .search-highlight {
        color: var(--accent-color);
        background-color: rgba(47, 129, 247, 0.15);
        padding: 0 2px;
        border-radius: 2px;
    }

    .note-preview {
        font-size: 11.5px;
        color: var(--text-tertiary);
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 3px;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.3s ease 0.08s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.08s;
    }
    .note-item-wrapper:not(.fade-hidden) .note-preview { opacity: 1; transform: translateY(0); }

    .note-date {
        font-size: 11px;
        color: var(--text-quaternary);
        font-variant-numeric: tabular-nums;
        line-height: 1.4;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.3s ease 0.12s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.12s;
    }
    .note-item-wrapper:not(.fade-hidden) .note-date { opacity: 1; transform: translateY(0); }

    .note-title-input {
        width: 100%;
        font-size: 13.5px;
        font-weight: 500;
        color: var(--text-primary);
        background: var(--bg-editor);
        border: 1px solid var(--accent-color);
        border-radius: 4px;
        padding: 2px 6px;
        margin-bottom: 3px;
        outline: none;
        font-family: inherit;
    }

    .note-item-action {
        opacity: 0;
        flex-shrink: 0;
        padding: 2px;
        border-radius: 4px;
        color: var(--text-tertiary);
        cursor: pointer;
        transition: opacity 0.2s ease, color 0.2s ease, background-color 0.2s ease;
        margin-top: 2px;
    }
    .note-item:hover .note-item-action { opacity: 1; }
    .note-item-action:hover { color: var(--danger-color); background-color: rgba(248, 81, 73, 0.1); }

    .context-menu {
        position: absolute;
        min-width: 140px;
        background-color: var(--bg-active);
        border: 1px solid var(--border-strong);
        border-radius: 8px;
        padding: 4px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        z-index: 100;
        opacity: 0;
        transform: scale(0.96) translateY(-4px);
        pointer-events: none;
        transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .context-menu.show { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
    .context-menu-item {
        padding: 7px 12px;
        font-size: 13px;
        color: var(--text-secondary);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.15s ease;
    }
    .context-menu-item:hover { background-color: var(--bg-hover); color: var(--text-primary); }
    .context-menu-item.danger { color: var(--danger-color); }
    .context-menu-item.danger:hover { background-color: rgba(248, 81, 73, 0.1); }
    .context-menu-divider { height: 1px; background-color: var(--border-subtle); margin: 4px 0; }

    .toast {
        position: absolute;
        bottom: 16px;
        left: 16px;
        right: 16px;
        background: var(--bg-active);
        border: 1px solid var(--border-strong);
        border-radius: 8px;
        padding: 10px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12.5px;
        color: var(--text-secondary);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 10;
    }
    .toast.show { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .toast-undo {
        color: var(--accent-color);
        cursor: pointer;
        font-weight: 500;
        background: none;
        border: none;
        font-size: 12.5px;
    }
    .toast-undo:hover { text-decoration: underline; }

    .main-content {
        flex: 1;
        background-color: var(--bg-editor);
        overflow-y: auto;
        padding: 60px 40px;
        cursor: text;
    }
    .editor {
        max-width: 680px;
        margin: 0 auto;
        color: var(--text-secondary);
        line-height: 1.8;
        font-size: 16px;
        animation: contentFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes contentFadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .editor h1, .editor h2, .editor h3, .editor h4 {
        color: var(--text-primary);
        margin-top: 1.5em;
        margin-bottom: 0.6em;
        font-weight: 600;
        letter-spacing: -0.02em;
    }
    .editor h1 {
        font-size: 2.2em;
        margin-top: 0;
        padding-bottom: 0.3em;
        border-bottom: 1px solid var(--border-subtle);
        outline: none;
        cursor: text;
    }
    .editor h1:empty:before { content: '输入标题...'; color: var(--text-tertiary); }
    .editor h2 { font-size: 1.6em; margin-top: 2em; }
    .editor h3 { font-size: 1.25em; }
    .editor p { margin-bottom: 1.2em; }
    .editor a { color: var(--accent-color); text-decoration: none; transition: color 0.2s; }
    .editor a:hover { color: #58a6ff; text-decoration: underline; }

    .editor blockquote {
        border-left: 4px solid var(--border-strong);
        padding: 8px 20px;
        margin: 1.5em 0;
        color: var(--text-tertiary);
        background-color: rgba(255,255,255,0.02);
        border-radius: 0 6px 6px 0;
    }

    .editor ul, .editor ol { margin-bottom: 1.2em; padding-left: 24px; }
    .editor li { margin-bottom: 6px; }
    .editor li::marker { color: var(--accent-color); }

    .editor pre {
        background-color: var(--bg-code);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        padding: 16px;
        overflow-x: auto;
        margin: 1.5em 0;
        font-family: "SF Mono", Consolas, monospace;
        font-size: 14px;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 16px;
        color: var(--text-tertiary);
    }
    .empty-state h1 { border: none; font-size: 1.8em; margin-bottom: 0; }
    .empty-state-btn {
        background: var(--accent-color);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s ease;
    }
    .empty-state-btn:hover { background: #1a6fe0; }
`;

/* ========================= NoteItem ========================= */

interface NoteItemProps {
  note: Note;
  isActive: boolean;
  isDeleting: boolean;
  isRenaming: boolean;
  renameValue: string;
  searchKeyword: string;
  skipFadeIn: boolean;
  onSelect: (id: number) => void;
  onDoubleClick: (e: React.MouseEvent, id: number) => void;
  onContextMenu: (e: React.MouseEvent, id: number) => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
  onRenameChange: (value: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
}

function NoteItem({
  note,
  isActive,
  isDeleting,
  isRenaming,
  renameValue,
  searchKeyword,
  skipFadeIn,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onDelete,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
}: NoteItemProps) {
  const [fadeHidden, setFadeHidden] = useState(!skipFadeIn);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!fadeHidden) return;
    const id = requestAnimationFrame(() => setFadeHidden(false));
    return () => cancelAnimationFrame(id);
  }, [fadeHidden]);

  useEffect(() => {
    if (isRenaming) {
      cancelledRef.current = false;
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  const previewText = stripHtml(note.content)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 35);
  const relativeDate = formatRelativeTime(note.date);

  const wrapperClass = `note-item-wrapper${
    fadeHidden || isDeleting ? ' fade-hidden' : ''
  }`;

  return (
    <div className={wrapperClass} data-id={note.id}>
      <div
        className={`note-item${isActive ? ' active' : ''}`}
        tabIndex={0}
        onClick={() => onSelect(note.id)}
        onDoubleClick={(e) => onDoubleClick(e, note.id)}
        onContextMenu={(e) => onContextMenu(e, note.id)}
      >
        <div className="note-item-content">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              className="note-title-input"
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={() => {
                if (cancelledRef.current) {
                  cancelledRef.current = false;
                  onRenameCancel();
                } else {
                  onRenameCommit();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelledRef.current = true;
                  e.currentTarget.blur();
                }
                e.stopPropagation();
              }}
            />
          ) : (
            <div className="note-title">
              {highlightKeyword(note.title, searchKeyword)}
            </div>
          )}
          <div className="note-preview">
            {highlightKeyword(previewText, searchKeyword)}
          </div>
          <div className="note-date" title={note.date}>
            {relativeDate}
          </div>
        </div>
        <div
          className="note-item-action"
          title="删除"
          onClick={(e) => onDelete(e, note.id)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ========================= Editor ========================= */

interface EditorProps {
  note: Note | null;
  editorVersion: number;
  onTitleChange: (title: string) => void;
  onAddNote: () => void;
}

function Editor({ note, editorVersion, onTitleChange, onAddNote }: EditorProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;

  useLayoutEffect(() => {
    if (!innerRef.current || !note) return;
    innerRef.current.innerHTML = note.content;
  }, [note?.id, editorVersion]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'H1' && target.isContentEditable) {
        onTitleChangeRef.current(target.textContent?.trim() || '未命名文档');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'H1' && e.key === 'Enter') {
        e.preventDefault();
        target.blur();
      }
    };

    el.addEventListener('input', handleInput);
    el.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('input', handleInput);
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, [note?.id]);

  if (!note) {
    return (
      <main className="main-content">
        <div className="editor empty-state">
          <h1>暂无笔记</h1>
          <p>开始创建你的第一篇文档吧</p>
          <button className="empty-state-btn" onClick={onAddNote}>
            + 新建文档
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      <div key={note.id} ref={innerRef} className="editor" />
    </main>
  );
}

/* ========================= 主组件 ========================= */

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(
    INITIAL_NOTES[0]?.id ?? null,
  );
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [deletedBackup, setDeletedBackup] = useState<DeletedBackup | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevPositionsRef = useRef<Map<number, number>>(new Map());
  const toastTimerRef = useRef<number | null>(null);
  const searchDebounceRef = useRef<number | null>(null);
  const isInitialMountRef = useRef(true);
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const activeNoteIdRef = useRef(activeNoteId);
  activeNoteIdRef.current = activeNoteId;
  const searchKeywordRef = useRef(searchKeyword);
  searchKeywordRef.current = searchKeyword;

  /* ---------- 派生数据 ---------- */
  const filteredNotes = useMemo(() => {
    if (!searchKeyword.trim()) return notes;
    const kw = searchKeyword.toLowerCase().trim();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(kw) ||
        stripHtml(note.content).toLowerCase().includes(kw),
    );
  }, [notes, searchKeyword]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? null,
    [notes, activeNoteId],
  );

  /* ---------- 标记初始挂载结束 ---------- */
  useEffect(() => {
    isInitialMountRef.current = false;
  }, []);

  /* ---------- FLIP ---------- */
  useLayoutEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    const wrappers = Array.from(
      listEl.querySelectorAll<HTMLElement>('.note-item-wrapper'),
    );

    wrappers.forEach((w) => {
      w.style.transition = 'none';
      w.style.transform = '';
    });
    void listEl.offsetHeight;

    const newPositions = new Map<number, number>();
    wrappers.forEach((w) => {
      newPositions.set(Number(w.dataset.id), w.getBoundingClientRect().top);
    });

    const animated: HTMLElement[] = [];
    wrappers.forEach((w) => {
      const id = Number(w.dataset.id);
      const prevTop = prevPositionsRef.current.get(id);
      const newTop = newPositions.get(id);
      if (prevTop !== undefined && newTop !== undefined && prevTop !== newTop) {
        const deltaY = prevTop - newTop;
        w.style.transition = 'none';
        w.style.transform = `translateY(${deltaY}px)`;
        w.classList.remove('fade-hidden');
        animated.push(w);
      }
    });

    if (animated.length > 0) {
      void listEl.offsetHeight;
      requestAnimationFrame(() => {
        animated.forEach((w) => {
          w.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          w.style.transform = 'translateY(0)';
        });
      });
    }

    prevPositionsRef.current = newPositions;
  }, [filteredNotes]);

  /* ---------- 滚动到活动项 ---------- */
  useEffect(() => {
    if (activeNoteId === null) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `.note-item-wrapper[data-id="${activeNoteId}"]`,
    );
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeNoteId]);

  /* ---------- Toast ---------- */
  const showToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastVisible(true);
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
      setDeletedBackup(null);
    }, 3000);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastVisible(false);
  }, []);

  /* ---------- 切换 ---------- */
  const handleSwitchNote = useCallback((id: number) => {
    setActiveNoteId((prev) => (prev === id ? prev : id));
  }, []);

  /* ---------- 编辑器标题输入 ---------- */
  const handleEditorTitleChange = useCallback((newTitle: string) => {
    const id = activeNoteIdRef.current;
    if (id === null) return;
    const now = getCurrentTime();
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              title: newTitle,
              content: n.content.replace(
                /<h1[^>]*>.*?<\/h1>/,
                `<h1 contenteditable="true">${newTitle}</h1>`,
              ),
              date: now,
            }
          : n,
      ),
    );
  }, []);

  /* ---------- 新建 ---------- */
  const handleAddNote = useCallback(() => {
    setSearchInputValue('');
    setSearchKeyword('');

    const newId = Date.now();
    const newNote: Note = {
      id: newId,
      title: `未命名文档 ${notesRef.current.length + 1}`,
      date: getCurrentTime(),
      content: `<h1 contenteditable="true">未命名文档</h1><p>开始创作你的想法...</p>`,
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newId);

    setTimeout(() => {
      const h1 = document.querySelector<HTMLElement>(
        '.main-content .editor h1[contenteditable]',
      );
      if (h1) {
        h1.focus();
        const range = document.createRange();
        range.selectNodeContents(h1);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 450);
  }, []);

  /* ---------- 删除 ---------- */
  const handleDeleteNoteById = useCallback(
    (noteId: number) => {
      const current = notesRef.current;
      const currentIndex = current.findIndex((n) => n.id === noteId);
       const currentNote = current[currentIndex];
      if (!currentNote) return;

      setDeletingId(noteId);

      setTimeout(() => {
        // const backupNote = { ...current[currentIndex] };
        const newNotes = current.filter((n) => n.id !== noteId);

        setDeletedBackup({ note: {...currentNote}, index: currentIndex });
        setNotes(newNotes);

        if (noteId === activeNoteIdRef.current) {
          if (newNotes.length > 0) {
            const nextIndex =
              currentIndex >= newNotes.length
                ? newNotes.length - 1
                : currentIndex;
            const nextNote = newNotes[nextIndex];
            if (nextNote) {
                setActiveNoteId(nextNote.id);
            }
          } else {
            setActiveNoteId(null);
          }
        }

        setDeletingId(null);
        showToast();
      }, 250);
    },
    [showToast],
  );

  const handleDeleteActiveNote = useCallback(() => {
    const id = activeNoteIdRef.current;
    if (id === null) return;
    handleDeleteNoteById(id);
  }, [handleDeleteNoteById]);

  /* ---------- 撤销 ---------- */
  const handleUndo = useCallback(() => {
    if (!deletedBackup) return;
    hideToast();

    const { note, index } = deletedBackup;
    setNotes((prev) => {
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, note);
      return next;
    });
    setActiveNoteId(note.id);
    setDeletedBackup(null);
  }, [deletedBackup, hideToast]);

  /* ---------- 重命名 ---------- */
  const startRename = useCallback((noteId: number) => {
    const note = notesRef.current.find((n) => n.id === noteId);
    if (!note) return;
    setRenamingId(noteId);
    setRenameValue(note.title);
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId === null) return;
    const id = renamingId;
    const newTitle = renameValue.trim() || '未命名文档';
    const now = getCurrentTime();

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              title: newTitle,
              content: n.content.replace(
                /<h1[^>]*>.*?<\/h1>/,
                `<h1 contenteditable="true">${newTitle}</h1>`,
              ),
              date: now,
            }
          : n,
      ),
    );

    setRenamingId(null);
    setRenameValue('');
    if (id === activeNoteIdRef.current) {
      setEditorVersion((v) => v + 1);
    }
  }, [renamingId, renameValue]);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue('');
  }, []);

  /* ---------- 列表项事件 ---------- */
  const handleItemDoubleClick = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      startRename(id);
    },
    [startRename],
  );

  const handleItemContextMenu = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.preventDefault();
      e.stopPropagation();

      const sidebarEl = sidebarRef.current;
      if (!sidebarEl) return;
      const rect = sidebarEl.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      const menuWidth = 160;
      const menuHeight = 130;
      if (x + menuWidth > rect.width) x = rect.width - menuWidth - 8;
      if (y + menuHeight > rect.height) y = rect.height - menuHeight - 8;

      setContextMenu({ x, y, targetId: id });
    },
    [],
  );

  const handleItemDelete = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      handleDeleteNoteById(id);
    },
    [handleDeleteNoteById],
  );

  /* ---------- 右键菜单 ---------- */
  const hideContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    document.addEventListener('click', hideContextMenu);
    document.addEventListener('scroll', hideContextMenu, true);
    return () => {
      document.removeEventListener('click', hideContextMenu);
      document.removeEventListener('scroll', hideContextMenu, true);
    };
  }, [hideContextMenu]);

  const handleContextMenuAction = useCallback(
    (action: string) => {
      const targetId = contextMenu?.targetId;
      if (targetId === undefined) return;

      if (action === 'rename') startRename(targetId);
      if (action === 'delete') handleDeleteNoteById(targetId);
      if (action === 'new') handleAddNote();

      hideContextMenu();
    },
    [contextMenu, startRename, handleDeleteNoteById, handleAddNote, hideContextMenu],
  );

  /* ---------- 搜索 ---------- */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInputValue(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = window.setTimeout(() => {
        setSearchKeyword(value);
      }, 100);
    },
    [],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSearchInputValue('');
        setSearchKeyword('');
        e.currentTarget.blur();
      }
    },
    [],
  );

  /* ---------- 键盘快捷键 ---------- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target.isContentEditable)
        return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleAddNote();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteActiveNote();
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentNotes = notesRef.current;
        const kw = searchKeywordRef.current;
        const filtered = kw.trim()
          ? currentNotes.filter(
              (n) =>
                n.title.toLowerCase().includes(kw.toLowerCase().trim()) ||
                stripHtml(n.content)
                  .toLowerCase()
                  .includes(kw.toLowerCase().trim()),
            )
          : currentNotes;

        if (filtered.length === 0) return;
        const currentIndex = filtered.findIndex(
          (n) => n.id === activeNoteIdRef.current,
        );
        let nextIndex = currentIndex;
        if (e.key === 'ArrowUp') {
          nextIndex = Math.max(0, currentIndex - 1);
        } else {
          nextIndex = Math.min(filtered.length - 1, currentIndex + 1);
        }
        if (nextIndex !== currentIndex && nextIndex >= 0) {
            const nextNote = filteredNotes[nextIndex];
          if (nextNote) handleSwitchNote(nextNote.id);
        //   handleSwitchNote(filtered[nextIndex].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleAddNote, handleDeleteActiveNote, handleSwitchNote]);

  /* ---------- 渲染 ---------- */
  return (
    <div className="notes-app">
      {/* 关键：使用 dangerouslySetInnerHTML 注入 CSS，避免被转义 */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <aside className="sidebar" id="sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          <div className="brand">Notes</div>
          <div className="actions">
            <button id="add-btn" title="新建文档 (Ctrl+N)" onClick={handleAddNote}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button
              id="delete-btn"
              className="delete-btn"
              title="删除当前文档 (Delete)"
              disabled={notes.length === 0}
              onClick={handleDeleteActiveNote}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        </div>

        <div className="search-container">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="搜索笔记 (Ctrl+F)"
            value={searchInputValue}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        <div className="note-list" id="note-list" ref={listRef}>
          {filteredNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isActive={note.id === activeNoteId}
              isDeleting={note.id === deletingId}
              isRenaming={note.id === renamingId}
              renameValue={renamingId === note.id ? renameValue : ''}
              searchKeyword={searchKeyword}
              skipFadeIn={isInitialMountRef.current}
              onSelect={handleSwitchNote}
              onDoubleClick={handleItemDoubleClick}
              onContextMenu={handleItemContextMenu}
              onDelete={handleItemDelete}
              onRenameChange={setRenameValue}
              onRenameCommit={commitRename}
              onRenameCancel={cancelRename}
            />
          ))}
        </div>

        <div className={`toast${toastVisible ? ' show' : ''}`} id="toast">
          <span>已删除 1 篇笔记</span>
          <button className="toast-undo" id="undo-btn" onClick={handleUndo}>
            撤销
          </button>
        </div>

        <div
          className={`context-menu${contextMenu ? ' show' : ''}`}
          id="context-menu"
          style={
            contextMenu
              ? { left: contextMenu.x, top: contextMenu.y }
              : undefined
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="context-menu-item"
            data-action="rename"
            onClick={() => handleContextMenuAction('rename')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            重命名
          </div>
          <div
            className="context-menu-item"
            data-action="new"
            onClick={() => handleContextMenuAction('new')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            新建笔记
          </div>
          <div className="context-menu-divider" />
          <div
            className="context-menu-item danger"
            data-action="delete"
            onClick={() => handleContextMenuAction('delete')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
            </svg>
            删除
          </div>
        </div>
      </aside>

      <Editor
        note={activeNote}
        editorVersion={editorVersion}
        onTitleChange={handleEditorTitleChange}
        onAddNote={handleAddNote}
      />
    </div>
  );
}