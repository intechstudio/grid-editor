<script lang="ts">
  import { GridEvent } from "./../../runtime/runtime";
  import { get } from "svelte/store";
  import { Modal } from "./modal.store";
  import MoltenModal from "./MoltenModal.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import MoltenPopup from "../panels/preferences/MoltenPopup.svelte";
  import {
    user_input,
    type UserInputValue,
  } from "./../../runtime/user-input.store";
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import MoltenIconButton from "../user-interface/MoltenIconButton.svelte";
  import { GridScript } from "@intechstudio/grid-protocol";

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

  $: rawCode = $event?.toLua() ?? "";
  $: humanReadable = GridScript.expandScript(rawCode);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
</script>

<MoltenModal {data} width="700px">
  <div slot="content" class="flex flex-col gap-2 items-center p-6">
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

    <div class="w-full flex flex-row gap-3">
      <div class="flex-1 flex flex-col gap-1">
        <div class="text-foreground-muted text-xs">Raw code</div>
        <textarea
          value={rawCode}
          readonly
          rows="18"
          class="font-mono w-full p-1 rounded bg-background-muted whitespace-pre-wrap resize"
        ></textarea>
        <div class="flex justify-end">
          <MoltenPushButton
            click={() => copyToClipboard(rawCode)}
            text="Copy"
            style="accept"
          >
            <MoltenPopup slot="popup" text="Copied to clipboard!" />
          </MoltenPushButton>
        </div>
      </div>

      <div class="flex-1 flex flex-col gap-1">
        <div class="text-foreground-muted text-xs">Human readable</div>
        <textarea
          value={humanReadable}
          readonly
          rows="18"
          class="font-mono w-full p-1 rounded bg-background-muted whitespace-pre-wrap resize"
        ></textarea>
        <div class="flex justify-end">
          <MoltenPushButton
            click={() => copyToClipboard(humanReadable)}
            text="Copy"
            style="accept"
          >
            <MoltenPopup slot="popup" text="Copied to clipboard!" />
          </MoltenPushButton>
        </div>
      </div>
    </div>
  </div>
</MoltenModal>
