<script lang="ts">
  import { fade } from "svelte/transition";
  import { setTooltip } from "../../user-interface/tooltip/Tooltip";
  import { createEventDispatcher } from "svelte";
  import Popover from "svelte-easy-popover/dist/ts/Popover.svelte";

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
  export let popup: { text: string; duration?: number } | undefined = undefined;

  let button: HTMLElement;
  let showPopup: boolean = false;

  function handleClick(e) {
    if (typeof popup !== "undefined" && !showPopup) {
      showPopup = true;
      setTimeout(() => {
        showPopup = false;
      }, popup.duration ?? 3000);
    }
    dispatch("click");
  }
</script>

<button
  bind:this={button}
  use:setTooltip={tooltip}
  class:selected
  on:click={handleClick}
  {disabled}
  class="{$$props.class} {disabled
    ? styleMap[style].disabled
    : styleMap[style].enabled} relative py-1 px-4 rounded focus:outline-none"
>
  {#if showPopup}
    <div out:fade={{ duration: 300 }}>
      <Popover
        isOpen={true}
        placement={"top"}
        spaceAway={5}
        referenceElement={button}
      >
        <div class="bg-black bg-opacity-50 px-2 py-1 rounded whitespace-nowrap">
          {popup?.text}
        </div>
      </Popover>
    </div>
  {/if}
  <span>{text}</span>
</button>
