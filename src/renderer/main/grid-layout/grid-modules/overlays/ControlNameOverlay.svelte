<script>
  import { appSettings } from "../../../../runtime/app-helper.store.js";
  import { elementNameStore } from "../../../../runtime/runtime.store.js";

  export let visible = false;
  export let elementNumber = undefined;
  export let device = undefined;
  export let rotation = 0;

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
</script>

{#if visible && elementNumber !== 255}
  <container class="pointer-events-auto">
    <div
      class="flex w-full h-full items-center p-1 bg-overlay"
      style="transform: rotate({-$appSettings.persistent.moduleRotation}deg);"
    >
      <p
        class="max-w-md mx-auto md:break-words md:whitespace-normal truncate text-white"
        style="transform: rotate({90 * device.rot}deg);"
      >
        {elementSettings[elementNumber]?.controlElementName}
      </p>
    </div>
  </container>
{/if}
