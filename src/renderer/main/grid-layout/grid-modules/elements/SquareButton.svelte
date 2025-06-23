<script>
  export let size = 1;
  export let elementNumber;
  export let value;
  let buttonSize = 9.5;
</script>

<div
  data-control-number={elementNumber}
  style="
  width: {size * buttonSize + 'px'};
  height: {size * buttonSize + 'px'};"
  class="relative"
>
  <div class="background inner-border">
    <slot />
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
    background-color: #d3d3d3;
    width: 100%;
    height: 100%;
    border-radius: 3px;
  }

  .inner-border {
    box-shadow:
      inset 0 3px 0 0 #858585,
      inset 3px 0 0 0 #afafaf,
      inset 0 -3px 0 0 #bdbdbd,
      inset -3px 0 0 0 #adadad;
  }
</style>
