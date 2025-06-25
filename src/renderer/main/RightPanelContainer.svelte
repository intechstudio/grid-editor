<script>
  import Configuration from "./panels/configuration/Configuration.svelte";
  import MidiMonitor from "./panels/MidiMonitor/MidiMonitor.svelte";

  import { appSettings } from "../runtime/app-helper.store";

  import { windowSize } from "../runtime/window-size";

  import { watchResize } from "svelte-watch-resize";
  import { onMount } from "svelte";

  function resize() {
    $windowSize.rightSidebarWidth = $windowSize.rightSidebarWidth + 1;
  }

  onMount(() => {});
</script>

<div class="w-full h-full" use:watchResize={resize}>
  <div class="h-full">
    <Configuration />
  </div>
</div>
