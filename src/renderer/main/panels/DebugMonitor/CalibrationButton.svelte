<script lang="ts">
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { tooltip } from "../../_actions/tooltip";

  export let style: string | undefined;
  export let text: string;
  export let code: string;
  export let tooltipKey: string | undefined = undefined;
  export let onClick: (code: string) => void;
  export let disabled: boolean = false;
  export let confirm: boolean = false;

  function handleClick() {
    onClick(code);
  }

  $: baseConfig = tooltipKey
    ? { key: tooltipKey, placement: "top" as const }
    : { text: code, placement: "top" as const };

  $: tooltipConfig = confirm
    ? {
        ...baseConfig,
        class: "w-60 p-4",
        buttons: [
          {
            label: "Cancel",
            handler: undefined,
          },
          { label: "Confirm", handler: handleClick },
        ],
        triggerEvents: ["show-buttons", "hover"],
      }
    : baseConfig;
</script>

<div use:tooltip={tooltipConfig}>
  <MoltenPushButton
    {style}
    click={confirm ? () => {} : handleClick}
    {text}
    {disabled}
  />
</div>
