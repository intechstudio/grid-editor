import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import preprocess from 'svelte-preprocess';
import path from 'path';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

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
    root: path.resolve(process.cwd(), 'src/renderer'),
    base: './',
    resolve: {
      alias: {
        '$lib': path.resolve('src/renderer/lib'),
      },
    },
   
});