<script lang="ts">
  import { EventData, GridAction, GridEvent } from "./../../runtime/runtime";
  import { createEventDispatcher } from "svelte";
  import { toWords } from "number-to-words";
  import * as ButtonStepElseIf from "../ButtonStep_ElseIf.svelte";

  const dispatch = createEventDispatcher();

  export let config: GridAction;

  let step = 0;
  const event = config.parent as GridEvent;

  function handleClick(e) {
    dispatch("toggle");
  }

  $: {
    handleEventDataChange($event);
  }

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
        config.script = ButtonStepElseIf.information.defaultLua.replace(
          "N",
          String(step)
        );
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
