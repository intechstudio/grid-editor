<script>
  import ActionPicker from "./ActionPicker.svelte";
  import { createEventDispatcher } from "svelte";

  import { fade } from "svelte/transition";

  import { configManager } from "../Configuration.store";
  import { runtime } from "../../../../runtime/runtime.store";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  export let index = undefined;
  let showActionPicker = false;
  let referenceElement = undefined;

  const dispatch = createEventDispatcher();

  function handleNewConfig(e) {
    dispatch("new-config", e.detail);
  }

  function handleShowActionPicker(e) {
    showActionPicker = true;
  }

  function handleCloseActionPicker(e) {
    showActionPicker = false;
  }

  function handlePaste(e) {
    dispatch("paste", e.detail);
  }
</script>

<container
  class="{$$props.class} relative"
  bind:this={referenceElement}
  on:new-config={handleNewConfig}
  on:paste={handlePaste}
>
  {#if $configManager.length === 0 && $runtime.length > 0}
    <div
      class="text-white/50 my-5 bg-secondary flex flex-col py-6 px-12 gap-4"
      in:fade={{ delay: 200 }}
    >
      <span> There are no actions configured on this event! </span>
      <MoltenPushButton
        text="Add Action"
        style={"outlined"}
        click={handleShowActionPicker}
      />
    </div>
  {:else}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <action-placeholder
      on:click={handleShowActionPicker}
      class="hover:opacity-100 opacity-0 transition-opacity delay-100 duration-300 cursor-pointer flex items-center mr-2.5"
    >
      <div class="h-2 w-full rounded-full bg-pick -mr-1" />

      <div
        class="h-5 w-5 rounded-full text-center flex items-center justify-center bg-pick"
      >
        <svg
          class="w-5 h-5 p-1"
          viewBox="0 0 7 7"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3.5 0.5C3.77614 0.5 4 0.723858 4 1V3H6C6.27614 3 6.5 3.22386 6.5 3.5C6.5 3.77614 6.27614 4 6 4H4V6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6V4H1C0.723858 4 0.5 3.77614 0.5 3.5C0.5 3.22386 0.723858 3 1 3H3V1C3 0.723858 3.22386 0.5 3.5 0.5Z"
            fill="white"
          />
        </svg>
      </div>
    </action-placeholder>
  {/if}
</container>

{#if showActionPicker}
  <ActionPicker {index} {referenceElement} on:close={handleCloseActionPicker} />
{/if}
