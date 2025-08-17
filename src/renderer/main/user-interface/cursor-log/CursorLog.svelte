<script lang="ts">
  import LogMessage from "./LogMessage.svelte";
  import { logStreamStore } from "./LogStream.store";
  import { fly } from "svelte/transition";
  import { createEventDispatcher } from "svelte";
  interface Props {
    [key: string]: any
  }

  let { ...props }: Props = $props();

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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<container
  id="cursor-log"
  class={props.class}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  <div class="flex flex-col w-[30rem]">
    {#each $logStreamStore as log, i (log)}
      <div
        in:fly|global={{ x: -10, delay: 100 + 400 * i, duration: 500 }}
        out:fly|global={{ x: 10, delay: 400 * i, duration: 500 }}
        class="log-message"
      >
        <LogMessage
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
