import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import MarkdownApp from './markdown'

interface TabInitData {
  id: string
  filePath: string | null
}

const getInitialTab = (): TabInitData | null => {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')

  if (!id) return null

  return {
    id,
    filePath: params.get('file'),
  }
}

const Root: React.FC = () => {
  const [tab, setTab] = useState<TabInitData | null>(getInitialTab)

  useEffect(() => {
    window.electronAPI.onInit((data) => {
      setTab(data)
    })
  }, [])

  if (!tab) return null

  return <MarkdownApp tabId={tab.id} initialFilePath={tab.filePath} />
}

const container = document.getElementById('root')

if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  )
}
