import { get, writable, type Writable } from "svelte/store";
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
import { moduleOverlay, ModuleOverlay } from "../../../runtime/moduleOverlay";
import { runtime_manager } from "../../../runtime/runtime-manager.store";
import { type ProfileLoadOverlay } from "../../grid-layout/grid-modules/overlays/ProfileLoadOverlay.svelte";

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
          switch (config.configType) {
            case "profile": {
              moduleOverlay.show(ModuleOverlay.Types.PROFILE_DRAG);
              break;
            }
            case "preset": {
              moduleOverlay.show(ModuleOverlay.Types.PRESET_DRAG);
              break;
            }
          }
          profileCloudConfigDrag.set(config);
          break;
        }
        case "end": {
          profileCloudConfigDrag.set(undefined);
          if (target) {
            selectedConfigStore.set(config);
            switch (config.configType) {
              case "profile": {
                const page = active
                  .findModule(target.dx, target.dy)
                  .findPage(target.page);

                const profile = GridProfileData.createFromCloudData(config);
                moduleOverlay.show(ModuleOverlay.Types.PROFILE_LOAD);
                loadProfile(profile, page, (e) => {
                  const model = ProfileLoadOverlay.viewModel;
                  model.update((s) => ({ ...s, ...e }));
                });
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
                console.log(
                  "[ProfileCloud] snippet lua:",
                  snippet.actions.map((a) => a.toLua()).join(""),
                );
                loadSnippet(snippet, event, target.index).catch();

                break;
              }
            }
          } else {
            moduleOverlay.close();
          }
        }
      }
    } catch (e) {}
  }
}

export namespace ProfileCloudTypes {
  export type EventData = any;
  export type ProfileData = any;
  export type PresetData = any;
  export type SnippetData = any;
}

export type SelectedProfileCloudConfig =
  | ProfileCloudTypes.ProfileData
  | ProfileCloudTypes.PresetData
  | ProfileCloudTypes.SnippetData
  | undefined;

export const selectedConfigStore: Writable<SelectedProfileCloudConfig> =
  writable();
