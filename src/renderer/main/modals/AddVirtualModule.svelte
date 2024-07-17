<script lang="ts">
  import BU16 from "./../grid-layout/grid-modules/devices/BU16.svelte";
  import PO16 from "./../grid-layout/grid-modules/devices/PO16.svelte";
  import PBF4 from "./../grid-layout/grid-modules/devices/PBF4.svelte";
  import EN16 from "./../grid-layout/grid-modules/devices/EN16.svelte";
  import EF44 from "./../grid-layout/grid-modules/devices/EF44.svelte";
  import TEK2 from "./../grid-layout/grid-modules/devices/TEK2.svelte";

  import { ModuleType } from "@intechstudio/grid-protocol";
  import { Analytics } from "./../../runtime/analytics.js";
  import { runtime } from "../../runtime/runtime.store";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import MoltenModal from "./MoltenModal.svelte";
  import { modal } from "./modal.store";
  import { get } from "svelte/store";

  const devices = [
    { id: ModuleType.BU16, component: BU16 },
    { id: ModuleType.EF44, component: EF44 },
    { id: ModuleType.EN16, component: EN16 },
    { id: ModuleType.PBF4, component: PBF4 },
    { id: ModuleType.PO16, component: PO16 },
    { id: ModuleType.TEK2, component: TEK2 },
  ];

  let [dx, dy]: number[] = [0, 0];

  $: {
    const args = $modal.args;
    dx = args?.dx ?? 0;
    dy = args?.dy ?? 0;
  }

  let selectedModule: number = -1;

  function handleAddClicked() {
    if (typeof runtime.getModule(dx, dy) !== "undefined") {
      runtime.destroy_module(dx, dy);
    }
    runtime.addVirtualModule({
      dx: dx,
      dy: dy,
      type: devices[selectedModule].id,
    });
    modal.close();
    Analytics.track({
      event: "VirtualModule",
      payload: {
        message: `Add virtual module: ${devices[selectedModule]}`,
      },
      mandatory: true,
    });
  }

  function handleCancelClicked(e) {
    modal.close();
  }

  function handleModuleClicked(index: number) {
    selectedModule = index;
  }

  function handleModuleDoubleClicked(index: number) {
    handleModuleClicked(index);
    handleAddClicked();
  }
</script>

<MoltenModal width={500}>
  <div slot="content">
    <div class="flex flex-col">
      <div class="flex w-full text-4xl opacity-90 pb-2">Add Virtual Module</div>
      <p>
        In virtual mode you can check out the features of Grid Editor. Add your
        chosen module as a preview, and get started!
      </p>
      <p>
        Browse profiles and presets in the Profile Cloud, or download them to
        your virtual module!
      </p>
      <div
        class="grid grid-cols-3 gap-5 px-10 py-5 bg-black bg-opacity-25 rounded w-full mt-4"
      >
        {#each devices as device, index}
          <div class="flex w-full h-full items-center justify-center">
            <div class="flex flex-col">
              <span class="text-white text-opacity-75 font-mono"
                >{device.id}</span
              >
              <button
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
                  <div
                    class="bg-black bg-opacity-25 w-fit h-fit rounded shadow-lg"
                  >
                    <svelte:component
                      this={device.component}
                      moduleWidth={225}
                    />
                  </div>
                </div>
              </button>
            </div>
          </div>
        {/each}
      </div>
      <div class="flex flex-row gap-2 pt-4 ml-auto">
        <MoltenPushButton
          text="Add Module"
          click={handleAddClicked}
          style={"accept"}
          disabled={selectedModule === -1}
        />
        {#if window.ctxProcess.buildVariables().BUILD_TARGET !== "web"}
          <MoltenPushButton text="Cancel" click={handleCancelClicked} />
        {/if}
      </div>
    </div>
  </div>
</MoltenModal>
