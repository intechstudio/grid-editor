<script lang="ts">
  import { createSelect, melt } from "@melt-ui/svelte";
  export let options: SelectOption[];
  export let target: any;
  export let size: "auto" | "full" = "auto";

  type SelectOption = { title: string; value: any };

  function getDefaultSelected() {
    const obj = options.find((e: SelectOption) => e.value === target);
    return { label: obj?.title, value: obj?.value };
  }

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
    defaultSelected: getDefaultSelected(),
  });

  $: if ($selected) {
    handleSelectionChange();
  }

  $: if (target) {
    handleTargetChange();
  }

  function handleTargetChange() {
    if ($selected.value === target) {
      return;
    }

    const obj = options.find((e: SelectOption) => e.value === target);
    selected.set({ label: obj?.title, value: obj?.value });
  }

  function handleSelectionChange() {
    if ($selected.value === target) {
      return;
    }
    target = $selected.value;
  }
</script>

<div class="flex flex-col gap-1" class:flex-grow={size === "full"}>
  <button
    {...$trigger}
    use:trigger
    class="w-full flex flex-row border border-black p-2"
  >
    <div class="flex flex-grow truncate">{$selectedLabel || " "}</div>
    <div class="flex">&#9660;</div>
  </button>
  {#if $open}
    <div
      {...$menu}
      use:menu
      class="bg-gray-900 text-white/80 border border-white/50 rounded z-40"
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
