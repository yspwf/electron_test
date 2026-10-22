import { app, BrowserWindow } from 'electron';
import path from 'path';
import {fileURLToPath} from 'url';
import { createMenu } from './menu';

const __filename = fileURLToPath(import.meta.url);

// app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');


const  createWindow = async () => {
  const { BrowserWindow } = await import('electron');
  const mainWindow = new BrowserWindow({ 
    width: 1400,
    height: 1000,
    minHeight: 400,
    minWidth: 600,
    title: 'Electron + React + TypeScript',
    icon: path.join(__filename, '../../public/favicon.ico'),
    webPreferences: {
        // nodeIntegration: false,
        // contextIsolation: true,
        // sandbox: false,
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false, // 禁用Node.js集成（安全）
        contextIsolation: true, // 启用上下文隔离（安全）
        webSecurity: true, // 启用web安全策略
        sandbox: false // 如果需要预加载脚本，设为false
  }});

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    app.quit();
  });

 
  mainWindow.loadFile(path.join(__dirname, './../../dist/index.html'));
 

  const isDev = process.env.NODE_ENV === 'development';
};


app.on('ready', () => {
    createMenu();
    createWindow();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    } 
});