import { writable, Writable } from "svelte/store";

export namespace ModuleOverlay {
  export enum Types {
    CONTROL_NAME = "control-name-overlay",
    PROFILE_LOAD = "profile-load-overlay",
    PRESET_LOAD = "preset-load-overlay",
    PROFILE_DRAG = "profile-drag-overlay",
    PRESET_DRAG = "preset-drag-overlay",
  }
}

function create_module_overlay_store() {
  const store: Writable<undefined | ModuleOverlay.Types> = writable(undefined);

  function show(type: ModuleOverlay.Types) {
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
