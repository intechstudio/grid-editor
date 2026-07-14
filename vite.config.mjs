import { defineConfig } from "vite";
import { rendererConfig } from "./renderer.vite.config.mjs";
import copy from "rollup-plugin-copy";
import { resolve } from "path";

export default defineConfig({
  ...rendererConfig({
    outDir: "dist-web",
    additionalPlugins: [
      copy({
        targets: [
          {
            src: "configuration.json",
            dest: resolve(__dirname, "dist-web"),
          },
        ],
      }),
    ],
  }),
  test: {
    alias: {
      // Use Node.js entry for WASM loading in tests (avoids Vite-specific ?url import)
      "@wasm-fmt/lua_fmt": resolve(
        __dirname,
        "node_modules/@wasm-fmt/lua_fmt/lua_fmt_node.js",
      ),
    },
  },
});
