<script lang="ts">
  import {
    GridModule,
    GridElement,
    GridPage,
  } from "./../../../../runtime/runtime";
  import { appSettings } from "../../../../runtime/app-helper.store";

  export let visible = false;
  export let element: GridElement;

  let page = element.parent as GridPage;
  let module = page.parent as GridModule;
</script>

{#if visible && $element.elementIndex !== 255}
  <container class="pointer-events-auto">
    <div class="flex w-full h-full items-center text-center p-1 bg-overlay">
      <p
        class="max-w-md mx-auto break-words whitespace-normal truncate text-white"
        style="transform: rotate({-$appSettings.persistent.moduleRotation +
          $module?.rot * 90}deg);"
      >
        {typeof $element.name === "undefined" ? "" : $element.name}
      </p>
    </div>
  </container>
{/if}
