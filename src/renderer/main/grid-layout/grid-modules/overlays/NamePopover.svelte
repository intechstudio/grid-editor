<script>
  import Popover from "svelte-easy-popover";
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
</script>

{#if visible && elementName.length > 0}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <div class="w-full h-full relative {$$props.classs}">
    <div
      bind:this={referenceElement}
      class=" w-full h-full absolute pointer-events-auto"
    />
    <Popover
      id="tooltip"
      triggerEvents={["hover"]}
      placement="top"
      spaceAway={5}
      remainOpenOnPopoverHover={false}
      {referenceElement}
    >
      <div class="flex bg-black bg-opacity-50 rounded-lg z-50 w-fit">
        <span class="text-white font-mono px-3 py-0.5">
          {elementName}
        </span>
      </div>
    </Popover>
  </div>
{/if}
