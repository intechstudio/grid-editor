<script lang="ts">
  import { createSelect, melt } from "@melt-ui/svelte";
  export let options;
  export let target;
  let oldTarget;

  const {
    elements: { trigger, menu, option },
    states: { selected, selectedLabel, open },
    helpers: { isSelected },
  } = createSelect({
    forceVisible: true,
    positioning: {
      placement: "bottom",
      fitViewport: true,
      sameWidth: true,
    },
    defaultSelected: { value: target.value, label: target.title },
  });

  $: {
    if ($selected) {
      handleSelectionChange();
    }
  }

  function handleSelectionChange() {
    if (typeof $selected === "undefined") {
      if (typeof target !== "undefined") {
        selected.set(() => {
          const s = { value: undefined, label: undefined };
          const item = options.find((e) => {
            return e.value === target;
          });
          if (typeof item !== "undefined") {
            s.value = target;
            s.label = item.title;
            oldTarget = target;
            console.log(s);
            return s;
          }
        });
      }
    } else {
      if (target !== oldTarget) {
        selected.update((s) => {
          const item = options.find((e) => {
            return e.value === target;
          });
          if (typeof item !== "undefined") {
            s.value = target;
            s.label = item.title;
            oldTarget = target;
            return s;
          }
        });
      }

      if (target !== $selected.value) {
        oldTarget = target = $selected.value;
      }
    }
  }
</script>

<div class="flex flex-col gap-1">
  <button
    {...$trigger}
    use:trigger
    class="w-full flex flex-row border border-black p-2"
  >
    <div class="flex flex-grow">{$selectedLabel || " "}</div>
    <div class="flex">&#9660;</div>
  </button>
  {#if $open}
    <div
      {...$menu}
      use:menu
      class="bg-gray-900 text-white/80 border border-white/50 rounded z-10"
    >
      {#each options as item}
        <div
          {...$option({ value: item.value, label: item.title })}
          use:option
          class="cursor-pointer hover:bg-white/40 p-2 hover:text-white {$isSelected(
            item.value
          )
            ? 'bg-white/10'
            : ' '}"
        >
          {item.title}
        </div>
      {/each}
    </div>
  {/if}
</div>
