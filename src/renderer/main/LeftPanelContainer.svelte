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

  $: leftPanel =
    $appSettings.leftPanel ??
    ($appSettings.persistent.enabledPackages.includes("profile-cloud")
      ? "profile-cloud"
      : "Packages");
</script>

<!-- {#if $appSettings.leftPanelVisible == true} -->
<div class="w-full h-full" use:watchResize={resize}>
  {#if leftPanel == "Preferences"}
    <Preferences />
  {:else if leftPanel == "Packages"}
    <Packages />
  {:else if leftPanel == "debug-monitor"}
    <DebugMonitor />
  {:else if leftPanel == "midi-monitor"}
    <MidiMonitor />
  {:else if leftPanel == "websocket-monitor"}
    <WebsocketMonitor />
  {:else}
    {@const preference = $appSettings.packageList.find(
      (e) => e.id === leftPanel,
    )}
    {#if preference?.preferenceComponent}
      <div class="w-full h-full overflow-y-auto flex flex-col bg-primary">
        {#key $appSettings.packageComponentKeys[leftPanel]}
          <svelte:element this={preference.preferenceComponent} class="m-2" />
        {/key}
        <textarea
          class="bg-secondary min-h-[20rem] max-h-[20rem] font-mono p-1 m-2 rounded text-white"
        >
          {JSON.stringify(
            $appSettings.packageDebugLogs.filter(
              (e) => e.packageId === preference.id,
            ),
          )}
        </textarea>
      </div>
    {/if}
  {/if}

  <div
    class="w-full h-full {leftPanel == 'profile-cloud' ? 'visible' : 'hidden'}"
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
