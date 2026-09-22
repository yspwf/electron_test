// ✅ 第 1 步：删掉 ReactElement 的 import
import React, { useEffect, useState, useCallback } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Editor from './markdownEditer'
import Preview from './Preview'

marked.setOptions({
  breaks: true,
  gfm: true,
})

interface AppProps {
  tabId: string
  initialFilePath: string | null
}

// ✅ 第 2 步：不写返回类型，让 TS 推断
const MarkdownApp = ({ tabId, initialFilePath }: AppProps) => {
  const [markdown, setMarkdown] = useState('')
  const [filePath, setFilePath] = useState<string | null>(initialFilePath)
  const [html, setHtml] = useState('')

  useEffect(() => {
    if (initialFilePath) {
      window.electronAPI.readFile(initialFilePath).then((content) => {
        setMarkdown(content)
      })
    } else {
      setMarkdown('# 新建 Markdown 文档\n\n开始编辑...')
    }
  }, [initialFilePath])

  useEffect(() => {
    const rawHtml = marked.parse(markdown) as string
    const safeHtml = DOMPurify.sanitize(rawHtml)
    setHtml(safeHtml)
  }, [markdown])

  const handleSave = useCallback(async () => {
    if (!filePath) return
    await window.electronAPI.writeFile(filePath, markdown)
  }, [filePath, markdown])

  useEffect(() => {
    const fileName = filePath
      ? filePath.split(/[/\\]/).pop() || 'Untitled'
      : 'Untitled'
    window.electronAPI.setTitle(fileName)
  }, [filePath])

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
        <Editor value={markdown} onChange={setMarkdown} onSave={handleSave} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <Preview html={html} />
      </div>
    </div>
  )
}

export default MarkdownApp