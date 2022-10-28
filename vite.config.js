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
      target: 'chrome104' // this must follow version number of electron's bundled chromium
    },
    root: path.resolve(process.cwd(), 'src/renderer'),
    base: './',
    resolve: {
      alias: {
        '$lib': path.resolve('src/renderer/lib'),
      },
    },
   
});