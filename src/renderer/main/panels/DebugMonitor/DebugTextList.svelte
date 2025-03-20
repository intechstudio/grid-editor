<script lang="ts">
  import { afterUpdate, beforeUpdate } from "svelte";
  import { debug_monitor_store } from "./DebugMonitor.store";

  let scrollDown: HTMLElement;
  let autoscroll: boolean = false;

  beforeUpdate(() => {
    autoscroll =
      scrollDown &&
      scrollDown.offsetHeight + scrollDown.scrollTop >
        scrollDown.scrollHeight - 20;
  });

  afterUpdate(() => {
    if (autoscroll && scrollDown)
      scrollDown.scrollTo(0, scrollDown.scrollHeight);
  });
</script>

<container
  class="flex flex-col overflow-hidden h-full w-full"
  class:hidden={$debug_monitor_store.length === 0}
>
  <div
    bind:this={scrollDown}
    class="flex flex-col font-mono text-white bg-secondary p-2 flex-grow overflow-y-auto"
  >
    {#each $debug_monitor_store as message}
      <span>{message}</span>
    {/each}
  </div>
</container>
