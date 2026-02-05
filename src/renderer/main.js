import "./app.css";
import App from "./App.svelte";
import { init_config_block_library } from "./lib/_configs";
import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { mount } from "svelte";

let app;

async function initApp() {
  try {
    // Initialize the Lua formatter WASM module
    await initLuaFormatter();

    // Wait for the configuration to load before initializing the app
    await init_config_block_library();

    // Initialize the Svelte app after the configuration is ready
    app = mount(App, {
      target: document.body,
    });
  } catch (err) {}
}

// Call the function to initialize the app
initApp();

export default app;
