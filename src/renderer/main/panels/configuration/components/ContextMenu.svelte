<script lang="ts" context="module">
  export interface ContextMenuItem {
    text: string;
    handler: (...args: any[]) => any;
    isDisabled?: () => boolean;
  }
</script>

<script lang="ts">
  import Popover from "svelte-easy-popover/dist/ts/Popover.svelte";
  import { clickOutside } from "../../../_actions/click-outside.action";
  export let target: HTMLElement;
  export let items: ContextMenuItem[];
  export let offset: { x: number; y: number };

  let render = true;

  function handleItemClicked(item: ContextMenuItem) {
    item.handler();
    render = false;
  }

  function handleClickOutside() {
    render = false;
  }
</script>

<container>
  <Popover
    isOpen={render}
    referenceElement={target}
    placement={"right-end"}
    spaceAway={-target.offsetWidth + offset.x}
    spaceAlong={-target.offsetHeight + offset.y}
  >
    <div
      use:clickOutside={{ useCapture: true }}
      on:click-outside={handleClickOutside}
      class="flex flex-col items-start bg-black bg-opacity-75 border-white rounded p-2 absolute"
    >
      {#each items as item}
        {@const disabled =
          typeof item.isDisabled !== "undefined" ? item.isDisabled() : false}
        <button
          class="text-white text-sm {!disabled
            ? 'text-opacity-75'
            : 'text-opacity-25'} font-mono whitespace-nowrap w-full px-2 text-left hover:bg-opacity-10 cursor-default"
          class:hover:bg-white={!disabled}
          {disabled}
          on:click={() => handleItemClicked(item)}>{item.text}</button
        >
      {/each}
    </div>
  </Popover>
</container>
