// import { useEditor, EditorContent } from '@tiptap/react'
// import StarterKit from '@tiptap/starter-kit'

// function Tiptap() {
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//     ],
//     content: '<p>Hello World! 🌍</p>',
//   })

//   return <EditorContent editor={editor} />
// }

// export { Tiptap }

// src/components/TiptapEditor.jsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';

const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '在这里输入内容...',
      }),
    ],
    content: `
      <h2>欢迎来到 Tiptap 深度教程</h2>
      <p>这是你的第一个 Tiptap 编辑器。你可以直接在这里 <strong>编辑</strong> 文字。</p>
      <p>试试以下功能：</p>
      <ul>
        <li>选中文字按 <strong>Ctrl+B</strong> 加粗</li>
        <li>按 <strong>Ctrl+I</strong> 斜体</li>
        <li>输入 <code># </code> 创建标题</li>
        <li>输入 <code>- </code> 创建列表</li>
      </ul>
       <h2>欢迎使用 Tiptap!</h2>
        <p>这是一个功能丰富的富文本编辑器，基于 Vue.js 和 ProseMirror 构建。</p>
        <p>尝试使用上面的菜单来格式化文本，或者输入 <code>/</code> 来查看斜杠命令。</p>
    `,
    // 编辑器配置选项
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    // 当内容变化时的回调
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('内容已更新:', html);
    },
  });

  return (
    <div className="tiptap-editor">
      <EditorContent editor={editor} />

      {/* <button onClick={() => editor?.chain().focus().toggleBold().run()}>
        加粗
      </button> */}

      <button
        onClick={() => editor?.chain().focus().undo().run()}
        disabled={!editor?.can().undo()}
      >
        撤销
      </button>
      <button
        onClick={() => editor?.chain().focus().redo().run()}
        disabled={!editor?.can().redo()}
      >
        重做
      </button>

      <button
        onClick={() => editor?.chain().focus().setParagraph().run()}
        className={editor?.isActive('paragraph') ? 'is-active' : ''}
      >
        段落
      </button>
      <button
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor?.isActive('heading', { level: 1 }) ? 'is-active' : ''}
      >
        H1
      </button>

        <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        >
            H2
        </button>
        <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor?.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        >
            H3
        </button>
        <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'is-active' : ''}
        >
            粗体
        </button>
        <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'is-active' : ''}
        >
            斜体
        </button>
        <button
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={editor?.isActive('strike') ? 'is-active' : ''}
        >
            删除线
        </button>
        <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={editor?.isActive('bulletList') ? 'is-active' : ''}
        >
            无序列表
        </button>
        <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={editor?.isActive('orderedList') ? 'is-active' : ''}
        >
            有序列表
        </button>
        <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={editor?.isActive('blockquote') ? 'is-active' : ''}
        >
            引用
        </button>
        <button
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
            水平线
        </button>
        <button
            onClick={() => editor?.chain().focus().setHardBreak().run()}
        >
            换行
        </button>
        <button
            onClick={() => editor?.chain().focus().unsetAllMarks().run()}
        >
            清除格式
        </button> 
    </div>
  );
};

export { Tiptap };
