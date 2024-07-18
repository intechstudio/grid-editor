<script lang="ts" context="module">
  import SvgIcon from "./../../../user-interface/SvgIcon.svelte";
  export interface ContextMenuItem {
    text: string[];
    handler: (...args: any[]) => any;
    isDisabled?: () => boolean;
    iconPath?: string;
  }
</script>

<script lang="ts">
  import Popover from "svelte-easy-popover/dist/ts/Popover.svelte";
  import { contextMenu } from "./context-target";
  export let target: HTMLElement;
  export let items: ContextMenuItem[];
  export let offset: { x: number; y: number };

  // Compute the maximum length of the button texts
  let maxLength = Math.max(...items.map((e) => e.text[0].length));

  function handleItemClicked(item: ContextMenuItem) {
    item.handler();
    contextMenu.close();
  }

  function handleBlur() {
    contextMenu.close();
  }

  function handleClickOutside() {
    contextMenu.close();
  }
</script>

<svelte:window on:blur={handleBlur} on:click={handleClickOutside} />

<container>
  <Popover
    isOpen={true}
    referenceElement={target}
    placement={"right-end"}
    spaceAway={-target.offsetWidth + offset.x}
    spaceAlong={-target.offsetHeight + offset.y}
  >
    <div
      class="flex flex-col items-start bg-black bg-opacity-75 border-white rounded p-2 absolute"
    >
      {#each items as item}
        {@const disabled = item.isDisabled ? item.isDisabled() : false}
        <button
          class="text-white text-sm flex flex-row gap-2 items-center whitespace-nowrap w-full px-2 text-left cursor-default"
          class:hover:bg-white={!disabled}
          class:opacity-75={!disabled}
          class:opacity-25={disabled}
          {disabled}
          on:click={() => handleItemClicked(item)}
        >
          {#if item.iconPath}
            <SvgIcon
              width={12}
              height={12}
              fill="#FFF"
              iconPath={item.iconPath}
            />
          {/if}
          <span class="flex-1">{item.text[0]}</span>
          <!-- Spacer for alignment -->
          <span
            class="invisible"
            style="width: {maxLength - item.text[0].length}ch;"
            >{item.text[0]}</span
          >
          <span>{item.text[1]}</span>
        </button>
      {/each}
    </div>
  </Popover>
</container>

<style>
  .flex-1 {
    flex: 1;
  }
</style>
