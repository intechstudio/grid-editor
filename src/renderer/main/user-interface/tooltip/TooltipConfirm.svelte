<script>
  import { onMount } from "svelte";
  import { fly, fade, slide } from "svelte/transition";
  import { current_tooltip_store } from "../../../runtime/app-helper.store";
  import { tooltip_content } from "./tooltip-content.json.js";

  import { windowSize } from "../../../runtime/window-size";

  const { platform } = window.ctxProcess;

  import { clickOutside } from "../../_actions/click-outside.action";

  export let key = "";

  const TOOLTIP_MAX_HEIGHT = 200;

  let fadein_ended = false;

  let parent_element;
  let tooltip_element;
  let tooltip_text = tooltip_content[key];
  let tooltip_isvisible = false;
  let tooltip_delaydone = false;

  let tooltip_style = "";
  let tooltip_isbelow = false;
  let arrow_style = "";

  let innerWidth;
  let innerHeight;

  let ready = false;

  onMount(() => {
    ready = true;
  });

  function appear(node, { duration }) {
    return {
      duration,
      css: (t) => {
        const eased = elasticOut(t);

        return `
					transform: scale(${eased}) rotate(${eased * 1080}deg);

					color: hsl(
						${Math.trunc(t * 360)},
						${Math.min(100, 1000 - 1000 * t)}%,
						${Math.min(50, 500 - 500 * t)}%
					);`;
      },
    };
  }

  function calculate_position() {
    if (parent_element === undefined) {
      return;
    }

    let docu = { width: window.innerWidth, height: window.innerHeight };
    let parent = parent_element.getBoundingClientRect();
    let self = { width: 200, height: 0 };

    let xoffset = 0;

    if (
      parent.left - self.width / 2 + parent.width / 2 + self.width >
      docu.width
    ) {
      xoffset =
        docu.width -
        (parent.left - self.width / 2 + parent.width / 2 + self.width + 5);
    }

    if (parent.left - self.width / 2 + parent.width / 2 < 5) {
      xoffset = 5 - (parent.left - self.width / 2 + parent.width / 2);
    }

    if (TOOLTIP_MAX_HEIGHT + parent.top + parent.height < docu.height) {
      tooltip_style = `width: ${self.width}px; top: ${
        parent.top + parent.height
      }px; left: ${
        parent.left - self.width / 2 + parent.width / 2 + xoffset
      }px; `;
      arrow_style = `margin-left: ${self.width / 2 - 10 - xoffset}px; `;
      tooltip_isbelow = false;
    } else {
      tooltip_style = `width: ${self.width}px; top: ${parent.top}px; left: ${
        parent.left - self.width / 2 + parent.width / 2 + xoffset
      }px; transform: translateY(-100%);  `;
      arrow_style = `margin-left: ${self.width / 2 - 10 - xoffset}px; `;
      tooltip_isbelow = true;
    }

    // bottom: 201
    // height: 30
    // left: 597.734375
    // right: 671.25
    // top: 171
    // width: 73.515625
    // x: 597.734375
    // y: 171
  }

  $: if (tooltip_isvisible) {
    calculate_position();
  }
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<!-- Button Hover -->
{#if tooltip_text !== undefined}
  <button
    use:clickOutside={{ useCapture: true }}
    on:click-outside={() => {
      tooltip_isvisible = false;
    }}
    bind:this={parent_element}
    on:click|stopPropagation={() => {
      tooltip_isvisible = true;
    }}
    class="tooltipconfirm w-full flex h-full absolute right-0 top-0"
  >
    {#if tooltip_isvisible}
      <button
        bind:this={tooltip_element}
        on:click|stopPropagation={() => {}}
        style="z-index: 60; {tooltip_style}"
        class="fixed cursor-default"
      >
        <div class="flex-col">
          {#if tooltip_isbelow == false}
            <div
              class="arrow-up"
              style="background-color: rgba(0,0,100,0);  {arrow_style}"
            />
          {/if}
          <div
            class="tooltip-bg text-base flex flex-col px-4 py-4 text-white text-left"
            style=""
          >
            {tooltip_text}
            <div
              class="flex mt-2 {platform() !== 'linux'
                ? ' flex-row '
                : ' flex-row-reverse '}"
            >
              <button
                class="w-1/2 mx-1 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-20 relative"
                on:click|stopPropagation={() => {
                  console.log(parent_element.parentNode.click());
                  tooltip_isvisible = false;
                }}>Confirm</button
              >
              <button
                class="w-1/2 mx-1 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-20 relative"
                on:click|stopPropagation={() => {
                  tooltip_isvisible = false;
                }}>Cancel</button
              >
            </div>
          </div>
          {#if tooltip_isbelow == true}
            <div
              class="arrow-down"
              style="background-color: rgba(0,0,100,0);  {arrow_style}"
            />
          {/if}
        </div>
      </button>
    {/if}
  </button>
{/if}

<style>
  :root {
    --tooltip-bg-color: rgba(14, 20, 24, 0.92);
  }

  .tooltip-bg {
    background-color: var(--tooltip-bg-color);
  }

  .arrow-up {
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid var(--tooltip-bg-color);
  }

  .arrow-down {
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid var(--tooltip-bg-color);
  }
</style>
