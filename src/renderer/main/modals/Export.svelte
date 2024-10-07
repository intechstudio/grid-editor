<script lang="ts">
  import { get } from "svelte/store";
  import { user_input_event } from "./../panels/configuration/Configuration";
  import { modal } from "./modal.store";
  import MoltenModal from "./MoltenModal.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import MoltenPopup from "../panels/preferences/MoltenPopup.svelte";

  function handleCopy() {
    const _tempSpan = document.createElement("input");
    _tempSpan.value = get(user_input_event).toLua();

    _tempSpan.id = "temp-clip";
    document.getElementById("modal-copy-placeholder").append(_tempSpan);
    const _temp = document.querySelector("#temp-clip");
    _temp.select();
    document.execCommand("copy");
    document.getElementById("temp-clip").remove();
  }
</script>

<div id="modal-copy-placeholder" />

<MoltenModal>
  <div slot="content" class="flex flex-col gap-2 items-center">
    <div class="w-full flex justify-between items-center">
      <div class="text-gray-500 text-sm pb-1">Export Configurations</div>

      <button
        on:click={() => {
          modal.close();
        }}
        id="close-btn"
        class="p-1 cursor-pointer rounded not-draggable hover:bg-secondary"
      >
        <svg
          class="w-5 h-5 p-1 fill-current text-gray-300"
          viewBox="0 0 29 29"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z"
          />
          <path
            d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z"
          />
        </svg>
      </button>
    </div>

    <textarea
      value={$user_input_event.toLua()}
      class="bg-secondary min-h-200 font-mono w-full p-1 my-1 rounded"
    />

    <MoltenPushButton click={handleCopy} text="Copy" style="accept">
      <MoltenPopup slot="popup" text="Copied to clipboard!" />
    </MoltenPushButton>
  </div>
</MoltenModal>
