// src/renderer/components/Preview.tsx
import React from 'react'

interface PreviewProps {
  html: string
}

const Preview: React.FC<PreviewProps> = ({ html }) => {
  return (
    <div
      className="markdown-preview"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        lineHeight: 1.7,
        color: '#24292f',
      }}
    />
  )
}

export default Preview