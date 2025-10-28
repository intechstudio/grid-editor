<script>
  import { logStreamStore } from "./LogStream.store";
  import { fly } from "svelte/transition";
  import { createEventDispatcher } from "svelte";
  import { LogMessage } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  function handleClick(i) {
    logStreamStore.dismissLog({ index: i });
  }

  function handleMouseEnter(e) {
    logStreamStore.enableTimeout(false);
  }

  function handleMouseLeave(e) {
    logStreamStore.enableTimeout(true);
  }

  function handleCreation(e) {
    const logDOMelements = document.getElementsByClassName("log-message");
    dispatch("content-change", { DOMElementCount: logDOMelements.length });
  }

  function handleDestroy(e) {
    const logDOMelements = document.getElementsByClassName("log-message");
    logStreamStore.enableTimeout(true);
    dispatch("content-change", { DOMElementCount: logDOMelements.length });
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<container
  id="cursor-log"
  class="absolute bottom-[5rem] left-1/2 -translate-x-1/2 mb-4 z-[2]"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="flex flex-col w-[30rem]">
    {#each $logStreamStore as log, i (log)}
      <div
        in:fly|global={{ x: -10, delay: 100 + 400 * i, duration: 500 }}
        out:fly|global={{ x: 10, delay: 400 * i, duration: 500 }}
      >
        <LogMessage
          count={log.count}
          type={log.data.type}
          text={log.data.message}
          on:destroy={handleDestroy}
          on:creation={handleCreation}
          on:click={() => handleClick(i)}
        />
      </div>
    {/each}
  </div>
</container>

<style>
  container {
    border: 0px solid red;
  }
</style>
