<script lang="ts">
  import {
    EventData,
    GridAction,
    GridEvent,
    ActionData,
  } from "./../../runtime/runtime";
  import { createEventDispatcher } from "svelte";
  import { toWords } from "number-to-words";

  const dispatch = createEventDispatcher();

  export let config: GridAction;

  let step = 0;
  const event = config.parent as GridEvent;

  function handleClick(e) {
    dispatch("toggle");
  }

  $: handleEventDataChange($event);

  function handleEventDataChange(event: EventData) {
    step = 0;
    let stack = [];
    for (const action of event.config) {
      if (action.short === "bst0") {
        stack.push(0);
      }

      if (action.short === "bste") {
        stack.pop();
      }

      if (action.short === "bstn") {
        step = ++stack[stack.length - 1];
        if (action.id === config.id) {
          const defaultScript = config.information.defaultLua;
          const newScript = defaultScript.replace("N", String(step));
          const oldScript = config.script;
          if (newScript !== oldScript) {
            config.updateData(
              new ActionData(config.short, newScript, config.name)
            );
            config.sendToGrid();
          }
          return;
        }
      }
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="px-2 w-full h-full {config.information.rounding === 'top'
    ? 'rounded-tr-xl'
    : ''} {config.information.rounding === 'bottom'
    ? 'rounded-br-xl'
    : ''} text-white flex items-center"
  style="background-color:{config.information.color}"
  on:click={handleClick}
>
  {#if config.information.short === "bstn"}
    <span
      >{`Step ${
        toWords(step)[0].toUpperCase() + toWords(step).slice(1).toLowerCase()
      }`}</span
    >
  {:else}
    <span>{config.information.displayName}</span>
  {/if}
</div>
