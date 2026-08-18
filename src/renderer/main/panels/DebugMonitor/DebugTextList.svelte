<script lang="ts">
  import { debug_monitor_store } from "./DebugMonitor.store";
  import { scrollToBottom } from "../../_actions/scroll.move";
  import { copyContextMenu } from "../../_actions/copy-context-menu.action";
</script>

<container
  class="flex flex-col overflow-hidden h-full w-full"
  class:hidden={$debug_monitor_store.length === 0}
>
  <div
    use:scrollToBottom={debug_monitor_store}
    use:copyContextMenu
    class="flex flex-col font-mono text-foreground bg-background-muted p-2 flex-grow overflow-y-auto select-text"
  >
    {#each $debug_monitor_store as message}
      {#each message.split("\n") as part}
        <span>{part}</span>
      {/each}
    {/each}
  </div>
</container>
