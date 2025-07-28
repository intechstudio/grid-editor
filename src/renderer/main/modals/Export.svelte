<script lang="ts">
  import { GridEvent } from "./../../runtime/runtime";
  import { get } from "svelte/store";
  import { Modal } from "./modal.store";
  import MoltenModal from "./MoltenModal.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import MoltenPopup from "../panels/preferences/MoltenPopup.svelte";
  import { user_input, UserInputValue } from "./../../runtime/user-input.store";
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import MoltenIconButton from "../user-interface/MoltenIconButton.svelte";

  export let data: Modal.Instance;

  let event: GridEvent;

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui: UserInputValue) {
    const active = get(runtime_manager).active.runtime;
    event = active.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype,
    );
  }

  function handleCopy() {
    const _tempSpan = document.createElement("input");
    _tempSpan.value = get(event).toLua();

    _tempSpan.id = "temp-clip";
    document.getElementById("modal-copy-placeholder").append(_tempSpan);
    const _temp = document.querySelector("#temp-clip");
    _temp.select();
    document.execCommand("copy");
    document.getElementById("temp-clip").remove();
  }
</script>

<div id="modal-copy-placeholder" />

<MoltenModal {data}>
  <div slot="content" class="flex flex-col gap-2 items-center">
    <div class="w-full flex justify-between items-center">
      <div class="text-gray-500 text-sm pb-1">Export Configurations</div>

      <MoltenIconButton
        on:click={() => {
          data.close();
        }}
      />
    </div>

    <textarea
      value={$event.toLua()}
      class="bg-secondary min-h-200 font-mono w-full p-1 my-1 rounded"
    />

    <MoltenPushButton click={handleCopy} text="Copy" style="accept">
      <MoltenPopup slot="popup" text="Copied to clipboard!" />
    </MoltenPushButton>
  </div>
</MoltenModal>
