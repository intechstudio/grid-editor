<script>
  import Popover from "svelte-easy-popover";
  import { appSettings } from "../../../../runtime/app-helper.store.js";
  import { elementNameStore } from "../../../../runtime/runtime.store.js";

  export let visible = false;
  export let elementNumber = undefined;
  export let device = undefined;

  let elementName = undefined;
  $: {
    elementName = elementSettings[elementNumber]?.controlElementName;
  }

  let elementSettings;

  $: {
    elementSettings = device?.pages[0].control_elements;
  }

  $: {
    try {
      let dx = device?.dx;
      let dy = device?.dy;

      const obj = $elementNameStore[dx][dy];

      Object.keys(obj).forEach((key) => {
        elementSettings[key].controlElementName = obj[key];
      });
    } catch (error) {}
  }

  let referenceElement = undefined;
  let isOpen = false;

  let x = 0;
  let y = 0;

  function handleMove(e) {
    const rect = referenceElement.getBoundingClientRect();
    x = e.offsetX - rect.width / 2;
    y = e.offsetY - rect.height / 2;
    referenceElement.style.left = x + "px";
    referenceElement.style.top = y + "px";
  }
</script>

{#if visible && elementName.length > 0}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <div
    class="w-full h-full relative {$$props.classs}"
    on:mousemove={handleMove}
    on:mouseover={() => {
      isOpen = true;
    }}
    on:mouseout={() => {
      isOpen = false;
    }}
  >
    <div
      bind:this={referenceElement}
      class="bg-lime-300 absolute pointer-events-none"
    >
      <Popover
        bind:isOpen
        id="tooltip"
        triggerEvents={["manual"]}
        placement="right"
        spaceAway={10}
        spaceAlong={10}
        {referenceElement}
      >
        <div class="flex bg-black bg-opacity-50 rounded-lg z-50">
          <span class="text-white font-mono px-3 py-0.5">
            {elementName}
          </span>
        </div>
      </Popover>
    </div>
  </div>
{/if}
