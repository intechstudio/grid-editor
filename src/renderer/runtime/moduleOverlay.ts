import { writable, Writable } from "svelte/store";

enum ModuleOverlayType {
  CONFIGURATION_LOAD = "configuration-load-overlay",
  CONTROL_NAME = "control-name-overlay",
}

function create_module_overlay_store() {
  const store: Writable<undefined | ModuleOverlayType> = writable(undefined);

  function show(type: ModuleOverlayType) {
    store.set(type);
  }

  function close() {
    store.set(undefined);
  }

  return {
    subscribe: store.subscribe,
    show: show,
    close: close,
  };
}

export const moduleOverlay = create_module_overlay_store();
