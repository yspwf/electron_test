// src/renderer/components/Editor.tsx
import React, { useEffect, useRef } from 'react'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
}

const Editor = ({ value, onChange, onSave }:EditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Ctrl/Cmd + S 保存
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSave])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        outline: 'none',
        padding: '16px',
        fontSize: '14px',
        fontFamily: 'Menlo, Monaco, Consolas, monospace',
        lineHeight: 1.6,
        resize: 'none',
        background: '#fafafa',
      }}
      placeholder="在此输入 Markdown..."
    />
  )
}

export default Editor