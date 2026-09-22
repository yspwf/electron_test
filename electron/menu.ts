import { Menu, app } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { BrowserWindow } from 'electron/main';

export const createMenu = (mainWindow: BrowserWindow) => {
    const menuTemplate: MenuItemConstructorOptions[] = [
        {
            label: '应用',
            submenu: [
            { label: '关于', accelerator: 'CmdOrCtrl+I', role: 'about' },
            // 这里可以自定义菜单项，如下可以与渲染进程通信
            { 
                label: '检测更新',
                click: () => { mainWindow.webContents.send('menuCheckUpdate') },
                accelerator: 'CommandOrControl+Shift+u', // 设置快捷键
                enabled: false //'这里设置是否可点击'
            },
            { type: 'separator' }, // 分割线
            { label: '隐藏', role: 'hide' },
            { label: '隐藏其他', role: 'hideOthers' },
            { type: 'separator' },
            { label: '服务', role: 'services' },
            { label: '退出', accelerator: 'Command+Q', click: () => {app.quit()} }
            ]
        },
        {
            label:"文件",
            submenu: [
                {
                    label: '新建',
                    accelerator: 'ctrl+n',
                    click: () => {console.log('新建文件')}
                },
                {
                    label: '打开',
                    accelerator: 'ctrl+o',
                    click: ()=>{console.log("打开文件")}
                },
                {type:"separator"},
                {
                    label:'保存',
                    accelerator:"ctrl+s",
                    click:()=>{console.log("保存文件")}
                },
                {
                    label:"退出",
                    accelerator:"ctrl+q",
                    role:"quit"
                }
            ]
        },
        {
            label:"编辑",
            submenu:[
                {
                    label:"撤销",   
                    role:"undo",
                    accelerator:"CmdOrCtrl+Z"
                },
                {
                    label:"重做",
                    role:"redo",
                    accelerator:"Shift+CmdOrCtrl+Z"
                },
                {
                    label:"剪切",
                    role:"cut",
                    accelerator:"CmdOrCtrl+X"    
                },
                {
                    label:"复制",
                    role:"copy",
                    accelerator:"CmdOrCtrl+C"
                },
                {
                    label:"粘贴",
                    role:"paste",
                    accelerator:"CmdOrCtrl+V"
                },
                {
                    label:"全选",
                    role:"selectAll",
                    accelerator:"CmdOrCtrl+A"
                }
            ]
        },
        // {
        //     label: '窗口',
        //     role: 'window',
        //     submenu: [{
        //         label: '放大',
        //         role: 'zoomOut'
        //     }, {
        //         label: '最小化',
        //         role: 'minimize'
        //     }, {
        //         label: '关闭',
        //         role: 'close'
        //     }]
        // },
        {
            label: '帮助',
            role: 'help',
            submenu: [{
                label: '开发者工具',
                role: 'toggleDevTools',
                accelerator: 'CommandOrControl+Shift+i'
            }]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

