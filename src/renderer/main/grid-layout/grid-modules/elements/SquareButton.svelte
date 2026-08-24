<script>
  import Led from "./Led.svelte";

  export let size = 1;
  export let elementNumber;
  export let value;
  export let color;

  let buttonSize = 9.5;
</script>

<div
  data-control-number={elementNumber}
  style="
  width: {size * buttonSize + 'px'};
  height: {size * buttonSize + 'px'};"
>
  <div class="relative background">
    <div class="flex w-full h-full"></div>
    <div
      class="absolute top-0 left-1/2 -translate-x-1/2"
      style="margin-top: 4px;"
    >
      <Led {color} size={2.1} />
    </div>

    {#if value}
      <div class="pressure-bar">
        <div
          class="flex w-full bg-white/20"
          style="height: {(100 / 127) * value}%;"
        ></div>
      </div>
    {/if}
  </div>
</div>

<style>
  .pressure-bar {
    display: flex;
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
    height: 100%;
    place-items: end;
  }
  .background {
    display: flex;
    background-color: var(--background-muted);
    border: 1px solid var(--background-soft);
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 3px;
  }
</style>
