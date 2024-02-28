import { svelte } from "@sveltejs/vite-plugin-svelte";
import preprocess from "svelte-preprocess";
import path, { resolve } from "path";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import copy from "rollup-plugin-copy";

export const rendererConfig = ({ outDir = "", additionalPlugins }) => {
  return {
    plugins: [
      svelte({
        preprocess: [
          preprocess({
            postcss: true,
          }),
        ],
      }),
      monacoEditorPlugin,
      ...additionalPlugins,
    ],
    publicDir: "assets", // needed, to copy assets to dist during build
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
      },
      outDir: resolve(__dirname, outDir), // this path is fixed in future electron-vite versions! keep it as is for now at electron-vite v1.0.17!
    },
    root: resolve(__dirname, "src/renderer"),
    resolve: {
      alias: {
        $lib: path.resolve("src/renderer/lib"),
      },
    },
    target: "chrome104",
  };
};
