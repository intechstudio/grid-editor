<script context="module" lang="ts">
  // Define the ButtonStyle enum
  export enum ButtonStyle {
    NORMAL = "normal",
    OUTLINED = "outlined",
    ACCEPT = "accept",
  }

  export enum ButtonRatio {
    NORMAL = "normal",
    BOX = "box",
  }

  export enum ButtonSnap {
    AUTO = "auto",
    FULL = "full",
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  const styleMap: {
    [key in ButtonStyle]: { enabled: string; disabled: string };
  } = {
    [ButtonStyle.NORMAL]: {
      enabled:
        "text-gray-50 bg-black bg-opacity-10 border border-black border-opacity-40 hover:bg-opacity-40",
      disabled:
        "text-gray-50/25 bg-black/25 bg-opacity-10 border border-black/25 border-opacity-40",
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

  export let selected: boolean = false;
  export let text: string = "";
  export let style: ButtonStyle = ButtonStyle.NORMAL;
  export let disabled: boolean = false;
  export let popup: { duration?: number } | undefined = undefined;
  export let ratio: ButtonRatio = ButtonRatio.NORMAL;
  export let snap: ButtonSnap = ButtonSnap.AUTO;

  let button: HTMLElement;
  let showPopup: boolean = false;

  function handleClick(e) {
    if (!showPopup) {
      showPopup = true;
      setTimeout(() => {
        showPopup = false;
      }, popup?.duration ?? 3000);
    }
    dispatch("click");
  }
</script>

<container class="relative" class:w-full={snap === ButtonSnap.FULL}>
  <button
    bind:this={button}
    class:selected
    on:click={handleClick}
    {disabled}
    class="{disabled
      ? styleMap[style].disabled
      : styleMap[style].enabled} rounded focus:outline-none truncate py-1"
    class:px-4={ratio === ButtonRatio.NORMAL}
    class:px-2={ratio === ButtonRatio.BOX}
    class:w-full={snap === ButtonSnap.FULL}
    class:w-fit={snap === ButtonSnap.AUTO}
  >
    <span>{text}</span>
    <slot name="content" />
  </button>

  {#if showPopup}
    <slot name="popup" />
  {/if}
</container>
