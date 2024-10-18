import App from "./App.svelte";
import { init_config_block_library } from "./lib/_configs";

let app;

async function initApp() {
  try {
    // Wait for the configuration to load before initializing the app
    await init_config_block_library();

    // Initialize the Svelte app after the configuration is ready
    app = new App({
      target: document.body,
    });
  } catch (err) {}
}

// Call the function to initialize the app
initApp();

export default app;
