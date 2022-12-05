import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import preprocess from 'svelte-preprocess';
import path, { resolve } from 'path';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({    

  main: {
    plugins: [
      externalizeDepsPlugin()
    ],
    define: {
      'process.env': 'process.env'
    },
    optimizeDeps: {
      include: ['esm-dep > cjs-dep']
    },
    build:{
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/electron/main.ts'),
        }
      }, 
      outDir: 'dist/main',
    }
  },
  preload: {
    plugins: [
      externalizeDepsPlugin()
    ],
    define: {
      'process.env': 'process.env'
    },
    build:{
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/electron/preload.ts'),
        }
      },
      outDir: 'dist/preload',
    },
  },
  renderer: {
    plugins: [
      svelte({
        preprocess: [
          preprocess({
            postcss: true,
          })
        ]
      }), 
      monacoEditorPlugin([])
    ],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
        }
      },
      outDir: '../../dist/renderer',
    },
    resolve: {
      alias: {
        '$lib': path.resolve('src/renderer/lib'),
      },
    },
    target: 'chrome104'
  }   
});