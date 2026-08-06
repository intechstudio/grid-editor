import "./app.css";
import App from "./App.svelte";
import { init_config_block_library } from "./lib/_configs";
import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { mount } from "svelte";
import { isMultiarchGroup } from "./main/firmware_update";

console.log(
  `Multiarch group: ${isMultiarchGroup() ? "YES" : "NO"} (url: ${window.location.href})`,
);

let app;

async function initApp() {
  try {
    // Initialize the Lua formatter WASM module
    await initLuaFormatter();
  } catch (err) {
    console.warn(
      "Lua formatter WASM initialization failed, formatting features will be unavailable:",
      err,
    );
  }

  // Initialize the config block registry (built-in blocks are eager, package component is lazy)
  await init_config_block_library();

  // Initialize the Svelte app after the configuration is ready
  app = mount(App, {
    target: document.body,
  });
}

// Call the function to initialize the app
initApp();

export default app;
