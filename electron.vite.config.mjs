import { defineConfig } from "electron-vite";
import { resolve } from "path";
import { rendererConfig } from "./renderer.vite.config.mjs";

export default defineConfig({
  main: {
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
          packageManager: resolve(
            __dirname,
            "src/electron/package/packageManager.ts",
          ),
        },
      },
      outDir: "dist/main",
      externalizeDeps: true,
    },
    envPrefix: "VITE_",
  },
  preload: {
    define: {
      "process.env": "process.env",
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/electron/preload.ts"),
          package: resolve(__dirname, "src/electron/preload_package.ts"),
        },
      },
      outDir: "dist/preload",
      externalizeDeps: true,
    },
  },
  renderer: {
    ...rendererConfig({ outDir: "dist/renderer" }),
  },
});
