<script>
  import { clickOutside } from "../_actions/click-outside.action";

  export let component = undefined;

  let suggestions = [];

  let target = undefined;

  function handleDisplay(e) {
    const { data, sender } = e.detail;
    target = sender;
    console.log("receive", data);
    suggestions = data;
  }

  function handleClickOutside(e) {
    suggestions = [];
  }

  function handleSuggestionSelected(value) {
    const event = new CustomEvent("suggestion-select", {
      detail: {
        value: value,
      },
    });
    target.dispatchEvent(event);
    suggestions = [];
  }
</script>

<suggestions
  class="flex w-full p-2"
  class:hidden={suggestions.length === 0}
  bind:this={component}
  on:display={handleDisplay}
  use:clickOutside={{ useCapture: false }}
  on:click-outside={handleClickOutside}
>
  <div class="w-full p-1 neumorph rounded-lg border border-select bg-secondary">
    <ul
      class="scrollbar max-h-40 overflow-y-scroll pr-1 text-white cursor-pointer"
    >
      {#each suggestions as suggestion}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <li
          on:click={() => handleSuggestionSelected(suggestion.value)}
          class="hover:bg-black p-1 pl-2"
        >
          {suggestion.info}
        </li>
      {/each}
    </ul>
  </div>
</suggestions>

<style>
  .neumorph {
    box-shadow: -2px -2px 10px #242c30, 2px 2px 10px #303c42;
  }
</style>
