<script>
  import { createEventDispatcher } from "svelte";

  export let moduleHovered = false;
  export let margin = 0;

  const dispatch = createEventDispatcher();

  function handleClick(e) {
    dispatch("click");
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="flex pointer-events-auto absolute"
  style="width: calc(100% + {margin * 2}px);height: calc(100% + {margin *
    2}px); margin: -{margin}px;"
  on:mouseover|self={() => (moduleHovered = true)}
  on:mouseleave|self={() => (moduleHovered = false)}
  on:click={handleClick}
>
  <div
    class=" pointer-events-auto absolute left-0 top-0"
    style="width: calc(100% - {margin * 4}px); height: calc(100% - {margin *
      4}px); margin: {margin * 2}px;"
  />
</div>
