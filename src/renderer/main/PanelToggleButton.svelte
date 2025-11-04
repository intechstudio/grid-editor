<script lang="ts">
  import { SvgIcon } from "@intechstudio/grid-uikit";

  import { appSettings, splitpanes } from "../runtime/app-helper.store";

  export let target;

  let value = $splitpanes[target].size > 0;

  let direction = $splitpanes[target].direction;

  const rotationMap = { right: 0, left: 180, up: -90, down: 90 };

  function handlePanelToggle(value, target) {
    splitpanes.update((s) =>
      Object({
        ...s,
        [target]: {
          ...s[target],
          size: value ? s[target].default : 0,
        },
      }),
    );
  }

  function handleClick() {
    value = !value;

    handlePanelToggle(value, target);
  }
</script>

<button
  class="p-2 w-10 h-10 flex items-center justify-center rounded-lg rotate-90"
  style="transform: rotate({rotationMap[
    direction
  ]}deg); background-color: var(--background);"
  on:click={handleClick}
>
  <SvgIcon
    fill="var(--foreground-muted)"
    iconPath={value ? "arrow_right" : "arrow_left"}
  />
</button>
