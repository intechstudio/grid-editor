<script>
  import { configManagement } from "../Configuration.store.js";

  import {
    appActionClipboard,
    appMultiSelect,
  } from "../../../../runtime/runtime.store.js";
  import BtnAndPopUp from "../../../user-interface/BtnAndPopUp.svelte";

  import TooltipSetter from "../../../user-interface/tooltip/TooltipSetter.svelte";

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
      btnStyle={`relative bg-gray-500 hover:bg-gray-600 mr-2 rounded-full ${
        $appMultiSelect.selection.includes(true)
          ? ""
          : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-gray-500 "}
    >
      <span slot="popup">Actions merged!</span>
      <span slot="button">
        <span>Merge as Code</span>
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        configManagement().on_click.cut();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-yellow-500 hover:bg-yellow-600 mr-2 rounded-full ${
        $appMultiSelect.selection.includes(true)
          ? ""
          : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-yellow-500 "}
    >
      <span slot="popup">Cutted!</span>
      <span slot="button">
        <span>Cut</span>
        <TooltipSetter key={"configuration_cut_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        configManagement().on_click.copy();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-pick hover:bg-pick-saturate-10 mr-2 rounded-full ${
        $appMultiSelect.selection.includes(true)
          ? ""
          : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-pick "}
    >
      <span slot="popup">Copied!</span>
      <span slot="button">
        <span>Copy</span>
        <TooltipSetter key={"configuration_copy_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        configManagement().on_click.paste();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-purple-500 hover:bg-purple-600 mr-2 rounded-full ${
        $appActionClipboard.length > 0 ? "" : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-purple-500 "}
    >
      <span slot="popup">Pasted!</span>
      <span slot="button">
        <span>Paste</span>
        <TooltipSetter key={"configuration_paste_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        configManagement().on_click.remove();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-red-500 hover:bg-red-600 mr-2 rounded-full ${
        $appMultiSelect.selection.includes(true)
          ? ""
          : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-red-500 "}
    >
      <span slot="popup">Removed!</span>
      <span slot="button">
        <span>Remove</span>
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
