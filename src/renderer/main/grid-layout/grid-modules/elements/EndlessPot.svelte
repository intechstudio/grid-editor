<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  interface Props {
    size?: number;
    elementNumber: any;
    position: any;
    id: any;
  }

  let {
    size = 1,
    elementNumber,
    position = $bindable(),
    id
  }: Props = $props();

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

<div class="knob-element">
  <svg
    ongrabstart={handleGrabStart}
    ongrabmove={handleGrabMove}
    ongrabend={handleGrabEnd}
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
      class="knob-edge"
    />
    <g
      style="transform:rotate({-50 +
        Math.round(position * midiToDeg)}deg); transform-origin:center;"
    >
      <path
        d="M27 15C27 21.6274 21.6274 27 15 27C8.37258 27 3 21.6274 3 15C3 8.37258 8.37258 3 15 3C21.6274 3 27 8.37258 27 15Z"
        class="knob-face"
      />
      <circle
        class="knob-dent"
        style="stroke-width:0.67795276;fill-opacity:1;stroke-opacity:1;stroke-dasharray:none"
        id="path468"
        cx="5.6170802"
        cy="15"
        r="4"
      />
    </g>
  </svg>
</div>
