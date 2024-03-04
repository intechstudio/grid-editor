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
          {
            src: "buildVariables.json",
            dest: resolve(__dirname, "dist-web"),
          },
        ],
      }),
    ],
  }),
});
