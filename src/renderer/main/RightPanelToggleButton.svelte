<script>
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { appSettings, splitpanes } from "../runtime/app-helper.store";

  function toggleRightTab() {
    // Update store and global variables
    $appSettings.rightPanelVisible = !$appSettings.rightPanelVisible;
    splitpanes.update((store) => {
      store.right.size =
        $appSettings.rightPanelVisible == true ? store.right.default : 0;
      return store;
    });
  }
</script>

<right-panel-toggle class="absolute w-full h-full">
  <div class="w-12 h-12 float-right flex items-center justify-center">
    <button class="z-50" on:click={toggleRightTab}>
      <div class="p-2 bg-primary rounded-lg">
        <SvgIcon
          fill="#FFF"
          iconPath={$appSettings.rightPanelVisible
            ? "arrow_right"
            : "arrow_left"}
        />
      </div>
    </button>
  </div>
</right-panel-toggle>
