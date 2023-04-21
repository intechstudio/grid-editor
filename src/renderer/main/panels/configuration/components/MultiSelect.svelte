<script>
  import { configManagement } from "../Configuration.store.js";

  import {
    appActionClipboard,
    appMultiSelect,
  } from "../../../../runtime/runtime.store.js";
  import BtnAndPopUp from "../../../user-interface/BtnAndPopUp.svelte";

  import TooltipSetter from "../../../user-interface/tooltip/TooltipSetter.svelte";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";

  function multiSelectToggle() {}
</script>

<app-action-multi-select
  class=" flex items-center flex-row justify-between w-full"
>
  <!-- When any of the array elements is true -->
  <div class="w-fit flex flex-wrap">
    <BtnAndPopUp
      on:clicked={() => {
        configManagement().on_click.converttocodeblock();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        $appMultiSelect.selection.includes(true)
          ? ""
          : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-gray-500 "}
    >
      <span slot="popup">Actions merged!</span>
      <span slot="button">
        <SvgIcon iconPath={"merge_as_code"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        configManagement().on_click.cut();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        $appMultiSelect.selection.includes(true)
          ? ""
          : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-sencodary"}
    >
      <span slot="popup">Cutted!</span>
      <span slot="button">
        <SvgIcon iconPath={"cut"} />
        <TooltipSetter key={"configuration_cut_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        configManagement().on_click.copy();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        $appMultiSelect.selection.includes(true)
          ? ""
          : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-sencodary"}
    >
      <span slot="popup">Copied!</span>
      <span slot="button">
        <SvgIcon iconPath={"copy"} />
        <TooltipSetter key={"configuration_copy_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        configManagement().on_click.paste();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        $appActionClipboard.length > 0 ? "" : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-sencodary"}
    >
      <span slot="popup">Pasted!</span>
      <span slot="button">
        <SvgIcon iconPath={"paste"} />
        <TooltipSetter key={"configuration_paste_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        configManagement().on_click.remove();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-sencodary mr-2 group rounded-md ${
        $appMultiSelect.selection.includes(true)
          ? ""
          : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-sencodary "}
    >
      <span slot="popup">Removed!</span>
      <span slot="button">
        <SvgIcon iconPath={"remove"} />
        <TooltipSetter key={"configuration_remove_one"} />
      </span>
    </BtnAndPopUp>
  </div>

  <button
    on:click={() => {
      configManagement().on_click.select_all(); /* appMultiSelect.select({config: configs[index], selected: selected})*/
    }}
    class="{$appMultiSelect.all_selected
      ? 'bg-pick'
      : ''} relative flex items-center justify-center p-2 w-6 h-6 border-2 border-pick rounded-full text-white cursor-pointer text-xs"
  >
    {$appMultiSelect.all_selected ? "✔" : ""}
  </button>
</app-action-multi-select>

<style>
</style>
