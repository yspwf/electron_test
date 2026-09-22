export type SidebarKey =
  | 'frame'
  | 'system'
  | 'hardware'
  | 'effects'
  | 'cross'
  | 'articles';

export interface SidebarItem {
  key: SidebarKey;
  label: string;
  icon: SidebarKey;
}

export type MenuMap = Record<SidebarKey, string[]>;

export interface SidebarProps {
  items: SidebarItem[];
  active: SidebarKey;
  onChange: (key: SidebarKey) => void;
}

export interface MenuPanelProps {
  items: string[];
  active: string;
  onChange: (name: string) => void;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  folder: string;
  filePath?: string;
}