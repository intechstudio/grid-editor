<script>
  export let os;
</script>

<div class="absolute flex flex-col w-full items-center text-white ">
  <div class="flex flex-row p-4 m-4 items-center my-2 text-sm z-10 relative">
    <div class="mx-2">Hold</div>
    {#if os == "darwin"}
      <img class="w-10 h-10 p-2 bg-primary rounded-lg shadow-md" alt="mac-alt-key" src="./assets/svgs/mac-alt.svg">
    {:else}
      <img class="w-10 h-10 p-2 bg-primary rounded-lg shadow-md" alt="win-alt-key" src="./assets/svgs/win-alt.svg">
    {/if}
    <div class="mx-2">to pan the control surface.</div>
  </div>    
</div>