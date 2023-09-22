<script lang="ts">
  export let breakpoint: "small" | "large";
  export let elementName: string;
  export let elementNumber: number;
</script>

<div class="flex justify-center text-xs">
  {#if breakpoint == "small" || elementName.length <= 4}
    <div class="block font-mono">
      {elementName.substr(0, 4)}
    </div>
  {:else if breakpoint == "large" && elementName.length > 4}
    <div class="block p-0 m-0 font-mono">
      {elementName.substr(0, 4)}
    </div>
    <div class="block p-0 m-0 font-mono">
      {elementName.substr(4, 4)}
    </div>
  {/if}
</div>
