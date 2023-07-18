<script>
  import { fly } from "svelte/transition";
  import { logStreamStore } from "./LogStream.store";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function handleClick(log) {
    logStreamStore.dismissLog(log);
  }

  function handleMouseEnter(e) {
    logStreamStore.enableTimeout(false);
  }

  function handleMouseLeave(e) {
    logStreamStore.enableTimeout(true);
  }

  $: console.log($logStreamStore.length);

  function handleOutroEnd(i) {
    const logDOMelements = document.getElementsByClassName("log-message");
    if (logDOMelements.length === 1) {
      dispatch("cleared");
    }
  }

  $: if ($logStreamStore.length > 0) {
    dispatch("incoming-log");
  }
</script>

<container
  id="cursor-log"
  style="z-index:9999;"
  class="flex mx-auto"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="flex flex-col w-[30rem]">
    {#each $logStreamStore as log, i (log)}
      <button
        class="log-message"
        in:fly={{ x: -10, delay: 100 + 400 * i, duration: 500 }}
        out:fly={{ x: 10, delay: 400 * i, duration: 500 }}
        on:click={() => handleClick(log)}
        on:outroend={() => handleOutroEnd()}
      >
        <div class="relative flex flex-row items-center">
          {#if log.count > 1}
            <div
              class="absolute -left-12 grid rounded-full w-10 h-8 bg-slate-500 content-center mr-4 text-white"
            >
              <div class="text-center">{log.count}x</div>
            </div>
          {/if}
          <div
            class="flex flex-row my-1 items-center p-2 bg-primary rounded-md border border-opacity-0 hover:border-opacity-60 border-primary-800 hover:bg-primary-700 hover:bg-opacity-80 bg-opacity-50 w-full transition-color duration-[30ms]"
          >
            <div class="px-2 py-1 bg-primary rounded mr-2 text-white">
              {log.data.type == "success"
                ? "✔️"
                : log.data.type == "alert"
                ? "⚠️"
                : log.data.type == "progress"
                ? "⏳"
                : log.data.type == "fail"
                ? "❌"
                : null}
            </div>
            <div class="w-full flex flex-col">
              <span class="text-white">{log.data.message}</span>
              <span class="text-sm text-gray-400">(Click to Dismiss!)</span>
            </div>
          </div>
        </div>
      </button>
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
