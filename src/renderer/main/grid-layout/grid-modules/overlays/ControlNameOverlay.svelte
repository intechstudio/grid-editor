<script lang="ts">
  import {
    GridModule,
    GridElement,
    GridPage,
    GridRuntime,
  } from "./../../../../runtime/runtime";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { Grid } from "../../../../lib/_utils";

  export let visible = false;
  export let element: GridElement;

  let page = element.parent as GridPage;
  let module = page.parent as GridModule;
  $: runtime = module?.parent as GridRuntime;

  $: totalRotation = Grid.addRotations(
    $appSettings.persistent.moduleRotation,
    $runtime?.rotation ?? 0,
  );
</script>

{#if visible && $element.elementIndex !== 255}
  <container class="pointer-events-auto">
    <div
      class="control-name-overlay-bg flex w-full h-full items-center text-center p-1"
    >
      <p
        class="max-w-md mx-auto break-words whitespace-normal truncate"
        style="color: var(--foreground); transform: rotate({-totalRotation +
          $module?.rot * Grid.Rotation.R90}deg);"
      >
        {typeof $element.name === "undefined" ? "" : $element.name}
      </p>
    </div>
  </container>
{/if}

<style>
  .control-name-overlay-bg {
    background-color: var(--overlay-bg);
  }
</style>
