<script>
  import LogMessage from "./LogMessage.svelte";
  import { logStreamStore } from "./LogStream.store";
  import { fly } from "svelte/transition";
  import { createEventDispatcher } from "svelte";

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

<container
  id="cursor-log"
  style="z-index:9999;"
  class={$$props.class}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="flex flex-col w-[30rem]">
    {#each $logStreamStore as log, i (log)}
      <div
        in:fly|global={{ x: -10, delay: 100 + 400 * i, duration: 500 }}
        out:fly|global={{ x: 10, delay: 400 * i, duration: 500 }}
        class="log-message"
      >
        <LogMessage
          data-id={i}
          count={log.count}
          type={log.data.type}
          message={log.data.message}
          on:destroy={handleDestroy}
          on:creation={handleCreation}
          on:click={() => handleClick(i)}
        />
      </div>
    {/each}
  </div>
</container>
