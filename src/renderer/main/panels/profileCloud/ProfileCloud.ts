import { get, writable, Writable } from "svelte/store";
import { runtime } from "../../../runtime/runtime.store";
import { loadPreset, loadProfile } from "../../../runtime/operations";
import { GridPresetData, GridProfileData } from "../../../runtime/runtime";
import {
  moduleOverlay,
  ModuleOverlayType,
} from "../../../runtime/moduleOverlay";

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
    const { drag, config, target } = event.data;

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
              const page = runtime
                .findModule(target.dx, target.dy)
                .findPage(target.page);

              const profile = GridProfileData.createFromCloudData(config);
              loadProfile(profile, page);
              break;
            }
            case "preset": {
              const element = runtime
                .findModule(target.dx, target.dy)
                .findPage(target.page)
                .findElement(target.element);

              const preset = GridPresetData.createFromCloudData(config);
              loadPreset(preset, element);
              break;
            }
          }
          break;
        }
      }
    }
  }

  static async handleShowOverlay(event: any) {
    moduleOverlay.show(ModuleOverlayType.CONFIGURATION_LOAD);
  }
}
