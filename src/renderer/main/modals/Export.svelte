<script lang="ts">
  import { run } from 'svelte/legacy';

  import { GridEvent } from "./../../runtime/runtime";
  import { get } from "svelte/store";
  import { Modal } from "./modal.store";
  import MoltenModal from "./MoltenModal.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import MoltenPopup from "../panels/preferences/MoltenPopup.svelte";
  import { user_input, UserInputValue } from "./../../runtime/user-input.store";
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import MoltenIconButton from "../user-interface/MoltenIconButton.svelte";

  interface Props {
    data: Modal.Instance;
  }

  let { data }: Props = $props();

  let event: GridEvent = $state();


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
  run(() => {
    handleUserInputChange($user_input);
  });
</script>

<div id="modal-copy-placeholder"></div>

<MoltenModal {data}>
  {#snippet content()}
    <div  class="flex flex-col gap-2 items-center">
      <div class="w-full flex justify-between items-center">
        <div class="text-foreground-muted text-sm pb-1">
          Export Configurations
        </div>

        <div id="close-btn">
          <MoltenIconButton
            iconPath="close"
            on:click={() => {
              data.close();
            }}
          />
        </div>
      </div>

      <textarea
        value={$event.toLua()}
        class="min-h-200 font-mono w-full p-1 my-1 rounded bg-background-muted"
></textarea>

      <MoltenPushButton click={handleCopy} text="Copy" style="accept">
        {#snippet popup()}
            <MoltenPopup  text="Copied to clipboard!" />
          {/snippet}
      </MoltenPushButton>
    </div>
  {/snippet}
</MoltenModal>
