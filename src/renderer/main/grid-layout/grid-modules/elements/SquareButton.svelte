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
  <div class="relative background inner-shadow">
    <div class="flex w-full h-full inner-border" />
    <div
      class="absolute top-0 left-1/2 -translate-x-1/2"
      style="margin-top: 4px;"
    >
      <Led {color} size={2.1} />
    </div>
  </div>
  {#if value}
    <div class="pressure-bar">
      <div
        class="flex w-full bg-black/50"
        style="height: {(100 / 127) * value}%;"
      />
    </div>
  {/if}
</div>

<style>
  .pressure-bar {
    display: flex;
    position: absolute;
    right: 0;
    top: 0;
    width: 4px;
    height: calc(100% - 8px);
    margin: 4px 4px 0px 0px;
    place-items: end;
  }
  .background {
    display: flex;
    background-color: rgb(55, 55, 55);
    width: 100%;
    height: 100%;
    border-radius: 3px;
  }

  .inner-shadow {
    box-shadow: inset 0 0 15px rgb(36, 36, 36);
  }

  .inner-border {
    box-shadow:
      inset 0 2px 0 0 rgb(35, 35, 35),
      inset 4px 0 0 0 rgb(43, 43, 43),
      inset 0 -4px 0 0 rgb(45, 45, 45),
      inset -4px 0 0 0 rgb(60, 60, 60);
  }
</style>
