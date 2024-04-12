<script>
  import { createEventDispatcher } from "svelte";
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
  let displayText;

  let focus;

  function handleValueChange(value) {
    const newValue = stringManipulation.humanize(String(value));
    if (newValue !== displayText) {
      displayText = newValue;
    }
    infoValue = suggestions.find(
      (s) => String(s.value).trim() == String(value).trim()
    );

    if (typeof infoValue !== "undefined") {
      infoValue = infoValue.info;
    }

    isError = !validator(displayText);
    dispatch("validator", { isError: isError });
  }

  $: {
    handleValueChange(inputValue);
  }

  function handleBlur(e) {
    if (inputValue !== displayText) {
      sendData(displayText);
    }
  }

  function sendData(value) {
    dispatch("change", stringManipulation.shortify(value));
  }

  function handleFocus(e) {
    dispatch("focus");
    updateSuggestions();
  }

  function updateSuggestions() {
    if (typeof suggestionTarget !== "undefined") {
      const event = new CustomEvent("display", {
        detail: {
          data: suggestions,
          sender: inputComponent,
        },
      });

      suggestionTarget.dispatchEvent(event);
    }
  }

  function handleSuggestionSelected(e) {
    const { value } = e.detail;
    displayText = value;
    sendData(displayText);
  }

  let inputComponent;
</script>

<div class="{$$props.class} w-full relative">
  <input
    bind:this={inputComponent}
    {disabled}
    bind:value={displayText}
    on:focus={handleFocus}
    on:blur={handleBlur}
    on:suggestion-select={handleSuggestionSelected}
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
