<script>
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";
  import stringManipulation from "../../main/user-interface/_string-operations.js";

  const dispatch = createEventDispatcher();

  export let inputValue = "";
  export let suggestions = [];
  export let customClasses = "";
  export let placeholder = "";
  export let suggestionTarget = undefined;
  export let validator = () => {
    return true;
  };

  let isError = false;
  let disabled = false;
  let infoValue = "";
  let text;

  $: handleTextChange(text);

  let focus;

  function handleTextChange(value) {
    handleValidation(value);
    infoValue = suggestions.find(
      (s) => String(s.value).trim() == String(value).trim()
    );
    infoValue ? (infoValue = infoValue.info) : "";
  }

  function handleInputvaluechange(value) {
    text = stringManipulation.humanize(value);
    handleValidation(text);
  }

  onMount(() => {
    handleInputvaluechange(inputValue);
  });

  function handleValidation() {
    isError = !validator(text);
    dispatch("validator", { isError: isError });
  }

  function handleBlur(e) {
    if (typeof suggestionTarget !== "undefined") {
      const event = new CustomEvent("target-blur");
      suggestionTarget.dispatchEvent(event);
    }

    dispatch("blur");
    if (input) {
      input = false;
      const short = stringManipulation.shortify(inputValue);
      console.log(short);
      dispatch("change", short);
    }
  }

  function handleFocus(e) {
    suggestionTarget.dispatchEvent(new CustomEvent("focus"));
    dispatch("focus", this);
    const event = new CustomEvent("display", {
      detail: {
        data: suggestions,
      },
    });

    suggestionTarget.dispatchEvent(event);
  }

  let input = false;
  function handleInput(e) {
    input = true;
    handleValidation(text);
  }
</script>

<div class="{$$props.class} w-full relative">
  <input
    {disabled}
    bind:value={inputValue}
    on:focus={handleFocus}
    on:blur={handleBlur}
    on:input={handleInput}
    type="text"
    {placeholder}
    class="{customClasses} w-full border
      focus:neumorph focus:rounded-lg
      {isError
      ? 'border-error focus:outline-error'
      : 'focus:border-select border-secondary'} bg-secondary text-white py-0.5 pl-2 rounded-none"
  />

  <div class=" py-1">
    {#if !focus && infoValue !== undefined}
      <div class="{infoValue ? 'text-gray-500' : 'text-gray-600'} text-sm">
        {infoValue}
      </div>
    {/if}
  </div>
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
