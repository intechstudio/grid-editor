<script>
  import { grab } from "../event-handlers/grab.js";

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let size = 1;
  export let elementNumber;
  export let position;
  export let id;

  const knobSize = 30;

  let startValue = 0;
  let rotation = 0;
  let initRotation = 0;

  const midiToDeg = 360 / 180;

  function handleGrabStart(event) {
    startValue = event.detail.y;
  }

  function handleGrabMove(event) {
    let value = startValue + (initRotation / midiToDeg - event.detail.y);
    if (0 <= value && value <= 127) {
      rotation = Math.round(value * midiToDeg);
      position = rotation / midiToDeg;
    }
  }

  function handleGrabEnd(event) {
    initRotation = rotation;
  }
</script>

<div class="w-auto h-auto rounded-full border border-gray-800">
  <svg
    on:grabstart={handleGrabStart}
    on:grabmove={handleGrabMove}
    on:grabend={handleGrabEnd}
    data-control-number={elementNumber}
    data-module-id={id}
    width={size * knobSize + "px"}
    height={size * knobSize + "px"}
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M29.5 15C29.5 23.0082 23.0081 29.5 15 29.5C6.99187 29.5 0.5 23.0082 0.5 15C0.5 6.9919 6.99187 0.500031 15 0.500031C23.0081 0.500031 29.5 6.9919 29.5 15Z"
      fill="#323232"
      stroke="#2B2B2B"
    />
    <g
      style="transform:rotate({-50 +
        Math.round(position * midiToDeg)}deg); transform-origin:center;"
    >
      <path
        d="M27 15C27 21.6274 21.6274 27 15 27C8.37258 27 3 21.6274 3 15C3 8.37258 8.37258 3 15 3C21.6274 3 27 8.37258 27 15Z"
        fill="#373737"
      />
      <circle
        style="fill:#232323;stroke:#2c2c2c;stroke-width:0.37795276;fill-opacity:1;stroke-opacity:1;stroke-dasharray:none"
        id="path468"
        cx="5.6170802"
        cy="15"
        r="4"
      />
    </g>
  </svg>
</div>

<style>
</style>
