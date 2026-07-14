import { writable, type Writable } from "svelte/store";
import { Analytics } from "./analytics";

export namespace ModuleOverlay {
  export enum Types {
    CONTROL_NAME = "control-name-overlay",
    CALIBRATION = "calibration-overlay",
    PROFILE_LOAD = "profile-load-overlay",
    PRESET_LOAD = "preset-load-overlay",
    PROFILE_DRAG = "profile-drag-overlay",
    PRESET_DRAG = "preset-drag-overlay",
    PROFILE_LOAD_PROGRESS = "profile-load-progress-overlay",
  }
}

function create_module_overlay_store() {
  const store: Writable<undefined | ModuleOverlay.Types> = writable(undefined);

  function show(type: ModuleOverlay.Types) {
    // Track all overlay opens
    Analytics.track({
      event: "Overlay Opened",
      payload: {
        overlayType: type,
      },
      mandatory: false,
    });

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
