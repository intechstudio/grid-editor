<script lang="ts">
  import { run } from 'svelte/legacy';

  import {
    EventData,
    GridAction,
    GridEvent,
    ActionData,
  } from "./../../runtime/runtime";
  import { createEventDispatcher } from "svelte";
  import { toWords } from "number-to-words";

  const dispatch = createEventDispatcher();

  interface Props {
    config: GridAction;
  }

  let { config }: Props = $props();

  let step = $state(0);
  const event = config.parent as GridEvent;

  function handleClick(e) {
    dispatch("toggle");
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
        if (action.id === config.id) {
          const defaultScript = config.information.defaultLua;
          const newScript = defaultScript.replace("N", String(step));
          const oldScript = config.script;
          if (newScript !== oldScript) {
            config.updateData(
              new ActionData(config.short, newScript, config.name),
            );
            config.sendToGrid();
          }
          return;
        }
      }
    }
  }
  run(() => {
    handleEventDataChange($event);
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="px-2 w-full {config.information.rounding === 'top'
    ? 'rounded-tr-xl'
    : ''} {config.information.rounding === 'bottom'
    ? 'rounded-br-xl'
    : ''} text-white flex items-center"
  style="background-color:{config.information.color}"
  onclick={handleClick}
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
