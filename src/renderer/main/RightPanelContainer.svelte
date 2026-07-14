<script>
  import Configuration from "./panels/configuration/Configuration.svelte";
  import MidiMonitor from "./panels/MidiMonitor/MidiMonitor.svelte";

  import { appSettings } from "../runtime/app-helper.store";

  import { windowSize } from "../runtime/window-size.svelte";

  import { watchResize } from "svelte-watch-resize";
  import { onMount } from "svelte";

  function resize() {
    windowSize.rightSidebarWidth = windowSize.rightSidebarWidth + 1;
  }

  onMount(() => {});
</script>

<div class="w-full h-full" use:watchResize={resize}>
  <div
    style="background-color: var(--background); color: var(--foreground); border: 1px solid var(--border); border-radius: var(--radius);"
    class="w-[99%] h-full"
  >
    <Configuration />
  </div>
</div>
