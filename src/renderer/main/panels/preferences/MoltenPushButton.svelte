<script lang="ts">
  import { setTooltip } from "../../user-interface/tooltip/Tooltip";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  enum ButtonStyle {
    NORMAL = "normal",
    OUTLINED = "light",
    ACCEPT = "accept",
  }

  const styleMap: {
    [key in ButtonStyle]: { enabled: string; disabled: string };
  } = {
    [ButtonStyle.NORMAL]: {
      enabled: "hover:bg-secondary-brightness-10 text-gray-50 bg-secondary",
      disabled: "text-gray-50 bg-secondary bg-opacity-50 text-opacity-50",
    },
    [ButtonStyle.OUTLINED]: {
      enabled:
        "border hover:bg-commit-saturate-20 text-white border-commit-saturate-10 hover:border-commit-desaturate-10",
      disabled:
        "border text-white border-commit-saturate-10 bg-opacity-50 text-opacity-50",
    },
    [ButtonStyle.ACCEPT]: {
      enabled: "text-white bg-commit hover:bg-commit-saturate-20",
      disabled: "text-white bg-commit bg-opacity-50 text-opacity-50",
    },
  };

  export let tooltip: { [key: string]: any } | undefined;
  export let selected: boolean = false;
  export let text: string = "";
  export let style: ButtonStyle = ButtonStyle.NORMAL;
  export let disabled: boolean = false;

  function handleClick(e) {
    dispatch("click");
  }
</script>

<button
  use:setTooltip={tooltip}
  class:selected
  on:click={handleClick}
  {disabled}
  class="{$$props.class} {disabled
    ? styleMap[style].disabled
    : styleMap[style].enabled} relative py-1 px-4 rounded focus:outline-none"
>
  <span>{text}</span>
</button>
