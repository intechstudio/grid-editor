<script lang="ts">
  export let level: number = 0;
</script>

{#each Array(level) as _}
  <div style="width: 15px" class="flex items-center mx-1">
    <div class="w-3 h-3 rounded-full"></div>
  </div>
{/each}
