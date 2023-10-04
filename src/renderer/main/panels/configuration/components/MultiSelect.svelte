<script>
  import BtnAndPopUp from "../../../user-interface/BtnAndPopUp.svelte";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import Options from "./Options.svelte";
  import { createEventDispatcher } from "svelte";
  import { configManager } from "../Configuration.store";
  import { appActionClipboard } from "../../../../runtime/runtime.store";

  const dispatch = createEventDispatcher();

  let isSelection = false;
  let clipboardEmpty = true;

  $: clipboardEmpty = $appActionClipboard.length == 0;

  export let selectAll = undefined;

  $: {
    isSelection = typeof $configManager.find((e) => e.selected) !== "undefined";
  }

  function handleConvertToCodeBlockClicked(e) {
    dispatch("convert-to-code-block");
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
    const { value } = e.detail;
    configManager.update((s) => {
      s.forEach((e) => {
        e.selected = value;
      });
      return s;
    });
  }
</script>

<app-action-multi-select class=" flex items-center flex-row">
  <!-- When any of the array elements is true -->
  <div class="w-fit flex flex-wrap">
    <BtnAndPopUp
      on:clicked={handleConvertToCodeBlockClicked}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        !isSelection ? "hover:border-opacity-5" : "border-opacity-20"
      }`}
      popStyle={"bg-gray-500 "}
      enabled={isSelection}
      tooltipKey={"configuration_merge_as_code"}
    >
      <span slot="button">
        <SvgIcon
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"merge_as_code"}
        />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={handleCutClicked}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        !isSelection ? "hover:border-opacity-5" : "border-opacity-20"
      }`}
      popStyle={"bg-secondary"}
      enabled={isSelection}
      tooltipKey={"configuration_cut_one"}
    >
      <span slot="popup">Cutted!</span>
      <span slot="button">
        <SvgIcon
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"cut"}
        />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={handleCopyClicked}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        !isSelection ? "hover:border-opacity-5" : "border-opacity-20"
      }`}
      popStyle={"bg-sencodary"}
      enabled={isSelection}
      tooltipKey={"configuration_copy_one"}
    >
      <span slot="popup">Copied!</span>
      <span slot="button">
        <SvgIcon
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"copy"}
        />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={handlePasteClicked}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        clipboardEmpty ? "hover:border-opacity-5" : "border-opacity-20"
      }`}
      popStyle={"bg-sencodary"}
      enabled={!clipboardEmpty}
      tooltipKey={"configuration_paste_one"}
    >
      <span slot="popup">Pasted!</span>
      <span slot="button">
        <SvgIcon
          class={clipboardEmpty
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"paste"}
        />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={handleRemoveClicked}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        !isSelection ? "hover:border-opacity-5" : "border-opacity-20"
      }`}
      popStyle={"bg-sencodary"}
      enabled={isSelection}
      tooltipKey={"configuration_remove_one"}
    >
      <span slot="popup">Removed!</span>
      <span slot="button">
        <SvgIcon
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"remove"}
        />
      </span>
    </BtnAndPopUp>

    <Options on:selection-change={handleSelectAllClicked} />
  </div>
</app-action-multi-select>

<style>
</style>
