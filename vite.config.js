import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import preprocess from 'svelte-preprocess';
import path from 'path';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import copy from 'rollup-plugin-copy';

export default defineConfig({
    optimizeDeps: {
      include: ['esm-dep > cjs-dep']
    },
    plugins: [
      svelte({
        preprocess: [
          preprocess({
            postcss: true,
          }),
        ],
      }),
      monacoEditorPlugin([])
    ], 
    build: {
      outDir: ('../../dist-svelte'),
      rollupOptions: {
        plugins: [
          copy({
            targets:[
              { src: 'src/renderer/config-blocks/*', dest: 'dist-svelte/config-blocks'},
              { src: 'src/renderer/assets/fonts/*', dest: 'dist-svelte/assets/fonts'}
            ],
            copyOnce: true,
            hook: "writeBundle"
          })
        ]
      }
    },
    
    root: path.resolve(process.cwd(), 'src/renderer'),
    base: './',
    resolve: {
      alias: {
        '$lib': path.resolve('src/renderer/lib'),
      },
    },
   
});