import React from 'react'
import { createRoot } from 'react-dom/client'
import TabBar from './TabBar'

const container = document.getElementById('root')

if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <TabBar />
    </React.StrictMode>
  )
}
