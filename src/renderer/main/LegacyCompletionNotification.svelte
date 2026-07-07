<script lang="ts">
  import { appSettings } from "../runtime/app-helper.store";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  const config = window.ctxProcess.configuration();

  function handleDismiss() {
    appSettings.update((s) => {
      s.legacyCompletionActive = false;
      return s;
    });
  }

  function handleTroubleshooting() {
    window.electron.openInBrowser(
      config.DOCUMENTATION_LUALS_TROUBLESHOOTING_URL,
    );
  }
</script>

{#if $appSettings.legacyCompletionActive && !$appSettings.persistent.userLevelMinimalist}
  <div
    class="w-full bg-orange-800 text-white justify-center flex flex-row items-center h-16 gap-4 px-4"
  >
    <div class="flex-col text-center">
      <b>Lua Language Server not available</b>
      <p>
        Using fallback editor — limited autocomplete, no diagnostics, no hover
        documentation.
      </p>
    </div>
    <MoltenPushButton text="Troubleshooting" click={handleTroubleshooting} />
    <MoltenPushButton text="Dismiss" click={handleDismiss} />
  </div>
{/if}
