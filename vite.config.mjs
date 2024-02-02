import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import preprocess from "svelte-preprocess";
import path, { resolve } from "path";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import { rendererConfig } from "./renderer.vite.config.mjs";

export default defineConfig({
  ...rendererConfig({ outDir: "dist-web" }),
});
