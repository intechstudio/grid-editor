<script lang="ts">
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { tooltip } from "../../_actions/tooltip";

  export let style: string | undefined;
  export let text: string;
  export let code: string;
  export let onClick: (code: string) => void;
  export let disabled: boolean = false;

  function handleClick() {
    onClick(code);
  }
</script>

<div
  use:tooltip={{
    text: code,
    placement: "top",
  }}
>
  <MoltenPushButton {style} click={handleClick} {text} {disabled} />
</div>
