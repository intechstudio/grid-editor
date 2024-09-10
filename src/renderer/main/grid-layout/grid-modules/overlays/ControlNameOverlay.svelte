<script lang="ts">
  import { GridModule, GridElement } from "./../../../../runtime/runtime";
  import { appSettings } from "../../../../runtime/app-helper.store.js";

  export let visible = false;
  export let elementNumber = undefined;
  export let device: GridModule = undefined;

  const element: GridElement = device?.pages[0].control_elements.find(
    (e) => e.elementIndex === elementNumber
  );
</script>

{#if visible && elementNumber !== 255}
  <container class="pointer-events-auto">
    <div class="flex w-full h-full items-center text-center p-1 bg-overlay">
      <p
        class="max-w-md mx-auto break-words whitespace-normal truncate text-white"
        style="transform: rotate({-$appSettings.persistent.moduleRotation +
          device?.rot * 90}deg);"
      >
        {typeof $element.name === "undefined" ? "" : $element.name}
      </p>
    </div>
  </container>
{/if}
