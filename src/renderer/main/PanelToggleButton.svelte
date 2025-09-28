<script lang="ts">
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let value = false;
  export let direction: "right" | "left" | "up" | "down";

  const rotationMap = { right: 0, left: 180, up: -90, down: 90 };

  function handleClick() {
    value = !value;
    dispatch("toggle", value);
  }
</script>

<button
  class="p-2 w-10 h-10 flex items-center justify-center bg-primary rounded-lg rotate-90"
  style="transform: rotate({rotationMap[direction]}deg);"
  on:click={handleClick}
>
  <SvgIcon fill="#FFF" iconPath={value ? "arrow_right" : "arrow_left"} />
</button>
