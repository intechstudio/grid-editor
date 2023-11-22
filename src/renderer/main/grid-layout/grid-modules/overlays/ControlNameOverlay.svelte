<script>
  import { appSettings } from "../../../../runtime/app-helper.store.js";
  import { elementNameStore } from "../../../../runtime/runtime.store.js";

  export let visible = false;
  export let elementNumber = undefined;
  export let device = undefined;

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

{#if visible}
  <container class="pointer-events-auto">
    <div class="bg-overlay w-full h-full">
      <div
        class="block p-0 m-0 font-mono text-white"
        style="transform: rotate({-$appSettings.persistent.moduleRotation}deg);"
      >
        {elementSettings[elementNumber]?.controlElementName}
      </div>
    </div>
  </container>
{/if}
