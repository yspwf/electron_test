import React from 'react';
import type { MenuPanelProps } from '../types';

const MenuPanel: React.FC<MenuPanelProps> = ({ items, active, onChange }) => {
  return (
    <nav className="menu-panel">
      {items.map((name) => (
        <div
          key={name}
          className={`menu-item ${active === name ? 'active' : ''}`}
          onClick={() => onChange(name)}
        >
          {name}
        </div>
      ))}
    </nav>
  );
};

export default MenuPanel;