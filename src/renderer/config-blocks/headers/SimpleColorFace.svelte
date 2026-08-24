<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridAction } from "../../runtime/runtime";
  import { derived } from "svelte/store";
  import { SimpleColor } from "../SimpleColor";

  const dispatch = createEventDispatcher();

  export let action: GridAction;

  const data = new SimpleColor.ViewModel(action);

  const cssColors = derived(data, ($data) => {
    const css = $data.previewColors.map((e) =>
      Object.values(e).some((e) => isNaN(Number(e)))
        ? "white"
        : `rgba(${e.red},${e.green},${e.blue},${e.alpha})`,
    );
    return css.length === 1 ? ["transparent", ...css] : css;
  });

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  role="button"
  tabindex="0"
  class="w-full gap-2 px-2 py-1 items-center justify-between overflow-hidden pointer-events-none"
  style="display: grid; grid-template-columns: minmax(0, 33%) 1fr auto;"
  on:click={handleClick}
>
  <slot name="name" />

  <div class="flex-grow h-full py-1">
    <div
      class="h-full w-full rounded-full border border-black will-change-transform"
      style="background-image: linear-gradient(to right, {$cssColors.join(
        ',',
      )}); background-size: 100% 100%; background-repeat: no-repeat;"
    ></div>
  </div>

  <slot name="edit-name-trigger" />
</div>
