import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltePreprocess } from "svelte-preprocess";
import monacoEditorEsmPlugin from "vite-plugin-monaco-editor-esm";
import path, { resolve } from "path";

export const rendererConfig = ({ outDir = "", additionalPlugins = [] }) => {
  return {
    plugins: [
      svelte({
        // compilerOptions: {
        //   compatibility: {
        //     componentApi: 4
        //   }
        // },
        preprocess: [sveltePreprocess({ postcss: true })],
      }),
      monacoEditorEsmPlugin({
        languageWorkers: [],
        customWorkers: [],
        languages: ["lua"],
      }),
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
        "$app/environment": path.resolve(
          "src/renderer/lib/app-environment-shim.ts",
        ),
      },
    },
    target: "chrome104",
    envPrefix: "VITE_",
    optimizeDeps: {
      exclude: ["@intechstudio/grid-protocol"],
      esbuildOptions: {
        plugins: [
          {
            name: "resolve-app-environment",
            setup(build) {
              build.onResolve({ filter: /^\$app\/environment$/ }, () => ({
                path: path.resolve("src/renderer/lib/app-environment-shim.ts"),
              }));
            },
          },
        ],
      },
    },
  };
};
