<script lang="ts">
  import { createRadioGroup, melt } from "@melt-ui/svelte";
  import { writable } from "svelte/store";

  export let options = [];
  export let target;
  const {
    elements: { root, item },
    helpers: { isChecked },
    states: { value },
  } = createRadioGroup({
    defaultValue: target,
  });

  let oldTarget;

  $: {
    //console.log("Target", target);
    if (target !== oldTarget) {
      $value = target;
      oldTarget = target;
    }

    if (target !== $value) {
      oldTarget = target = $value;
    }
  }
</script>

<div {...$root} use:root class="text-white grid grid-flow-row gap-4 py-2">
  {#each options as option}
    <label
      class="bg-black bg-opacity-10 border border-black border-opacity-20 p-2 group cursor-pointer flex items-center"
    >
      <button {...$item(option.value)} use:item id={option.title}>
        <div
          class="relative flex items-center justify-center rounded-full border w-6 h-6 mr-3"
        >
          <div
            class="{$isChecked(option.value)
              ? 'block'
              : 'hidden'} absolute rounded-full bg-white h-3 w-3"
          />
        </div>
      </button>

      <span id="{option.title}-label">{option.title}</span>
    </label>
  {/each}
</div>
