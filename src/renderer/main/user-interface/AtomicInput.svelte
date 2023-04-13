<script>
  import { clickOutside } from "../_actions/click-outside.action.js";

  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";

  const dispatch = createEventDispatcher();

  export let inputValue = "";
  export let suggestions = [];
  export let customClasses = "";
  export let placeholder = "";
  export let validator = () => {
    return true;
  };

  let isError = false;
  let edited = false;

  let disabled = false;
  let infoValue = "";

  $: if (inputValue) {
    infoValue = suggestions.find(
      (s) => String(s.value).trim() == String(inputValue).trim()
    );
    infoValue ? (infoValue = infoValue.info) : "";
  }

  let focus;

  onMount(() => {
    handleValidation();
  });

  function handleValidation() {
    isError = !validator(inputValue);
    dispatch("validator", { isError: isError });
  }

  function handleChange() {
    handleValidation();
    dispatch("change", inputValue);
  }

  function handleFocus(mode, bool) {
    focus = bool;
    dispatch(`${mode}-focus`, {
      focus: bool,
    });
  }
</script>

<div
  class="w-full relative"
  use:clickOutside={{ useCapture: false }}
  on:click-outside={() => {
    focus = false;
    handleFocus("loose", false);
  }}
>
  <input
    {disabled}
    bind:value={inputValue}
    on:click={() => {
      handleFocus("active", true);
    }}
    on:change={handleChange}
    on:input={(e) => {
      handleChange();
      handleFocus("loose", false);
    }}
    type="text"
    {placeholder}
    class="{customClasses} w-full border
      focus:neumorph focus:rounded-lg
      {isError
      ? 'border-error focus:outline-error'
      : 'focus:border-select border-secondary'} bg-secondary text-white py-0.5 pl-2 rounded-none"
  />

  {#if !focus && infoValue !== undefined}
    <div class="{infoValue ? 'text-gray-500' : 'text-gray-600'} text-sm py-1">
      {infoValue}
    </div>
  {/if}
</div>

<style>
  .neumorph {
    box-shadow: -2px -2px 10px #242c30, 2px 2px 10px #303c42;
  }

  ::-webkit-scrollbar {
    border-radius: 8px;
    height: 6px;
    width: 6px;
    background: #1e2628;
  }

  ::-webkit-scrollbar-thumb {
    background: #286787;
    border-radius: 8px;
    -webkit-box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }

  ::-webkit-scrollbar-corner {
    border-radius: 8px;
    background: #1e2628;
  }
</style>
