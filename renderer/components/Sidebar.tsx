import React from 'react';
import type { SidebarProps, SidebarKey } from '../types';

const ICONS: Record<SidebarKey, React.JSX.Element> = {
  frame: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" />
      <path d="M12 2 L12 22 M3 7 L21 17 M21 7 L3 17" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </svg>
  ),
  hardware: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  ),
  effects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
    </svg>
  ),
  cross: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 6h6M14 6h6M4 12h16M4 18h6M14 18h6" />
    </svg>
  ),
  articles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 4h13l3 3v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  ),
};

const Sidebar: React.FC<SidebarProps> = ({ items, active, onChange }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg viewBox="0 0 48 48" fill="none" stroke="#3b82f6" strokeWidth="2">
          <path d="M24 4 L42 14 L42 34 L24 44 L6 34 L6 14 Z" />
          <path d="M24 14 L34 20 L34 30 L24 36 L14 30 L14 20 Z" />
          <circle cx="24" cy="25" r="4" />
        </svg>
      </div>
      {items.map((item) => (
        <div
          key={item.key}
          className={`sidebar-item ${active === item.key ? 'active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          <span className="icon">{ICONS[item.icon]}</span>
          <span className="label">{item.label}</span>
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;