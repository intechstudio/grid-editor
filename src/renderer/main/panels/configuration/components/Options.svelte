<script>
  import { appMultiSelect } from "../../../../runtime/runtime.store.js";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";

  export let index;
  export let rendering;
  export let configs;
  export let componentName;

  export let toggle;

  let showSelectBox = true;
  let ifHeight = 0;

  $: if (configs.length) {
    showSelectBox = ifBlockCheck(configs);
  }

  function ifBlockCheck(configs) {
    let notInBlock = true;
    // lookbefore
    const lookbefore = configs.slice(0, index).reverse();

    const if_index = lookbefore.findIndex((a) =>
      a.information.name.endsWith("_If")
    );
    const end_index = lookbefore.findIndex((a) =>
      a.information.name.endsWith("_End")
    );

    if (if_index !== -1 && end_index !== -1) {
      if (if_index < end_index) {
        //console.log(index, " - ",  component, '<- this is in IF block')
        notInBlock = false;
      }
    }

    if (if_index !== -1 && end_index == -1) {
      //console.log(index, " - ",  component, '<- this is in IF block')
      notInBlock = false;
    }

    return notInBlock;
  }

  function handleMultiSelect() {
    // called only on IF component

    const _configs = configs.slice(index);
    const _configs_length = _configs.length;

    let arr = [];
    let stack = [];
    let current;

    let skipSelection = false;

    for (let i = 0; i < _configs_length; i++) {
      if (!skipSelection) {
        current = _configs[i].information.name; //easier than writing it over and over
        if (current.endsWith("_If")) {
          stack.push(current);
        } else if (current.endsWith("_End")) {
          const lastBracket = stack.pop();
          if (lastBracket !== current.split("_")[0] + "_If") {
            //if the stack is empty, .pop() returns undefined, so this expression is still correct
            return false; //terminate immediately - no need to continue scanning the string
          }
        }

        arr.push(_configs[i]);

        if (stack.length == 0 && current.endsWith("_End")) {
          skipSelection = true;
        }
      }
    }

    const selection_length = arr.length + index;

    for (let i = index; i < selection_length; i++) {
      $appMultiSelect.selection[i] = !$appMultiSelect.selection[i];
    }
  }
</script>

{#if (rendering == "standard" || rendering == "fixed") && true}
  <select-box class="flex pl-2 justify-center items-center bg-transparent">
    <button
      on:click={() => {
        $appMultiSelect.selection[index] = !$appMultiSelect.selection[index];
      }}
      class="{$appMultiSelect.selection[index]
        ? ' border-opacity-80 bg-secondary'
        : ''} {!$appMultiSelect.selection[index]
        ? 'h-[18px] w-[18px] border-opacity-20 hover:border-opacity-100'
        : ''} cursor-pointer border-white justify-center border transition-opacity rounded-md"
    >
      {#if $appMultiSelect.selection[index]}
        <SvgIcon
          displayMode="button"
          class="h-[16px] w-[16px]"
          activeState={$appMultiSelect.selection[index]}
          iconPath={"tick"}
        />
      {/if}
    </button>
  </select-box>
{:else if componentName.endsWith("_If") && showSelectBox}
  <select-box class="flex pl-2 justify-center items-center bg-transparent">
    <button
      on:click={() => {
        handleMultiSelect();
      }}
      class="{$appMultiSelect.selection[index]
        ? 'border-opacity-80 bg-pink-600'
        : ''}  {!$appMultiSelect.selection[index]
        ? 'h-[18px] w-[18px] opacity-50 hover:opacity-100'
        : ''} cursor-pointer border-pink-600 justify-center border transition-opacity rounded-md"
    >
      {#if $appMultiSelect.selection[index]}
        <SvgIcon
          displayMode="button"
          class="h-[16px] w-[16px]"
          activeState={$appMultiSelect.selection[index]}
          iconPath={"tick"}
        />
      {/if}
    </button>
  </select-box>
{:else}
  <select-box
    class="flex pl-2 justify-center items-center bg-transparent pointer-events-none"
  >
    {#if true}
      <div
        class="{$appMultiSelect.selection[index]
          ? 'border-opacity-80 bg-pink-600'
          : 'h-[18px] w-[18px] border-opacity-30'} cursor-pointer border-pink-600 justify-center border transition-opacity rounded-md"
      >
        {#if $appMultiSelect.selection[index]}
          <SvgIcon
            displayMode="button"
            class="h-[16px] w-[16px]"
            activeState={$appMultiSelect.selection[index]}
            iconPath={"tick"}
          />
        {/if}
      </div>
    {:else}
      <div
        class=" flex items-center justify-center p-2 w-6 h-6 rounded-full text-white text-xs"
      >
        {""}
      </div>
    {/if}
  </select-box>
{/if}
