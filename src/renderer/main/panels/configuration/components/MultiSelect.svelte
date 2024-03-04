<script>
  import { setTooltip } from "./../../../user-interface/tooltip/Tooltip.ts";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import Options from "./Options.svelte";
  import { createEventDispatcher } from "svelte";
  import { configManager } from "../Configuration.store";
  import { appActionClipboard } from "../../../../runtime/runtime.store";
  import MoltenPushButton, {
    ButtonRatio,
  } from "../../preferences/MoltenPushButton.svelte";

  const dispatch = createEventDispatcher();

  let isSelection = false;
  let clipboardEmpty = true;
  let selectAllChecked = false;

  $: clipboardEmpty = $appActionClipboard.length == 0;

  $: {
    selectAllChecked =
      typeof $configManager.find((e) => !e.selected) === "undefined" &&
      $configManager.length > 0;
  }

  $: {
    isSelection = typeof $configManager.find((e) => e.selected) !== "undefined";
  }

  function handleConvertToCodeBlockClicked(e) {
    dispatch("convert-to-code-block", {
      configs: $configManager.filter((e) => e.selected),
      index: $configManager.findIndex((e) => e.selected), //First selected
    });
  }

  function handleCutClicked(e) {
    dispatch("cut");
  }

  function handleCopyClicked(e) {
    dispatch("copy");
  }

  function handlePasteClicked(e) {
    dispatch("paste", { index: undefined });
  }

  function handleRemoveClicked(e) {
    dispatch("remove");
  }

  function handleSelectAllClicked(e) {
    const allSelected =
      typeof $configManager.find((e) => e.selected == false) === "undefined";
    configManager.update((s) => {
      s.forEach((e) => {
        if (isSelection) {
          if (allSelected) {
            e.selected = false;
          } else {
            e.selected = true;
          }
        } else {
          e.selected = true;
        }
      });
      return s;
    });
  }
</script>

<app-action-multi-select class=" flex items-center flex-row">
  <!-- When any of the array elements is true -->
  <div class="w-fit flex flex-wrap flex-row gap-1">
    <div
      use:setTooltip={{
        key: "configuration_merge_as_code",
        nowrap: true,
        instant: true,
        placement: "top",
        class: "px-2 py-1",
      }}
    >
      <MoltenPushButton
        on:click={handleConvertToCodeBlockClicked}
        disabled={!isSelection}
        ratio={ButtonRatio.BOX}
      >
        <SvgIcon
          slot="content"
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"merge_as_code"}
        />
      </MoltenPushButton>
    </div>

    <div
      use:setTooltip={{
        key: "configuration_cut_one",
        nowrap: true,
        instant: true,
        placement: "top",
        class: "px-2 py-1",
      }}
    >
      <MoltenPushButton
        on:click={handleCutClicked}
        disabled={!isSelection}
        ratio={ButtonRatio.BOX}
      >
        <SvgIcon
          slot="content"
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"cut"}
        />
      </MoltenPushButton>
    </div>

    <div
      use:setTooltip={{
        key: "configuration_copy_one",
        nowrap: true,
        instant: true,
        placement: "top",
        class: "px-2 py-1",
      }}
    >
      <MoltenPushButton
        on:click={handleCopyClicked}
        disabled={!isSelection}
        ratio={ButtonRatio.BOX}
      >
        <SvgIcon
          slot="content"
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"copy"}
        />
      </MoltenPushButton>
    </div>

    <div
      use:setTooltip={{
        key: "configuration_paste_one",
        nowrap: true,
        instant: true,
        placement: "top",
        class: "px-2 py-1",
      }}
    >
      <MoltenPushButton
        on:click={handlePasteClicked}
        disabled={clipboardEmpty}
        ratio={ButtonRatio.BOX}
      >
        <SvgIcon
          slot="content"
          class={clipboardEmpty
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"paste"}
        />
      </MoltenPushButton>
    </div>

    <div
      use:setTooltip={{
        key: "configuration_remove_one",
        nowrap: true,
        instant: true,
        placement: "top",
        class: "px-2 py-1",
      }}
    >
      <MoltenPushButton
        on:click={handleRemoveClicked}
        disabled={!isSelection}
        ratio={ButtonRatio.BOX}
      >
        <SvgIcon
          slot="content"
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"remove"}
        />
      </MoltenPushButton>
    </div>

    <Options
      bind:selected={selectAllChecked}
      on:selection-change={handleSelectAllClicked}
    />
  </div>
</app-action-multi-select>

<style>
</style>
