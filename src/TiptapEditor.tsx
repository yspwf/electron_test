import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import DragHandle from '@tiptap/extension-drag-handle';
import { createLowlight, common } from 'lowlight';
import { CodeBlockLowlightMermaid } from 'tiptap-extension-mermaid';
import mermaid from 'mermaid';
import { Mathematics } from '@tiptap/extension-mathematics';
import type { Editor } from '@tiptap/react';
import type { Node as PMNode } from 'prosemirror-model';
import 'katex/dist/katex.min.css';
import './editor.css';

const lowlight = createLowlight(common);
mermaid.initialize({ startOnLoad: false });

interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

// ---------- 组件内 ref 定义 ----------
const targetNodePosRef = useRef<number | null>(null);


function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={isActive ? 'tiptap-btn is-active' : 'tiptap-btn'}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive('bold'),
      isItalic: ctx.editor.isActive('italic'),
      isStrike: ctx.editor.isActive('strike'),
      isUnderline: ctx.editor.isActive('underline'),
      isCode: ctx.editor.isActive('code'),
      isHighlight: ctx.editor.isActive('highlight'),
      isHeading1: ctx.editor.isActive('heading', { level: 1 }),
      isHeading2: ctx.editor.isActive('heading', { level: 2 }),
      isHeading3: ctx.editor.isActive('heading', { level: 3 }),
      isBulletList: ctx.editor.isActive('bulletList'),
      isOrderedList: ctx.editor.isActive('orderedList'),
      isTaskList: ctx.editor.isActive('taskList'),
      isBlockquote: ctx.editor.isActive('blockquote'),
      isCodeBlock: ctx.editor.isActive('codeBlock'),
      isLink: ctx.editor.isActive('link'),
      isAlignLeft: ctx.editor.isActive({ textAlign: 'left' }),
      isAlignCenter: ctx.editor.isActive({ textAlign: 'center' }),
      isAlignRight: ctx.editor.isActive({ textAlign: 'right' }),
      isTable: ctx.editor.isActive('table'),
      canUndo: ctx.editor.can().undo(),
      canRedo: ctx.editor.can().redo(),
    }),
  });

  if (!editorState) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('请输入链接地址', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('请输入图片地址');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const insertInlineMath = useCallback(() => {
    const latex = window.prompt('输入 LaTeX 行内公式', 'E = mc^2');
    if (latex) {
      editor.chain().focus().insertInlineMath({ latex }).run();
    }
  }, [editor]);

  const insertBlockMath = useCallback(() => {
    const latex = window.prompt('输入 LaTeX 块级公式', '\\sum_{i=1}^{n} x_i');
    if (latex) {
      editor.chain().focus().insertBlockMath({ latex }).run();
    }
  }, [editor]);

  return (
    <div className="tiptap-toolbar">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editorState.canUndo} title="撤销">↩</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editorState.canRedo} title="重做">↪</ToolbarButton>
      <span className="tiptap-divider" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editorState.isHeading1} title="标题 1">H1</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editorState.isHeading2} title="标题 2">H2</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editorState.isHeading3} title="标题 3">H3</ToolbarButton>
      <span className="tiptap-divider" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editorState.isBold} title="加粗 (Ctrl+B)"><strong>B</strong></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editorState.isItalic} title="斜体 (Ctrl+I)"><em>I</em></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editorState.isUnderline} title="下划线"><u>U</u></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editorState.isStrike} title="删除线"><s>S</s></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editorState.isHighlight} title="高亮">🖍</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editorState.isCode} title="行内代码">{'<>'}</ToolbarButton>
      <span className="tiptap-divider" />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editorState.isAlignLeft} title="左对齐">⬅</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editorState.isAlignCenter} title="居中">⬌</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editorState.isAlignRight} title="右对齐">➡</ToolbarButton>
      <span className="tiptap-divider" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editorState.isBulletList} title="无序列表">• 列表</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editorState.isOrderedList} title="有序列表">1. 列表</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editorState.isTaskList} title="任务列表">☑</ToolbarButton>
      <span className="tiptap-divider" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editorState.isBlockquote} title="引用">❝</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editorState.isCodeBlock} title="代码块">{'{ }'}</ToolbarButton>
      <span className="tiptap-divider" />

      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="插入表格"
      >
        ⊞
      </ToolbarButton>
      {editorState.isTable && (
        <>
          <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="左侧插入列">+列左</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="右侧插入列">+列右</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="删除列">−列</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} title="上方插入行">+行上</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="下方插入行">+行下</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="删除行">−行</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().mergeCells().run()} title="合并单元格">合并</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().splitCell().run()} title="拆分单元格">拆分</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="删除表格">删表</ToolbarButton>
        </>
      )}
      <span className="tiptap-divider" />

      <ToolbarButton onClick={setLink} isActive={editorState.isLink} title="插入链接">🔗</ToolbarButton>
      <ToolbarButton onClick={addImage} title="插入图片">🖼</ToolbarButton>
      <span className="tiptap-divider" />

      <ToolbarButton onClick={insertInlineMath} title="行内公式">∑</ToolbarButton>
      <ToolbarButton onClick={insertBlockMath} title="块级公式">∑<sub>block</sub></ToolbarButton>
      <span className="tiptap-divider" />

      <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="清除格式">✕</ToolbarButton>
    </div>
  );
}

export function TiptapEditor({
  content = '<p></p>',
  onChange,
  placeholder = '开始输入内容...',
}: TiptapEditorProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const targetNodePosRef = useRef(0);
  const isExternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'tiptap-link' },
      }),
      Image.configure({ inline: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),

      Table.configure({
        resizable: true,
        handleWidth: 4,
        cellMinWidth: 60,
      }),
      TableRow,
      TableHeader,
      TableCell,

      TaskList,
      TaskItem.configure({
        nested: true,
      }),

      CodeBlockLowlightMermaid.configure({
        lowlight,
        classList: 'mermaid-container',
        debounce: 400,
        mermaidConfig: { theme: 'neutral' },
      }),

    //   DragHandle.configure({
    //     computePositionConfig: {
    //       placement: 'left-start',
    //       strategy: 'absolute',
    //     },
    //     // 原版onNodeChange，hover时更新ref
    //     onNodeChange: ({ pos }) => {
    //       targetNodePosRef.current = pos;
    //     },
    //     render() {
    //       const el = document.createElement('div');
    //       el.classList.add('tiptap-drag-handle');
    //       el.innerHTML = '⋮⋮';
    //       el.style.cursor = 'grab';
    //       el.style.padding = '4px';

    //       el.addEventListener('mousedown', (e) => {
    //         e.preventDefault();
    //         e.stopPropagation();
    //       });

    //       // 和你原来一样的点击逻辑
    //       el.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         const rect = el.getBoundingClientRect();
    //         const menuWidth = 160;
    //         const left = Math.min(rect.left, window.innerWidth - menuWidth - 10);
    //         setMenuPos({ top: rect.bottom + 4, left });
    //         setMenuOpen(true);
    //         editor?.chain().focus().setNodeSelection(targetNodePosRef.current).run();
    //       });
    //       return el;
    //     },
    //   }),

   DragHandle.configure({
  computePositionConfig: {
    placement: 'left-start',
  },
  onNodeChange: ({ node, editor }: { node: PMNode | null; editor: Editor }) => {
    if (!node) {
      targetNodePosRef.current = null;
      return;
    }
    let foundPos: number | null = null;
    editor.state.doc.descendants((n: PMNode, p: number) => {
      if (n === node) {
        foundPos = p;
        return false;
      }
      return true;
    });
    targetNodePosRef.current = foundPos;
  },
  render() {
    const el = document.createElement('div');
    el.classList.add('tiptap-drag-handle');
    el.innerHTML = '⋮⋮';
    el.style.cursor = 'grab';
    el.style.padding = '4px';

    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const menuWidth = 160;
      const left = Math.min(rect.left, window.innerWidth - menuWidth - 10);
      setMenuPos({ top: rect.bottom + 4, left });
      setMenuOpen(true);

      const pos = targetNodePosRef.current;
      if (pos !== null) {
        editor.chain().focus().setNodeSelection(pos).run();
      }
    });

    return el;
  },
}),


      Mathematics.configure({
        inlineOptions: {
        //   onClick: (node, pos, editorInstance) => {
        //     const latex = window.prompt('编辑行内公式', node.attrs.latex);
        //     if (latex !== null && latex !== node.attrs.latex) {
        //       editorInstance.chain().setNodeSelection(pos).updateInlineMath({ latex }).focus().run();
        //     }
        //   },
          onClick: (node: PMNode, pos:number) => {
            const latex = window.prompt('编辑行内公式', node?.attrs.latex);
            if (latex !== null && latex !== node?.attrs.latex) {
                editor?.chain().setNodeSelection(pos).updateInlineMath({ latex }).focus().run();
            }
        },
        },
        blockOptions: {
        //   onClick: (node, pos, editorInstance) => {
        //     const latex = window.prompt('编辑块级公式', node.attrs.latex);
        //     if (latex !== null && latex !== node.attrs.latex) {
        //       editorInstance.chain().setNodeSelection(pos).updateBlockMath({ latex }).focus().run();
        //     }
        //   },
        onClick: (node: PMNode, pos: number) => {
            const latex = window.prompt('编辑块级公式', node?.attrs.latex);
                if (latex !== null && latex !== node?.attrs.latex) {
                    editor?.chain().setNodeSelection(pos).updateBlockMath({ latex }).focus().run();
                }
            },
        },
        katexOptions: {
          throwOnError: false,
          macros: {
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
          },
        },
      }),
    ],
    content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    // ✅ 新增：编辑器创建完成，主动拿到第一个block节点，给ref赋初始值，解决首行第一次hover不触发onNodeChange
    onCreate: ({ editor: ed }) => {
      const firstChild = ed.state.doc.firstChild;
      if (firstChild) {
        targetNodePosRef.current = 1;
      }
    },
    onUpdate: ({ editor: ed }) => {
      if (isExternalUpdate.current) return;
      onChange?.(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    isExternalUpdate.current = true;
    editor.commands.setContent(content);
    queueMicrotask(() => {
      isExternalUpdate.current = false;
    });
  }, [content, editor]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const inMenu = target.closest('.tiptap-node-menu');
      const inHandle = target.closest('.tiptap-drag-handle');
      if (!inMenu && !inHandle) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const handleMenuAction = useCallback(
    (action: () => void) => {
      action();
      closeMenu();
    },
    [closeMenu]
  );

  if (!editor) return null;

  return (
    <div className="tiptap-editor-wrapper">
      <EditorToolbar editor={editor} />

      <BubbleMenu
        editor={editor}
        shouldShow={({ from, to }) => from !== to}
        pluginKey="bubbleMenuText"
        hideOnEscape
        hideOnClick={false}
      >
        <div className="tiptap-bubble-menu">
          <button type="button" className={editor.isActive('bold') ? 'is-active' : ''} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
          <button type="button" className={editor.isActive('italic') ? 'is-active' : ''} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
          <button type="button" className={editor.isActive('underline') ? 'is-active' : ''} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
          <button type="button" className={editor.isActive('strike') ? 'is-active' : ''} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
          <button type="button" className={editor.isActive('code') ? 'is-active' : ''} onClick={() => editor.chain().focus().toggleCode().run()}>{'<>'}</button>
          <button type="button" className={editor.isActive('highlight') ? 'is-active' : ''} onClick={() => editor.chain().focus().toggleHighlight().run()}>🖍</button>
        </div>
      </BubbleMenu>

      {menuOpen && (
        <>
          <div className="tiptap-node-menu-backdrop" onMouseDown={closeMenu} />
          <div
            className="tiptap-node-menu"
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 999 }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="tiptap-node-menu-header">转换为</div>
            <button onClick={() => handleMenuAction(() => editor.chain().focus().setParagraph().run())}>正文</button>
            <button onClick={() => handleMenuAction(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>标题 1</button>
            <button onClick={() => handleMenuAction(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>标题 2</button>
            <button onClick={() => handleMenuAction(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>标题 3</button>
            <div className="tiptap-node-menu-divider" />
            <button onClick={() => handleMenuAction(() => editor.chain().focus().toggleBulletList().run())}>• 无序列表</button>
            <button onClick={() => handleMenuAction(() => editor.chain().focus().toggleOrderedList().run())}>1. 有序列表</button>
            <button onClick={() => handleMenuAction(() => editor.chain().focus().toggleTaskList().run())}>☑ 任务列表</button>
            <button onClick={() => handleMenuAction(() => editor.chain().focus().toggleBlockquote().run())}>❝ 引用</button>
            <button onClick={() => handleMenuAction(() => editor.chain().focus().toggleCodeBlock().run())}>{'{ }'} 代码块</button>
            <div className="tiptap-node-menu-divider" />
            <button
              className="tiptap-node-menu-danger"
              onClick={() => handleMenuAction(() => editor.chain().focus().deleteSelection().run())}
            >
              🗑 删除
            </button>
          </div>
        </>
      )}

      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
}
