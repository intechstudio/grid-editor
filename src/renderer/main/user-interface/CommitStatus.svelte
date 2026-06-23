<script lang="ts">
  // Sync state badge shared by the code editor modal and the in-action-block editor.
  export let commitEnabled = false;
  export let deleted = false;
</script>

{#if deleted}
  <div class="text-right text-sm">Deleted Action</div>
{:else}
  <div
    class="text-right text-sm {commitEnabled
      ? 'text-yellow-600'
      : 'text-green-500'}"
  >
    {commitEnabled ? "Unsaved changes!" : "Synced with Grid!"}
  </div>
{/if}
