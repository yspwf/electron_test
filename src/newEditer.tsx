import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from 'react';
import MarkdownIt from 'markdown-it';

// ========== 类型定义 ==========
interface Note {
  id: number;
  title: string;
  date: string;
  content: string; // Markdown 源码
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  targetId: number | null;
}

// ========== Markdown 工具函数 ==========
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
});

const parseMarkdown = (source: string) => {
  const env = {};
  const tokens = markdown.parse(source, env);
  const titleIndex = tokens.findIndex(
    (token) => token.type === 'heading_open' && token.tag === 'h1' && token.level === 0
  );
  return { tokens, titleIndex, env };
};

const getTitleFromMarkdown = (md: string): string => {
  const { tokens, titleIndex } = parseMarkdown(md);
  return titleIndex < 0
    ? '未命名文档'
    : tokens[titleIndex + 1]?.content.replace(/\s+/g, ' ').trim() || '未命名文档';
};

const updateMarkdownTitle = (md: string, newTitle: string): string => {
  const { tokens, titleIndex } = parseMarkdown(md);
  const titleLines = tokens[titleIndex]?.map;
  if (!titleLines) return `# ${newTitle}\n\n${md}`;

  const lines = md.split(/\r?\n/);
  lines.splice(titleLines[0], titleLines[1] - titleLines[0], `# ${newTitle}`);
  return lines.join('\n');
};

const renderMarkdownBody = (source: string): string => {
  const { tokens, titleIndex, env } = parseMarkdown(source);
  if (titleIndex >= 0) tokens.splice(titleIndex, 3);
  return markdown.renderer.render(tokens, markdown.options, env);
};

const stripMarkdown = (md: string): string => {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^ {0,3}(?:`{3,}|~{3,}).*$/gm, '')
    .replace(/`+([^`]+)`+/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
};

const highlightKeyword = (text: string, keyword: string): React.ReactNode => {
  if (!keyword) return text;
  const reg = new RegExp(
    `(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  );
  return text.split(reg).map((part, index) =>
    index % 2 === 1 ? (
      <span className="search-highlight" key={index}>{part}</span>
    ) : part
  );
};

// ========== 组件 ==========
const Editor: React.FC = () => {
  // ========== 状态 ==========
  const [notes, setNotes] = useState<Note[]>(() => {
    const initialNotes: Note[] = [
      {
        id: Date.now(),
        title: '统一对称的渐变',
        date: '2024/10/25 19:00',
        content: `# 统一对称的渐变

现在，无论是点击添加还是删除，左侧列表的背景和文字都遵循**完全一致的纯透明度与微缩放过渡**。

> 没有高度从 0 展开的挤压感，只有元素像水面上的倒影一样，平滑地浮现和消隐。下方的列表会通过 FLIP 动画，极其柔和地让出或填补空间。

💡 交互提示：双击标题重命名，右键更多操作，支持 Ctrl+F 搜索、上下键切换。
`,
      },
      {
        id: Date.now() + 1,
        title: '关于人类编辑习惯',
        date: '2024/10/24 10:05',
        content: `# 关于人类编辑习惯

## 符合直觉的交互

平滑滚动、智能选中、键盘导航，符合桌面端用户的使用习惯。
`,
      },
      {
        id: Date.now() + 2,
        title: '技术架构说明',
        date: '2024/10/22 16:30',
        content: `# 技术架构说明

## 技术细节

纯前端实现，利用 Web API 打造丝滑质感，基于 FLIP 思想实现高性能列表动画。
`,
      },
      {
        id: Date.now() + 3,
        title: '交互设计原则',
        date: '2024/10/20 09:12',
        content: `# 交互设计原则

好的交互应该是无感的，用户只需要关注内容本身，而不是如何操作。
`,
      },
    ];
    return initialNotes;
  });

  const [activeNoteId, setActiveNoteId] = useState<number | null>(
    notes[0]?.id ?? null
  );
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    targetId: null,
  });
  const [showToast, setShowToast] = useState<boolean>(false);
  const [deletedBackup, setDeletedBackup] = useState<{
    note: Note;
    index: number;
  } | null>(null);

  // ========== Refs ==========
  const listRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const editTitleRef = useRef<HTMLHeadingElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const prevPositions = useRef<Map<string, number>>(new Map());
  const toastTimer = useRef<number | null>(null);
  const renameCancelled = useRef(false);
  const notesRef = useRef(notes);
  const deleteTimers = useRef<Map<number, number>>(new Map());
  const newNoteFocusTimer = useRef<number | null>(null);
  const nextNoteId = useRef(Math.max(0, ...notes.map((note) => note.id)));

  useLayoutEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // ========== 工具函数 ==========
  const getCurrentTime = useCallback((): string => {
    const d = new Date();
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(
      d.getHours()
    ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  const formatRelativeTime = useCallback((dateStr: string): string => {
    const date = new Date(dateStr.replace(/\//g, '-'));
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return `今天 ${hours}:${mins}`;
    } else if (diffDays === 1) {
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return `昨天 ${hours}:${mins}`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return dateStr.split(' ')[0] ?? '';
    }
  }, []);

  // 过滤后的笔记列表
  const filteredNotes = useMemo((): Note[] => {
    if (!searchKeyword.trim()) return notes;
    const kw = searchKeyword.toLowerCase().trim();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(kw) ||
        stripMarkdown(note.content).toLowerCase().includes(kw)
    );
  }, [notes, searchKeyword]);

  // 当前激活的笔记
  const activeNote = useMemo((): Note | null => {
    return notes.find((n) => n.id === activeNoteId) ?? null;
  }, [notes, activeNoteId]);

  // 标题 DOM 由浏览器维护，输入时不重写内容以保留光标和中文输入状态。
  useLayoutEffect(() => {
    const heading = editTitleRef.current;
    if (!heading || document.activeElement === heading) return;
    if (heading.textContent !== activeNote?.title) {
      heading.textContent = activeNote?.title ?? '';
    }
  }, [activeNote?.id, activeNote?.title]);

  useEffect(() => {
    if (editingId === null) return;
    renameCancelled.current = false;
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [editingId]);

  // 当前笔记渲染后的 HTML 正文（去掉一级标题）
  const renderedBodyHtml = useMemo((): string => {
    if (!activeNote) return '';
    return renderMarkdownBody(activeNote.content);
  }, [activeNote?.content]);

  // ========== FLIP 动画 ==========
  const recordPositions = useCallback((): void => {
    if (!listRef.current) return;
    const wrappers = listRef.current.querySelectorAll('.note-item-wrapper');
    const positions = new Map<string, number>();
    wrappers.forEach((w) => {
      const el = w as HTMLElement;
      positions.set(el.dataset.id!, el.getBoundingClientRect().top);
    });
    prevPositions.current = positions;
  }, []);

  const performFLIP = useCallback((): void => {
    if (!listRef.current || prevPositions.current.size === 0) return;

    const wrappers = listRef.current.querySelectorAll('.note-item-wrapper');
    const newTops = new Map<string, number>();
    wrappers.forEach((w) => {
      const el = w as HTMLElement;
      newTops.set(el.dataset.id!, el.getBoundingClientRect().top);
    });

    wrappers.forEach((w) => {
      const el = w as HTMLElement;
      const id = el.dataset.id!;
      const oldTop = prevPositions.current.get(id);
      const newTop = newTops.get(id);

      if (oldTop !== undefined && newTop !== undefined) {
        const deltaY = oldTop - newTop;
        if (deltaY !== 0) {
          el.classList.remove('fade-hidden');
          el.style.transition = 'none';
          el.style.transform = `translateY(${deltaY}px)`;

          requestAnimationFrame(() => {
            el.style.transition =
              'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
            el.style.transform = 'translateY(0)';

            setTimeout(() => {
              el.style.transition = '';
              el.style.transform = '';
            }, 400);
          });
        }
      } else {
        el.classList.add('fade-hidden');
        requestAnimationFrame(() => {
          setTimeout(() => {
            el.classList.remove('fade-hidden');
          }, 120);
        });
      }
    });
  }, []);

  useLayoutEffect(() => {
    if (prevPositions.current.size > 0) {
      performFLIP();
    }
    recordPositions();
  }, [filteredNotes, performFLIP, recordPositions]);

  // ========== 交互逻辑 ==========
  const handleSwitchNote = useCallback(
    (id: number): void => {
      if (activeNoteId === id) return;
      setActiveNoteId(id);
      setEditingId(null);

      const wrapper = document.querySelector(
        `.note-item-wrapper[data-id="${id}"]`
      ) as HTMLElement | null;
      if (wrapper) {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
    [activeNoteId]
  );

  const startRename = useCallback((id: number): void => {
    setEditingId(id);
  }, []);

  const saveRename = useCallback(
    (id: number, value: string): void => {
      const newTitle = value.replace(/\s+/g, ' ').trim() || '未命名文档';
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id === id) {
            const newContent = updateMarkdownTitle(note.content, newTitle);
            return { ...note, title: newTitle, content: newContent, date: getCurrentTime() };
          }
          return note;
        })
      );
      setEditingId(null);
    },
    [getCurrentTime]
  );

  // 新建笔记
  const handleAddNote = useCallback((): void => {
    setSearchKeyword('');
    const newId = Math.max(Date.now(), nextNoteId.current + 1);
    nextNoteId.current = newId;
    const title = `未命名文档 ${notes.length + 1}`;
    const newNote: Note = {
      id: newId,
      title,
      date: getCurrentTime(),
      content: `# ${title}\n\n开始创作你的想法...\n`,
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newId);
    setEditingId(null);

    // 新建后自动聚焦正文编辑区
    if (newNoteFocusTimer.current !== null) clearTimeout(newNoteFocusTimer.current);
    newNoteFocusTimer.current = window.setTimeout(() => {
      if (contentTextareaRef.current?.dataset.noteId !== String(newId)) return;
      contentTextareaRef.current?.focus();
      contentTextareaRef.current?.setSelectionRange(0, 0);
    }, 450);

    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [notes.length, getCurrentTime]);

  // 删除指定笔记
  const handleDeleteNoteById = useCallback(
    (noteId: number): void => {
      if (deleteTimers.current.has(noteId)) return;
      if (!notesRef.current.some((note) => note.id === noteId)) return;

      setDeletingIds((prev) => new Set([...prev, noteId]));

      const timer = window.setTimeout(() => {
        deleteTimers.current.delete(noteId);
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });

        const currentNotes = notesRef.current;
        const currentIndex = currentNotes.findIndex((note) => note.id === noteId);
        const currentNote = currentNotes[currentIndex];
        if (!currentNote) return;

        setDeletedBackup({ note: { ...currentNote }, index: currentIndex });
        notesRef.current = currentNotes.filter((note) => note.id !== noteId);
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
        const remaining = currentNotes.filter(
          (note) => note.id !== noteId && !deleteTimers.current.has(note.id)
        );
        const nextNote = remaining[Math.min(currentIndex, remaining.length - 1)];
        setActiveNoteId((currentId) =>
          currentId === noteId ? nextNote?.id ?? null : currentId
        );
        setEditingId((currentId) => currentId === noteId ? null : currentId);

        setShowToast(true);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => {
          setShowToast(false);
          setDeletedBackup(null);
        }, 3000);
      }, 250);
      deleteTimers.current.set(noteId, timer);
    },
    []
  );

  const handleDeleteNote = useCallback((): void => {
    if (activeNoteId === null || notes.length === 0) return;
    handleDeleteNoteById(activeNoteId);
  }, [activeNoteId, notes.length, handleDeleteNoteById]);

  // 撤销删除
  const handleUndo = useCallback((): void => {
    if (!deletedBackup) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setShowToast(false);

    const { note, index } = deletedBackup;
    setNotes((prev) => {
      if (prev.some((currentNote) => currentNote.id === note.id)) return prev;
      const next = [...prev];
      next.splice(index, 0, note);
      return next;
    });
    setActiveNoteId(note.id);
    setDeletedBackup(null);

    setTimeout(() => {
      const wrapper = document.querySelector(
        `.note-item-wrapper[data-id="${note.id}"]`
      ) as HTMLElement | null;
      wrapper?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }, [deletedBackup]);

  // 右侧标题编辑联动
  const handleTitleInput = useCallback(
    (e: React.FormEvent<HTMLHeadingElement>): void => {
      const target = e.currentTarget;
      const newTitle = target.textContent?.replace(/\s+/g, ' ').trim() || '未命名文档';

      setNotes((prev) =>
        prev.map((note) => {
          if (note.id === activeNoteId) {
            return {
              ...note,
              title: newTitle,
              content: updateMarkdownTitle(note.content, newTitle),
              date: getCurrentTime(),
            };
          }
          return note;
        })
      );
    },
    [activeNoteId, getCurrentTime]
  );

  const handleTitleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLHeadingElement>): void => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    []
  );

  // 🌟 新增：正文 Markdown 实时编辑
  const handleContentInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
      const newContent = e.target.value;
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id === activeNoteId) {
            // 同步更新标题（如果修改了一级标题）
            const newTitle = getTitleFromMarkdown(newContent);
            return {
              ...note,
              title: newTitle,
              content: newContent,
              date: getCurrentTime(),
            };
          }
          return note;
        })
      );
    },
    [activeNoteId, getCurrentTime]
  );

  // 搜索
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setSearchKeyword(e.currentTarget.value);
    },
    []
  );

  const handleSearchKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Escape') {
        setSearchKeyword('');
        e.currentTarget.blur();
      }
    },
    []
  );

  // 右键菜单
  const showContextMenu = useCallback(
    (e: React.MouseEvent, noteId: number): void => {
      e.preventDefault();
      e.stopPropagation();

      if (!sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      const menuWidth = 160;
      const menuHeight = 130;
      if (x + menuWidth > rect.width) x = rect.width - menuWidth - 8;
      if (y + menuHeight > rect.height) y = rect.height - menuHeight - 8;

      setContextMenu({ show: true, x, y, targetId: noteId });
    },
    []
  );

  const hideContextMenu = useCallback((): void => {
    setContextMenu((prev) => ({ ...prev, show: false, targetId: null }));
  }, []);

  const handleContextMenuClick = useCallback(
    (e: React.MouseEvent): void => {
      const item = (e.target as HTMLElement).closest('.context-menu-item');
      if (!item || contextMenu.targetId === null) return;

      const action = item.getAttribute('data-action');
      if (action === 'rename') startRename(contextMenu.targetId);
      if (action === 'delete') handleDeleteNoteById(contextMenu.targetId);
      if (action === 'new') handleAddNote();

      hideContextMenu();
    },
    [contextMenu.targetId, startRename, handleDeleteNoteById, handleAddNote, hideContextMenu]
  );

  // ========== 键盘快捷键 ==========
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || e.isComposing) return;
      const target = e.target as HTMLElement;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleAddNote();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const input = document.querySelector('.search-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
        return;
      }

      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target.isContentEditable)
        return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteNote();
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredNotes.length === 0) return;

        const currentIndex = filteredNotes.findIndex(
          (n) => n.id === activeNoteId
        );
        let nextIndex = currentIndex;

        if (e.key === 'ArrowUp') {
          nextIndex = Math.max(0, currentIndex - 1);
        } else {
          nextIndex = Math.min(filteredNotes.length - 1, currentIndex + 1);
        }

        if (nextIndex !== currentIndex && nextIndex >= 0) {
          const nextNote = filteredNotes[nextIndex];
          if (nextNote) handleSwitchNote(nextNote.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [handleAddNote, handleDeleteNote, handleSwitchNote, filteredNotes, activeNoteId]);

  // 点击空白关闭右键菜单
  useEffect(() => {
    const handleClick = (): void => hideContextMenu();
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', hideContextMenu, true);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', hideContextMenu, true);
    };
  }, [hideContextMenu]);

  // 组件卸载清理定时器
  useEffect(() => {
    const timers = deleteTimers.current;
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (newNoteFocusTimer.current !== null) clearTimeout(newNoteFocusTimer.current);
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  // ========== 渲染 ==========
  return (
    <div className="editor-app">
      <style>{`
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
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .editor-app {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
          background-color: var(--bg-app);
          color: var(--text-secondary);
          height: 100vh;
          display: flex;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
        }
        ::selection {
          background-color: rgba(47, 129, 247, 0.3);
          color: var(--text-primary);
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }

        /* 侧边栏 */
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
        #delete-btn:hover:not(:disabled) { color: var(--danger-color); }

        /* 搜索框 */
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
        .search-input:focus {
          border-color: var(--accent-color);
          background-color: var(--bg-sidebar);
        }
        .search-input::placeholder { color: var(--text-quaternary); }

        .note-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px 12px 8px;
          overflow-x: hidden;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        /* 列表项 */
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
        .note-item:focus-visible {
          outline: 2px solid var(--accent-color);
          outline-offset: -2px;
        }
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
        .note-item.active::before {
          opacity: 1;
          transform: translateY(-50%) scaleY(1);
        }

        /* 高亮动画 */
        .note-item.highlight {
          animation: noteHighlight 1.2s ease-out forwards;
        }
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
        .note-item-wrapper:not(.fade-hidden) .note-title {
          opacity: 1;
          transform: translateY(0);
        }
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
        .note-item-wrapper:not(.fade-hidden) .note-preview {
          opacity: 1;
          transform: translateY(0);
        }
        .note-date {
          font-size: 11px;
          color: var(--text-quaternary);
          font-variant-numeric: tabular-nums;
          line-height: 1.4;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.3s ease 0.12s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.12s;
        }
        .note-item-wrapper:not(.fade-hidden) .note-date {
          opacity: 1;
          transform: translateY(0);
        }

        /* 重命名输入框 */
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

        /* 快捷删除按钮 */
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
        .note-item-action:hover {
          color: var(--danger-color);
          background-color: rgba(248, 81, 73, 0.1);
        }

        /* 右键菜单 */
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
        .context-menu.show {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }
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
        .context-menu-item:hover {
          background-color: var(--bg-hover);
          color: var(--text-primary);
        }
        .context-menu-item.danger { color: var(--danger-color); }
        .context-menu-item.danger:hover { background-color: rgba(248, 81, 73, 0.1); }
        .context-menu-divider {
          height: 1px;
          background-color: var(--border-subtle);
          margin: 4px 0;
        }

        /* Toast */
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
        .toast.show {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .toast-undo {
          color: var(--accent-color);
          cursor: pointer;
          font-weight: 500;
          background: none;
          border: none;
          font-size: 12.5px;
        }
        .toast-undo:hover { text-decoration: underline; }

        /* 编辑区 - 双栏布局 */
        .main-content {
          flex: 1;
          min-width: 0;
          display: flex;
          overflow: hidden;
          background-color: var(--bg-editor);
        }
        .editor-pane {
          flex: 1;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border-subtle);
        }
        .preview-pane {
          flex: 1;
          min-width: 0;
          min-height: 0;
          overflow-y: auto;
          padding: 60px 40px;
        }
        .content-textarea {
          flex: 1;
          min-height: 0;
          width: 100%;
          padding: 60px 40px;
          background-color: var(--bg-editor);
          color: var(--text-secondary);
          border: none;
          outline: none;
          resize: none;
          font-family: "SF Mono", Consolas, monospace;
          font-size: 14px;
          line-height: 1.8;
        }
        .pane-header {
          padding: 10px 16px;
          font-size: 12px;
          color: var(--text-tertiary);
          border-bottom: 1px solid var(--border-subtle);
          background-color: var(--bg-sidebar);
          user-select: none;
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
        h1, h2, h3, h4 {
          color: var(--text-primary);
          margin-top: 1.5em;
          margin-bottom: 0.6em;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        h1 {
          font-size: 2.2em;
          margin-top: 0;
          padding-bottom: 0.3em;
          border-bottom: 1px solid var(--border-subtle);
          outline: none;
          cursor: text;
        }
        h1:empty:before {
          content: '输入标题...';
          color: var(--text-tertiary);
        }
        h2 { font-size: 1.6em; margin-top: 2em; }
        h3 { font-size: 1.25em; }
        p { margin-bottom: 1.2em; }
        a { color: var(--accent-color); text-decoration: none; transition: color 0.2s; }
        a:hover { color: #58a6ff; text-decoration: underline; }
        blockquote {
          border-left: 4px solid var(--border-strong);
          padding: 8px 20px;
          margin: 1.5em 0;
          color: var(--text-tertiary);
          background-color: rgba(255,255,255,0.02);
          border-radius: 0 6px 6px 0;
        }
        ul, ol { margin-bottom: 1.2em; padding-left: 24px; }
        li { margin-bottom: 6px; }
        li::marker { color: var(--accent-color); }
        pre {
          background-color: var(--bg-code);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          margin: 1.5em 0;
          font-family: "SF Mono", Consolas, monospace;
          font-size: 14px;
        }
        code {
          background-color: var(--bg-code);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: "SF Mono", Consolas, monospace;
          font-size: 0.9em;
        }

        /* 空状态 */
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
        @media (max-width: 1000px) {
          .main-content { flex-direction: column; }
          .editor-pane {
            border-right: none;
            border-bottom: 1px solid var(--border-subtle);
          }
          .content-textarea, .preview-pane { padding: 24px; }
        }
      `}</style>

      {/* 侧边栏 */}
      <aside className="sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          <div className="brand">Notes</div>
          <div className="actions">
            <button
              id="add-btn"
              title="新建文档 (Ctrl+N)"
              onClick={handleAddNote}
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
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button
              id="delete-btn"
              title="删除当前文档 (Delete)"
              onClick={handleDeleteNote}
              disabled={notes.length === 0}
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
            type="text"
            className="search-input"
            placeholder="搜索笔记 (Ctrl+F)"
            value={searchKeyword}
            onChange={handleSearch}
            onKeyDown={handleSearchKeydown}
          />
        </div>

        <div className="note-list" ref={listRef}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`note-item-wrapper ${
                deletingIds.has(note.id) ? 'fade-hidden' : ''
              }`}
              data-id={note.id}
            >
              <div
                className={`note-item ${
                  note.id === activeNoteId ? 'active' : ''
                }`}
                tabIndex={0}
                onClick={() => handleSwitchNote(note.id)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startRename(note.id);
                }}
                onContextMenu={(e) => showContextMenu(e, note.id)}
              >
                <div className="note-item-content">
                  {editingId === note.id ? (
                    <input
                      ref={renameInputRef}
                      className="note-title-input"
                      defaultValue={note.title}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        if (renameCancelled.current) {
                          renameCancelled.current = false;
                          setEditingId(null);
                        } else {
                          saveRename(note.id, e.currentTarget.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          renameCancelled.current = true;
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
                    {highlightKeyword(
                      stripMarkdown(note.content).slice(0, 35),
                      searchKeyword
                    )}
                  </div>
                  <div className="note-date" title={note.date}>
                    {formatRelativeTime(note.date)}
                  </div>
                </div>
                <div
                  className="note-item-action"
                  title="删除"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNoteById(note.id);
                  }}
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
          ))}
        </div>

        {/* 撤销提示 */}
        <div className={`toast ${showToast ? 'show' : ''}`}>
          <span>已删除 1 篇笔记</span>
          <button className="toast-undo" onClick={handleUndo}>
            撤销
          </button>
        </div>

        {/* 右键菜单 */}
        <div
          className={`context-menu ${contextMenu.show ? 'show' : ''}`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={handleContextMenuClick}
        >
          <div className="context-menu-item" data-action="rename">
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
          <div className="context-menu-item" data-action="new">
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
          <div className="context-menu-item danger" data-action="delete">
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

      {/* 主编辑区 - 双栏：源码编辑 + 实时预览 */}
      <main className="main-content">
        {activeNote ? (
          <>
            {/* 左侧：源码编辑区 */}
            <div className="editor-pane">
              <div className="pane-header">编辑</div>
              <textarea
                key={activeNote.id}
                ref={contentTextareaRef}
                data-note-id={activeNote.id}
                aria-label="Markdown 源码"
                className="content-textarea"
                value={activeNote.content}
                onChange={handleContentInput}
                spellCheck={false}
              />
            </div>

            {/* 右侧：预览区 */}
            <div className="preview-pane">
              <div className="editor">
                <h1
                  key={activeNote.id}
                  ref={editTitleRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleTitleInput}
                  onKeyDown={handleTitleKeydown}
                  onBlur={(e) => {
                    e.currentTarget.textContent = activeNote.title;
                  }}
                />
                <div dangerouslySetInnerHTML={{ __html: renderedBodyHtml }} />
              </div>
            </div>
          </>
        ) : (
          <div className="editor empty-state" style={{ flex: 1 }}>
            <h1>暂无笔记</h1>
            <p>开始创建你的第一篇文档吧</p>
            <button className="empty-state-btn" onClick={handleAddNote}>
              + 新建文档
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export { Editor };
