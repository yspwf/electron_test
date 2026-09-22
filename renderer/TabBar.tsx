import React, { useEffect, useState } from 'react'

interface TabItem {
  id: string
  title: string
  active: boolean
}

const TabBar: React.FC = () => {
  const [tabs, setTabs] = useState<TabItem[]>([])

  useEffect(() => {
    window.electronAPI.onTabsUpdated((tabList) => {
      setTabs(tabList)
    })

    window.electronAPI.listTabs().then(setTabs)
  }, [])

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
          <span>{tab.title}</span>
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
