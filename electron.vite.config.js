import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import preprocess from "svelte-preprocess";
import path, { resolve } from "path";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

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
          pluginManager: resolve(__dirname, 'src/electron/plugin/pluginManager.ts')
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
    plugins: [
      svelte({
        preprocess: [
          preprocess({
            postcss: true,
          }),
        ],
      }),
      monacoEditorPlugin([]),
    ],
    publicDir: "assets", // needed, to copy assets to dist during build
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
      },
      outDir: "../../dist/renderer", // this path is fixed in future electron-vite versions! keep it as is for now at electron-vite v1.0.17!
    },
    resolve: {
      alias: {
        $lib: path.resolve("src/renderer/lib"),
      },
    },
    target: "chrome104",
  },
});
