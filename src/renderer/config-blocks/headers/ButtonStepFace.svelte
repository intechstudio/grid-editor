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

  export let action: GridAction;

  let step = 0;
  const event = action.parent as GridEvent;

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
        if (action.id === action.id) {
          const defaultScript = action.information.defaultLua;
          const newScript = defaultScript.replace("N", String(step));
          const oldScript = action.script;
          if (newScript !== oldScript) {
            action.updateData(
              new ActionData(action.short, newScript, action.name),
            );
            action.sendToGrid();
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
  class="px-2 w-full {action.information.rounding === 'top'
    ? 'rounded-tr-xl'
    : ''} {action.information.rounding === 'bottom'
    ? 'rounded-br-xl'
    : ''} text-white flex items-center"
  style="background-color:{action.information.color}"
  on:click={handleClick}
>
  {#if action.information.short === "bstn"}
    <span
      >{`Step ${
        toWords(step)[0].toUpperCase() + toWords(step).slice(1).toLowerCase()
      }`}</span
    >
  {:else}
    <span>{action.information.displayName}</span>
  {/if}
</div>
