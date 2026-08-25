<script lang="ts">
  import XX16 from "../grid-layout/grid-modules/devices/XX16.svelte";
  import PBF4 from "./../grid-layout/grid-modules/devices/PBF4.svelte";
  import EF44 from "./../grid-layout/grid-modules/devices/EF44.svelte";
  import VSNX from "./../grid-layout/grid-modules/devices/VSNX.svelte";
  import OCTV from "./../grid-layout/grid-modules/devices/OCTV.svelte";
  import ZONA from "./../grid-layout/grid-modules/devices/ZONA.svelte";

  import { ModuleType } from "@intechstudio/grid-protocol";
  import { Analytics } from "./../../runtime/analytics.js";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import MoltenModal from "./MoltenModal.svelte";
  import { Modal } from "./modal.store";

  import { appSettings } from "../../runtime/app-helper.store";
  import { get } from "svelte/store";
  import { runtime_manager } from "../../runtime/runtime-manager.store";

  let devices = [
    {
      id: ModuleType.BU16,
      type: ModuleType.BU16,
      component: XX16,
      hwcfg: 131,
    },
    {
      id: ModuleType.EF44,
      type: ModuleType.EF44,
      component: EF44,
      hwcfg: 35,
    },
    {
      id: ModuleType.EN16,
      type: ModuleType.EN16,
      component: XX16,
      hwcfg: 195,
    },
    {
      id: ModuleType.PBF4,
      type: ModuleType.PBF4,
      component: PBF4,
      hwcfg: 67,
    },
    {
      id: ModuleType.PO16,
      type: ModuleType.PO16,
      component: XX16,
      hwcfg: 3,
    },
    {
      id: ModuleType.TEK2,
      type: ModuleType.TEK2,
      component: VSNX,
      hwcfg: 27,
    },
    {
      id: ModuleType.VSN1L,
      type: ModuleType.VSN1L,
      component: VSNX,
      hwcfg: 59,
    },
    {
      id: ModuleType.VSN1R,
      type: ModuleType.VSN1R,
      component: VSNX,
      hwcfg: 91,
    },
    {
      id: ModuleType.VSN2,
      type: ModuleType.VSN2,
      component: VSNX,
      hwcfg: 123,
    },
    {
      id: ModuleType.OCTV,
      type: ModuleType.OCTV,
      component: OCTV,
      unrelease: true,
      hwcfg: 123,
    },
    {
      id: ModuleType.ZONA,
      type: ModuleType.ZONA,
      component: ZONA,
      unrelease: true,
      hwcfg: 161,
    },
  ];

  export let dx = 0;
  export let dy = 0;
  export let data: Modal.Instance;

  let selectedModule: number = -1;

  function handleAddClicked() {
    const active = get(runtime_manager).active.runtime;
    if (typeof active.findModule(dx, dy) !== "undefined") {
      active.destroy_module(dx, dy);
    }

    active.addVirtualModule({
      dx: dx,
      dy: dy,
      type: devices[selectedModule].id,
    });
    data.close();
    Analytics.track({
      event: "VirtualModule",
      payload: {
        message: `Add virtual module: ${devices[selectedModule]}`,
      },
      mandatory: true,
    });
  }

  function handleCancelClicked(e) {
    data.close();
  }

  function handleModuleClicked(index: number) {
    selectedModule = index;
  }

  function handleModuleDoubleClicked(index: number) {
    handleModuleClicked(index);
    handleAddClicked();
  }
</script>

<MoltenModal {data} width={"500px"}>
  <div
    slot="content"
    class="grid grid-rows-[auto_1fr_auto] max-h-[50vh] h-full p-6"
  >
    <div>
      <div class="flex w-full text-4xl opacity-90 pb-2">Add Virtual Module</div>
      <p>
        In virtual mode you can check out the features of Grid Editor. Add your
        chosen module as a preview, and get started!
      </p>
      <p>
        Browse profiles and presets in the Profile Cloud, or download them to
        your virtual module!
      </p>
    </div>
    <div class="overflow-y-scroll mt-4">
      <div
        class="grid grid-cols-3 gap-5 px-10 py-5 bg-black bg-opacity-25 rounded w-full
          "
      >
        {#each devices as device, index}
          {#if device.unrelease !== true || $appSettings.persistent.unreleasedVirtualModules}
            <div class="flex w-full h-full items-center justify-center">
              <div class="flex flex-col">
                <span class="font-mono">{device.id}</span>
                <button
                  data-testid={device.id}
                  class="border"
                  class:border-transparent={index !== selectedModule}
                  class:hover:border-emerald-600={index !== selectedModule}
                  class:border-emerald-300={index === selectedModule}
                  on:click={() => handleModuleClicked(index)}
                  on:dblclick={() => handleModuleDoubleClicked(index)}
                >
                  <div
                    style="
                      transform-origin: top left;
                      width: calc(113px);
                      height: calc(113px);
                      transform: scale(0.5); 
                    "
                  >
                    <div class="w-fit h-fit rounded shadow-lg">
                      <svelte:component
                        this={device.component}
                        {device}
                        moduleWidth={225}
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
    <div class="flex flex-row gap-2 pt-4 ml-auto">
      <MoltenPushButton
        text="Add Module"
        click={handleAddClicked}
        style={"accept"}
        disabled={selectedModule === -1}
      />
      {#if import.meta.env.VITE_BUILD_TARGET !== "web"}
        <MoltenPushButton text="Cancel" click={handleCancelClicked} />
      {/if}
    </div>
  </div>
</MoltenModal>
