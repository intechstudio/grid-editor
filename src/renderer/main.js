import "./app.css";
import App from "./App.svelte";
import { init_config_block_library } from "./lib/_configs";
import { mount } from "svelte";

let app;

async function initApp() {
  try {
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
