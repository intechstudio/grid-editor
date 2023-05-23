<script>
  import { ConfigManager } from "../Configuration.store.js";

  import {
    appActionClipboard,
    appMultiSelect,
  } from "../../../../runtime/runtime.store.js";
  import BtnAndPopUp from "../../../user-interface/BtnAndPopUp.svelte";

  import TooltipSetter from "../../../user-interface/tooltip/TooltipSetter.svelte";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";

  function multiSelectToggle() {}
</script>

<app-action-multi-select class=" flex items-center flex-row">
  <!-- When any of the array elements is true -->
  <div class="w-fit flex flex-wrap">
    <BtnAndPopUp
      on:clicked={() => {
        const list = new ConfigManager();
        list.converttocodeblock();
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
        <SvgIcon displayMode="button" iconPath={"merge_as_code"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        const list = new ConfigManager();
        list.cut();
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
        <SvgIcon displayMode="button" iconPath={"cut"} />
        <TooltipSetter key={"configuration_cut_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        const list = new ConfigManager();
        list.copy();
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
        <SvgIcon displayMode="button" iconPath={"copy"} />
        <TooltipSetter key={"configuration_copy_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        const list = new ConfigManager();
        list.paste();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        $appActionClipboard.length > 0 ? "" : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-sencodary"}
    >
      <span slot="popup">Pasted!</span>
      <span slot="button">
        <SvgIcon displayMode="button" iconPath={"paste"} />
        <TooltipSetter key={"configuration_paste_one"} />
      </span>
    </BtnAndPopUp>

    <BtnAndPopUp
      on:clicked={() => {
        const list = new ConfigManager();
        list.remove();
        appMultiSelect.reset();
      }}
      btnStyle={`relative bg-secondary mr-2 group rounded-md ${
        $appMultiSelect.selection.includes(true)
          ? ""
          : "opacity-50 pointer-events-none"
      }`}
      popStyle={"bg-sencodary"}
    >
      <span slot="popup">Removed!</span>
      <span slot="button">
        <SvgIcon displayMode="button" iconPath={"remove"} />
        <TooltipSetter key={"configuration_remove_one"} />
      </span>
    </BtnAndPopUp>
  </div>

  <button
    on:click={() => {
      const list = new ConfigManager();
      list.select_all(); /* appMultiSelect.select({config: configs[index], selected: selected})*/
    }}
    class="{$appMultiSelect.all_selected
      ? 'border-opacity-80 bg-secondary'
      : 'h-[18px] w-[18px]'} border border-white border-opacity-20 hover:border-opacity-80 rounded-md text-white cursor-pointer hover:bg-secondary"
  >
    {#if $appMultiSelect.all_selected}
      <SvgIcon
        displayMode="button"
        class="h-[16px] w-[16px]"
        activeState={$appMultiSelect.all_selected}
        iconPath={"tick"}
      />
    {/if}
  </button>
</app-action-multi-select>

<style>
</style>
