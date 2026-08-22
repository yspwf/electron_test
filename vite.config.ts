import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react({}),
    electron([
      {
        // Main 脚本
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist/electron',
            sourcemap: true,
            minify: false,
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        // Preload 脚本
        entry: 'electron/preload.ts',
        onstart(options) {
          // Notify the Renderer-Process to reload the page when Preload.js is build
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist/electron',
            sourcemap: true,
            minify: false,
            lib: {
              entry: 'electron/preload.ts',
              formats: ['cjs'],
              fileName: () => 'preload.js',
            },
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      }
    ]),
    renderer(),
  ],
  /* ========================== CSS 配置（规范） ========================== */
  css: {
    // 开启 CSS 模块化（组件内样式隔离，避免样式污染）
    modules: {
      // 模块化类名命名规则（规范，便于调试）
      generateScopedName: '[name]-[local]-[hash:8]',
      // 允许在 CSS 中使用 JS 变量（如 import './style.module.scss?module'）
      localsConvention: 'camelCaseOnly',
    },
    // CSS 预处理器配置（支持 SCSS/SASS，项目常用）
    // preprocessorOptions: {
    //   scss: {
    //     // 全局注入 SCSS 变量/混合器（无需在每个组件中导入）
    //     additionalData: `
    //       @import "@/assets/scss/variables.scss";
    //       @import "@/assets/scss/mixins.scss";
    //     `,
    //     // 解决 SCSS 导入路径问题
    //     includePaths: [resolve('src/assets/scss')],
    //   },
    // },
    // // CSS 后处理器配置（自动添加浏览器前缀，适配不同浏览器）
    // postcss: {
    //   plugins: [
    //     require('autoprefixer')({
    //       // 适配的浏览器范围（规范，覆盖 95% 以上用户）
    //       overrideBrowserslist: [
    //         'last 2 versions',
    //         '> 1%',
    //         'iOS >= 14',
    //         'Android >= 10',
    //       ],
    //     }),
    //   ],
    // },
    // 禁止 CSS 内联（生产环境将 CSS 单独打包，便于缓存）
    // devSourcemap: mode === 'development', // 开发环境开启 CSS SourceMap，便于调试
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './renderer'),
    },
  },
  server: {
    port: 3000,
  },
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        main: resolve(__dirname, 'renderer/main.tsx'),
      },
      output: {
        manualChunks(id){
           if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor'
          }
        }
      },
    },
  },
})
