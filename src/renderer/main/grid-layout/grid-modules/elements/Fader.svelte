<script>
  import { createEventDispatcher } from "svelte";
  import Led from "./Led.svelte";

  export let elementNumber;
  export let size = 1;
  export let faderHeight = 0; // was 37 or 68
  export let position = 0;
  export let color;

  const faderWidth = 16;
</script>

<div class="flex flex-col items-center">
  <Led {color} size={2.1} />
  <div class="w-auto h-auto rounded-full mt-1">
    <svg
      data-control-number={elementNumber}
      id="fader-cap"
      width={size * faderWidth + "px"}
      height={size * faderHeight + "px"}
      viewBox="0 0 24 {faderHeight + 23}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style="overflow:visible;"
    >
      <g id="fader">
        <g id="fader-path">
          <rect
            x="9.5"
            width="5"
            height={faderHeight + 23}
            rx="2.5"
            fill="var(--foreground-disabled)"
            stroke="var(--background-soft)"
          />
        </g>
        <g
          class="fader-transform"
          style="--translate-move: {'translateY(' +
            Math.floor(
              (position * -1 + 90) *
                ((0.6 / 68) * faderHeight - (faderHeight - 37) / 700) -
                (68 - faderHeight) * 0.27 -
                (37 - faderHeight) * 0.05,
            ) +
            'px)'};"
        >
          <g id="bottom">
            <rect
              y="22"
              width="24"
              height="16"
              rx="1"
              fill="var(--background-muted)"
              stroke="var(--background-soft)"
            />
          </g>
          <path
            id="line"
            d="M3 29C2.44772 29 2 29.4477 2 30C2 30.5523 2.44772 31 3 31L3 29ZM21 31C21.5523 31 22 30.5523 22 30C22 29.4477 21.5523 29 21 29L21 31ZM3 31L21 31L21 29L3 29L3 31Z"
            fill="white"
          />
        </g>
      </g>
    </svg>
  </div>
</div>

<style>
  .fader-transform {
    transform: var(--translate-move);
    transform-origin: center;
  }
</style>
