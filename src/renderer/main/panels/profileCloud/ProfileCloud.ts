import { get, writable, Writable } from "svelte/store";
import {
  loadPreset,
  loadProfile,
  loadSnippet,
} from "../../../runtime/operations";
import {
  GridPresetData,
  GridProfileData,
  GridSnippetData,
} from "../../../runtime/runtime";
import {
  moduleOverlay,
  ModuleOverlayType,
} from "../../../runtime/moduleOverlay";
import { runtime_manager } from "../../../runtime/runtime-manager.store";

export const profileCloudConfigDrag: Writable<any> = writable(undefined);

export class ProfileCloud {
  public target: Window & typeof globalThis;

  constructor(target: Window & typeof globalThis) {
    this.target = target;
  }

  public sendMessage(message: any) {
    if (!this.target?.postMessage) return;

    this.target.postMessage(message, "*");
  }
}

export const profile_cloud = new ProfileCloud(window);

export class ProfileCloudEvent {
  static async handleConfigDragChange(event: any) {
    const active = get(runtime_manager).active.runtime;
    const { drag, config, target } = event.data;

    try {
      switch (drag) {
        case "start": {
          profileCloudConfigDrag.set(config);
          break;
        }
        case "end": {
          profileCloudConfigDrag.set(undefined);
          if (target) {
            switch (config.configType) {
              case "profile": {
                const page = active
                  .findModule(target.dx, target.dy)
                  .findPage(target.page);

                const profile = GridProfileData.createFromCloudData(config);
                loadProfile(profile, page);
                break;
              }
              case "preset": {
                const element = active
                  .findModule(target.dx, target.dy)
                  .findPage(target.page)
                  .findElement(target.element);

                const preset = GridPresetData.createFromCloudData(config);
                loadPreset(preset, element);
                break;
              }
              case "snippet": {
                const event = active
                  .findModule(target.module.dx, target.module.dy)
                  .findPage(target.page)
                  .findElement(target.element.index)
                  .findEvent(target.event.value);

                const snippet = GridSnippetData.createFromCloudData(config);
                loadSnippet(snippet, event, target.index).catch();

                break;
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  static async handleShowOverlay(event: any) {
    const { value } = event.data;
    if (value) {
      moduleOverlay.show(ModuleOverlayType.CONFIGURATION_LOAD);
    } else {
      moduleOverlay.close();
    }
  }
}
