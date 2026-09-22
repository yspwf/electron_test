import React, { useEffect, useRef, useState } from 'react'

interface TabItem {
  id: string
  title: string
  active: boolean
}

const TabBar: React.FC = () => {
  const [tabs, setTabs] = useState<TabItem[]>([])
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const skipNextCommitRef = useRef(false)

  useEffect(() => {
    window.electronAPI.onTabsUpdated((tabList) => {
      setTabs(tabList)
    })

    window.electronAPI.listTabs().then(setTabs)
  }, [])

  useEffect(() => {
    const activeTab = tabs.find((tab) => tab.active)
    document.title = activeTab ? `${activeTab.title} - Tab Bar` : 'Tab Bar'
  }, [tabs])

  const startEditing = (tab: TabItem) => {
    skipNextCommitRef.current = false
    setEditingTabId(tab.id)
    setDraftTitle(tab.title)
  }

  const cancelEditing = () => {
    skipNextCommitRef.current = true
    setEditingTabId(null)
    setDraftTitle('')
  }

  const commitEditing = async () => {
    if (!editingTabId) return
    if (skipNextCommitRef.current) {
      skipNextCommitRef.current = false
      return
    }

    await window.electronAPI.renameTab(editingTabId, draftTitle)
    setEditingTabId(null)
    setDraftTitle('')
  }

  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 8px', background: '#f0f0f0' }}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => window.electronAPI.switchTab(tab.id)}
          style={{
            padding: '4px 12px',
            background: tab.active ? '#fff' : '#e0e0e0',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {editingTabId === tab.id ? (
            <input
              autoFocus
              value={draftTitle}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={() => {
                void commitEditing()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }

                if (e.key === 'Escape') {
                  cancelEditing()
                }
              }}
              style={{
                width: 96,
                border: '1px solid #999',
                borderRadius: 2,
                padding: '2px 4px',
                font: 'inherit',
              }}
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation()
                startEditing(tab)
              }}
            >
              {tab.title}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.electronAPI.closeTab(tab.id)
            }}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            x
          </button>
        </div>
      ))}
      <button onClick={() => window.electronAPI.createTab()}>+</button>
    </div>
  )
}

export default TabBar
