<script>
  import { fly } from "svelte/transition";
  import { logger } from "../../../runtime/runtime.store";

  let logs = [];
  let logClearTimeout = undefined;

  $: {
    if (typeof $logger !== "undefined") {
      if (
        logs.map((l) => l.classname).includes("pagechange") &&
        $logger.classname == "strict"
      ) {
        logs = [];
      }

      clearTimeout(logClearTimeout);

      const last = logs.at(-1);
      if (
        typeof last !== "undefined" &&
        last.data.message === $logger.message
      ) {
        last.count++;
      } else {
        if (logs.length >= 6) {
          logs.shift();
        }
        logs = [
          ...logs,
          {
            data: $logger,
            count: 1,
          },
        ];
      }

      logClearTimeout = setTimeout(() => {
        logs = [];
        logger.set(undefined);
      }, 5000);
    }
  }
</script>

<div id="cursor-log" style="z-index:9999;" class="flex mx-auto">
  <div class="flex flex-col w-[30rem] px-4 py-1 text-white">
    {#each logs as log, i}
      <div
        in:fly={{ x: -10, delay: 400 * i }}
        out:fly={{ x: 10, delay: 400 * i }}
      >
        <div class="flex flex-row items-center">
          <div
            class="grid rounded-full w-10 h-8 bg-slate-500 content-center mr-4 {log.count ===
            1
              ? ' opacity-0 '
              : ''}"
          >
            <div class="text-center">{log.count}x</div>
          </div>
          <div
            class="flex flex-row my-1 items-center p-2 bg-primary bg-opacity-50 w-full"
          >
            <div class="px-2 py-1 bg-primary rounded mr-2">
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
            <div class="w-full">{log.data.message}</div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

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
