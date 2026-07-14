<script>
  import MidiMonitor from "./panels/MidiMonitor/MidiMonitor.svelte";
  import DebugMonitor from "./panels/DebugMonitor/DebugMonitor.svelte";
  import WebsocketMonitor from "./panels/WebsocketMonitor/WebsocketMonitor.svelte";
  import ProfileCloud from "./panels/profileCloud/ProfileCloud.svelte";
  import Packages from "./panels/packages/Packages.svelte";
  import Preferences from "./panels/preferences/Preferences.svelte";
  import FileManager from "./panels/FileManager/FileManager.svelte";
  import { appSettings, splitpanes } from "../runtime/app-helper.store";

  $: leftPanel = $splitpanes.left.component ?? "profile-cloud";
</script>

<!-- {#if $appSettings.leftPanelVisible == true} -->
<div
  style="background-color: var(--background); color: var(--foreground); border: 1px solid var(--border); border-radius: var(--radius);"
  class="w-full h-full overflow-hidden"
>
  {#if leftPanel == "file-manager"}
    <FileManager />
  {:else if leftPanel == "preferences"}
    <Preferences />
  {:else if leftPanel == "packages"}
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
      {#key $appSettings.packageComponentKeys[leftPanel] ?? leftPanel}
        <div class="w-full h-full overflow-y-auto flex flex-col">
          <svelte:element this={preference.preferenceComponent} class="m-2" />
          {#if $appSettings.persistent.packageDeveloper}
            <p class="m-2">Debug logs</p>
            <textarea
              class="bg-secondary min-h-[20rem] max-h-[20rem] font-mono p-1 m-2 rounded text-white"
            >
              {JSON.stringify(
                $appSettings.packageDebugLogs.filter(
                  (e) => e.packageId === preference.id,
                ),
              )}
            </textarea>
          {/if}
        </div>
      {/key}
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
