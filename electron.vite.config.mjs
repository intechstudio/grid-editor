import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import preprocess from "svelte-preprocess";
import path, { resolve } from "path";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import { rendererConfig } from "./renderer.vite.config.mjs";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      "process.env": "process.env",
    },
    optimizeDeps: {
      include: ["esm-dep > cjs-dep"],
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/electron/main.ts"),
          pluginManager: resolve(
            __dirname,
            "src/electron/plugin/pluginManager.ts"
          ),
        },
      },
      outDir: "dist/main",
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    define: {
      "process.env": "process.env",
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/electron/preload.ts"),
        },
      },
      outDir: "dist/preload",
    },
  },
  renderer: {
    ...rendererConfig({ outDir: "dist/renderer" }),
  },
});
