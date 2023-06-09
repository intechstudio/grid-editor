<script>
  import MidiMonitor from "./panels/MidiMonitor/MidiMonitor.svelte";
  import DebugMonitor from "./panels/DebugMonitor/DebugMonitor.svelte";
  import WebsocketMonitor from "./panels/WebsocketMonitor/WebsocketMonitor.svelte";
  import Profiles from "./panels/profiles/Profiles.svelte";
  import Presets from "./panels/presets/Presets.svelte";
  import ProfileCloud from "./panels/profileCloud/ProfileCloud.svelte";
  import { appSettings } from "../runtime/app-helper.store";

  import { windowSize } from "../runtime/window-size";

  import { watchResize } from "svelte-watch-resize";

  import NewProfile from "./panels/newProfile/NewProfile.svelte";
  import NewPreset from "./panels/newPreset/NewPreset.svelte";

  export let classes;

  function resize() {
    $windowSize.leftSidebarWidth = $windowSize.leftSidebarWidth + 1;
  }
</script>

<!-- {#if $appSettings.leftPanelVisible == true} -->
<div class="{classes} w-full h-full" use:watchResize={resize}>
  {#if $appSettings.leftPanel == "Debug"}
    <DebugMonitor />
  {/if}

  {#if $appSettings.leftPanel == "MIDI Monitor"}
    <MidiMonitor />
  {/if}

  {#if $appSettings.leftPanel == "Profiles"}
    <Profiles />
  {/if}

  {#if $appSettings.leftPanel == "Presets"}
    <Presets />
  {/if}

  {#if $appSettings.leftPanel == "NewProfile"}
    <NewProfile />
  {/if}

  {#if $appSettings.leftPanel == "NewPreset"}
    <NewPreset />
  {/if}

  {#if $appSettings.leftPanel == "Websocket"}
    <WebsocketMonitor />
  {/if}

  {#if $appSettings.persistant.useProfileCloud}
    <div
      class="min-w-[200px] h-full {$appSettings.leftPanel == 'Profile Cloud'
        ? '  '
        : ' hidden '}"
    >
      <ProfileCloud />
    </div>
  {/if}
</div>

<!-- {/if} -->
<style>
  .splitpanes.modern-theme .splitpanes__pane {
    overflow: visible;
  }
</style>
