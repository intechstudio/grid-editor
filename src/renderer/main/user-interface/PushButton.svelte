<script lang="ts">
  import { setTooltip } from "./tooltip/Tooltip";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  enum ButtonStyle {
    NORMAL = "normal",
    OUTLINED = "light",
    ACCEPT = "accept",
  }

  const styleMap: { [key in ButtonStyle]: string } = {
    [ButtonStyle.NORMAL]:
      "hover:bg-secondary-brightness-10 text-gray-50 bg-secondary",
    [ButtonStyle.OUTLINED]:
      "border hover:bg-commit-saturate-20 text-white border-commit-saturate-10 hover:border-commit-desaturate-10",
    [ButtonStyle.ACCEPT]: "text-white bg-commit hover:bg-commit-saturate-20",
  };

  export let tooltip: { [key: string]: any } | undefined;
  export let selected: boolean = false;
  export let text: string = "";
  export let style: ButtonStyle = ButtonStyle.NORMAL;

  function handleClick(e) {
    dispatch("click");
  }
</script>

<button
  use:setTooltip={tooltip}
  class:selected
  on:click={handleClick}
  class="{$$props.class} {styleMap[
    style
  ]} relative py-1 px-4 rounded focus:outline-none"
>
  <span>{text}</span>
</button>
