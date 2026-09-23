import { writable, type Writable } from "svelte/store";
import type {
  ProfileCloudLoad,
  GridPage,
} from "../../../../runtime/runtime.js";
import type { SelectedProfileCloudConfig } from "../../../panels/profileCloud/ProfileCloud";

export namespace ProfileLoadOverlay {
  export interface ViewModel extends ProfileCloudLoad.Status {
    target: GridPage | undefined;
    config: SelectedProfileCloudConfig;
  }

  // step is initialized from a literal, not `ProfileCloudLoad.State.READY`, so this
  // module has no runtime dependency on runtime.ts - it's imported by ProfileCloud.ts,
  // which can load before runtime.ts finishes its own circular init with
  // runtime-manager.store.ts.
  export const viewModel: Writable<ViewModel> = writable({
    step: "ready" as ProfileCloudLoad.State,
    target: undefined,
    config: undefined,
  });
}
