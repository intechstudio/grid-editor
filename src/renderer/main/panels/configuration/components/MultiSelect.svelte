<script>
  import BtnAndPopUp from "../../../user-interface/BtnAndPopUp.svelte";
  import TooltipSetter from "../../../user-interface/tooltip/TooltipSetter.svelte";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import Options from "./Options.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let enableConvert = true;
  export let enableCut = false;
  export let enableCopy = false;
  export let enablePaste = false;
  export let enableRemove = false;
  export let selectAll = undefined;

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
    dispatch("select-all", { value: value });
  }
</script>

<app-action-multi-select class=" flex items-center flex-row">
  <!-- When any of the array elements is true -->
  <div class="w-fit flex flex-wrap">
    <BtnAndPopUp
      on:clicked={handleConvertToCodeBlockClicked}
      btnStyle={`relative bg-secondary mr-2 group rounded-md`}
      popStyle={"bg-gray-500 "}
      enabled={enableConvert}
    >
      <span slot="popup">Actions merged!</span>
      <span slot="button">
        <SvgIcon displayMode="button" iconPath={"merge_as_code"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={handleCutClicked}
      btnStyle={`relative bg-secondary mr-2 group rounded-md`}
      popStyle={"bg-sencodary"}
      enabled={enableCut}
    >
      <span slot="popup">Cutted!</span>
      <span slot="button">
        <SvgIcon displayMode="button" iconPath={"cut"} />
        <TooltipSetter key={"configuration_cut_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={handleCopyClicked}
      btnStyle={`relative bg-secondary mr-2 group rounded-md`}
      popStyle={"bg-sencodary"}
      enabled={enableCopy}
    >
      <span slot="popup">Copied!</span>
      <span slot="button">
        <SvgIcon displayMode="button" iconPath={"copy"} />
        <TooltipSetter key={"configuration_copy_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={handlePasteClicked}
      btnStyle={`relative bg-secondary mr-2 group rounded-md`}
      popStyle={"bg-sencodary"}
      enabled={enablePaste}
    >
      <span slot="popup">Pasted!</span>
      <span slot="button">
        <SvgIcon displayMode="button" iconPath={"paste"} />
        <TooltipSetter key={"configuration_paste_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={handleRemoveClicked}
      btnStyle={`relative bg-secondary mr-2 group rounded-md`}
      popStyle={"bg-sencodary"}
      enabled={enableRemove}
    >
      <span slot="popup">Removed!</span>
      <span slot="button">
        <SvgIcon displayMode="button" iconPath={"remove"} />
        <TooltipSetter key={"configuration_remove_one"} />
      </span>
    </BtnAndPopUp>

    <Options
      on:selection-change={handleSelectAllClicked}
      bind:selected={selectAll}
    />
  </div>
</app-action-multi-select>

<style>
</style>
