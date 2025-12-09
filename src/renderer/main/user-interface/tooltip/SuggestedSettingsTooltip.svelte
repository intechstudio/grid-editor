<script lang="ts">
  import { ElementSettingsHelper } from "../../../config-blocks/element-settings-helper";

  export let suggestedSettings: {
    mode?: string;
    min?: string;
    max?: string;
    reason?: string;
  };
  export let elementSettings: ElementSettingsHelper.ElementSettings | null;
  export let elementType: number | undefined;

  function getModeLabel(mode: string): string {
    if (elementType !== undefined) {
      return ElementSettingsHelper.getModeInfo(elementType, mode) || mode;
    }
    return mode;
  }
</script>

<div class="w-[280px] p-2 text-sm">
  <!-- Header -->
  <div
    class="font-semibold text-primary-main mb-2 pb-1 border-b border-primary-main/30"
  >
    Suggested Element Settings
  </div>

  <!-- Reason (if provided) -->
  {#if suggestedSettings.reason}
    <div class="mb-3 p-2 bg-primary-main/10 rounded text-xs">
      <div class="flex items-start gap-2">
        <span>💡</span>
        <p class="text-text-normal">{suggestedSettings.reason}</p>
      </div>
    </div>
  {/if}

  <!-- Settings Comparison -->
  <div class="space-y-2">
    <!-- Mode -->
    {#if suggestedSettings.mode && elementSettings?.mode !== null}
      {@const matches = suggestedSettings.mode === elementSettings?.mode}
      {@const suggestedModeInfo = getModeLabel(suggestedSettings.mode)}
      <div
        class="p-2 rounded {matches ? 'bg-green-500/10' : 'bg-orange-500/10'}"
      >
        <div class="flex items-center gap-1.5 mb-0.5">
          <span class="text-sm">{matches ? "✓" : "⚠️"}</span>
          <span class="font-semibold text-xs">Mode</span>
        </div>
        <div class="ml-5 text-xs space-y-0.5">
          <div class="text-text-normal">
            Current: <span class="font-mono"
              >{elementSettings?.modeInfo} ({elementSettings?.mode})</span
            >
          </div>
          {#if !matches}
            <div class="text-primary-main">
              Suggested: <span class="font-mono"
                >{suggestedModeInfo} ({suggestedSettings.mode})</span
              >
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Min -->
    {#if suggestedSettings.min && elementSettings?.min !== null}
      {@const matches = suggestedSettings.min === elementSettings?.min}
      <div
        class="p-2 rounded {matches ? 'bg-green-500/10' : 'bg-orange-500/10'}"
      >
        <div class="flex items-center gap-1.5 mb-0.5">
          <span class="text-sm">{matches ? "✓" : "⚠️"}</span>
          <span class="font-semibold text-xs">Minimum Value</span>
        </div>
        <div class="ml-5 text-xs space-y-0.5">
          <div class="text-text-normal">
            Current: <span class="font-mono">{elementSettings?.min}</span>
          </div>
          {#if !matches}
            <div class="text-primary-main">
              Suggested: <span class="font-mono">{suggestedSettings.min}</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Max -->
    {#if suggestedSettings.max && elementSettings?.max !== null}
      {@const matches = suggestedSettings.max === elementSettings?.max}
      <div
        class="p-2 rounded {matches ? 'bg-green-500/10' : 'bg-orange-500/10'}"
      >
        <div class="flex items-center gap-1.5 mb-0.5">
          <span class="text-sm">{matches ? "✓" : "⚠️"}</span>
          <span class="font-semibold text-xs">Maximum Value</span>
        </div>
        <div class="ml-5 text-xs space-y-0.5">
          <div class="text-text-normal">
            Current: <span class="font-mono">{elementSettings?.max}</span>
          </div>
          {#if !matches}
            <div class="text-primary-main">
              Suggested: <span class="font-mono">{suggestedSettings.max}</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
