import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';

import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
// console.log("_dirname", _dirname);





const createAlias = (dirName:string) => path.resolve(_dirname, `src/${dirName}`);

export default defineConfig({
    plugins: [
        react({
            jsxRuntime: 'automatic',  // 使用新的 JSX 转换（React 17+），无需显式导入 React
            jsxImportSource: 'react',  // 启用快速刷新，修改组件时保持状态
        }),
        electron([{
            entry: path.resolve(_dirname, 'newElectron/main.ts'),
            onstart(options) {
                options.startup(['.', '--no-sandbox']).then(() => {
                    console.log('Electron app started successfully.');
                });
            },
            vite: {
                build: {
                    sourcemap: true,
                    outDir: 'dist-electron/main',
                    rollupOptions: { 
                        external: ['electron', 'path', 'fs', 'os', 'url', 'child_process']
                    }
                }
            }
        },{
            entry: path.resolve(_dirname, 'newElectron/preload.ts'),
            onstart(options) {
                // options.startup(['.', '--no-sandbox']).then(() => {
                //     console.log('Electron preload started successfully.');
                // });

                options.reload();
            },
            vite: {
                build: {   
                    sourcemap: true,
                    outDir: 'dist-electron/preload',
                    rollupOptions: {}
                }
            }
        }]),
        // electronRenderer({
        // })
    ],
    resolve: {
        alias: {
            // "@": fileURLToPath(new URL('./renderer', import.meta.url)),
            
            "@": createAlias(""),          // 项目根目录别名: src/
            // 使用示例: import App from '@/App'
      
            "@components": createAlias("components"), // 组件目录别名: src/components/
            // 使用示例: import Button from '@components/Button'
      
            "~img": createAlias("assets/images"), // 图片资源目录别名: src/assets/images/
            // 使用示例: import logo from '~img/logo.png'
      
            "#types": createAlias("/types"), // TypeScript 类型定义目录别名: src/types/
            // 使用示例: import type { User } from '#types'
        }
    },
    build: {
        minify: 'terser',
        cssMinify: 'esbuild',
        outDir: 'dist', 
        emptyOutDir: true,
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            output: {
                // manualChunks(id) { }
                manualChunks(id) {
                    // 'react-vendor': ['react', 'react-dom'],
                    // 'router-vendor': ['react-router-dom'],
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                        return 'react-vendor'
                    }

                    if (id.includes('node_modules/react-router-dom')) {
                        return 'router-vendor'
                    }
                },
            }
        },
        chunkSizeWarningLimit: 1000,
    }
})
