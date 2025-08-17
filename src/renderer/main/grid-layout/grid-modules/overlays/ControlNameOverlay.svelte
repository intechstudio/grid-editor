<script lang="ts">
  import {
    GridModule,
    GridElement,
    GridPage,
  } from "./../../../../runtime/runtime";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { Grid } from "../../../../lib/_utils";

  interface Props {
    visible?: boolean;
    element: GridElement;
  }

  let { visible = false, element }: Props = $props();

  let page = element.parent as GridPage;
  let module = page.parent as GridModule;
</script>

{#if visible && $element.elementIndex !== 255}
  <container class="pointer-events-auto">
    <div class="flex w-full h-full items-center text-center p-1 bg-overlay">
      <p
        class="max-w-md mx-auto break-words whitespace-normal truncate text-white"
        style="transform: rotate({-$appSettings.persistent.moduleRotation +
          $module?.rot * Grid.Rotation.R90}deg);"
      >
        {typeof $element.name === "undefined" ? "" : $element.name}
      </p>
    </div>
  </container>
{/if}
