import { Menu } from "electron";

export const createMenu = () => {
  const template: Electron.MenuItemConstructorOptions[] = [];

  const menu = Menu.buildFromTemplate(template);    
  Menu.setApplicationMenu(menu);
}