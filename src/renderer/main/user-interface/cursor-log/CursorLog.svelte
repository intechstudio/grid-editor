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
  class="flex mx-auto bg-red-300"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="flex flex-col w-[30rem]">
    {#each $logStreamStore as log, i (log)}
      <div
        in:fly={{ x: -10, delay: 100 + 400 * i, duration: 500 }}
        out:fly={{ x: 10, delay: 400 * i, duration: 500 }}
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

<style>
  @keyframes blink {
    /**
      * At the start of the animation the dot
      * has an opacity of .2
      */
    0% {
      opacity: 0.2;
    }
    /**
      * At 20% the dot is fully visible and
      * then fades out slowly
      */
    20% {
      opacity: 1;
    }
    /**
      * Until it reaches an opacity of .2 and
      * the animation can start again
      */
    100% {
      opacity: 0.2;
    }
  }

  .calculating span {
    /**
        * Use the blink animation, which is defined above
        */
    animation-name: blink;
    /**
        * The animation should take 1.4 seconds
        */
    animation-duration: 1.4s;
    /**
        * It will repeat itself forever
        */
    animation-iteration-count: infinite;
    /**
        * This makes sure that the starting style (opacity: .2)
        * of the animation is applied before the animation starts.
        * Otherwise we would see a short flash or would have
        * to set the default styling of the dots to the same
        * as the animation. Same applies for the ending styles.
        */
    animation-fill-mode: both;
  }

  .calculating span:nth-child(2) {
    /**
        * Starts the animation of the third dot
        * with a delay of .2s, otherwise all dots
        * would animate at the same time
        */
    animation-delay: 0.2s;
  }

  .calculating span:nth-child(3) {
    /**
        * Starts the animation of the third dot
        * with a delay of .4s, otherwise all dots
        * would animate at the same time
        */
    animation-delay: 0.4s;
  }
</style>
