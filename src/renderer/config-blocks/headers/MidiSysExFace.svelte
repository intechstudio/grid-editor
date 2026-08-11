<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridAction } from "../../runtime/runtime";
  import { InfoBox } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  export let action: GridAction;

  const whatsInParenthesis = /\(([^)]+)\)/;

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div class="flex items-center flex-row w-full pl-3" on:click={handleClick}>
  <div
    class="grid grid-cols-[auto_1fr_auto] gap-2 justify-center items-center h-full w-full my-1"
  >
    <slot name="name" />
    <div class="justify-self-end">
      <InfoBox value={whatsInParenthesis.exec($action.script)[0]} />
    </div>
    <slot name="edit-name-trigger" />
  </div>
</div>
