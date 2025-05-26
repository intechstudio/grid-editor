<script>
  import MidiMonitor from "./panels/MidiMonitor/MidiMonitor.svelte";
  import DebugMonitor from "./panels/DebugMonitor/DebugMonitor.svelte";
  import WebsocketMonitor from "./panels/WebsocketMonitor/WebsocketMonitor.svelte";
  import ProfileCloud from "./panels/profileCloud/ProfileCloud.svelte";
  import Packages from "./panels/packages/Packages.svelte";
  import Preferences from "./panels/preferences/Preferences.svelte";
  import { appSettings } from "../runtime/app-helper.store";

  import { windowSize } from "../runtime/window-size";

  import { watchResize } from "svelte-watch-resize";

  function resize() {
    $windowSize.leftSidebarWidth = $windowSize.leftSidebarWidth + 1;
  }
</script>

<!-- {#if $appSettings.leftPanelVisible == true} -->
<div class="w-full h-full" use:watchResize={resize}>
  {#if $appSettings.leftPanel == "Preferences"}
    <Preferences />
  {:else if $appSettings.leftPanel == "Packages"}
    <Packages />
  {:else if $appSettings.leftPanel == "debug-monitor"}
    <DebugMonitor />
  {:else if $appSettings.leftPanel == "midi-monitor"}
    <MidiMonitor />
  {:else if $appSettings.leftPanel == "websocket-monitor"}
    <WebsocketMonitor />
  {/if}

  <div
    class="w-full h-full {$appSettings.leftPanel == 'profile-cloud'
      ? 'visible'
      : 'hidden'}"
  >
    <ProfileCloud />
  </div>
</div>

<!-- {/if} -->
<style>
  .splitpanes.modern-theme .splitpanes__pane {
    overflow: visible;
  }
</style>
