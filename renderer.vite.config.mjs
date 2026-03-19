import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltePreprocess } from "svelte-preprocess";
import path, { resolve } from "path";
import { realpathSync } from "fs";

export const rendererConfig = ({ outDir = "", additionalPlugins = [] }) => {
  // Resolve symlinked packages (e.g. npm link) so Vite can serve their files
  let gridProtocolRealPath;
  try {
    gridProtocolRealPath = realpathSync(
      resolve(__dirname, "node_modules/@intechstudio/grid-protocol"),
    );
  } catch {
    // Package not linked, no extra fs.allow needed
  }

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
      preserveSymlinks: false,
      dedupe: ["@intechstudio/grid-protocol"],
      alias: {
        // Redirect @wasm-fmt/lua_fmt to the Vite-compatible entry that uses ?url for WASM
        "@wasm-fmt/lua_fmt": "@wasm-fmt/lua_fmt/vite",
        $lib: path.resolve("src/renderer/lib"),
        "$app/environment": path.resolve(
          "src/renderer/lib/app-environment-shim.ts",
        ),
      },
    },
    server: {
      port: 5273,
      fs: {
        allow: [
          // Allow serving files from the project root
          resolve(__dirname),
          // Allow serving files from symlinked packages (npm link)
          ...(gridProtocolRealPath ? [gridProtocolRealPath] : []),
        ],
      },
    },
    target: "chrome104",
    envPrefix: "VITE_",
    optimizeDeps: {
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
