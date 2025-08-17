<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Led from "./Led.svelte";

  const dispatch = createEventDispatcher();

  interface Props {
    size?: number;
    elementNumber: any;
    position: any;
    id: any;
    color: any;
  }

  let {
    size = 1,
    elementNumber,
    position = $bindable(),
    id,
    color
  }: Props = $props();

  const knobSize = 13;

  let startValue = 0;
  let rotation = 0;
  let initRotation = 0;

  const midiToDeg = 280 / 127;

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

<div class="flex flex-col items-center">
  <Led {color} size={2.1} />

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
        class="knob-edge"
        d="M29.5 15C29.5 23.0082 23.0081 29.5 15 29.5C6.99187 29.5 0.5 23.0082 0.5 15C0.5 6.9919 6.99187 0.500031 15 0.500031C23.0081 0.500031 29.5 6.9919 29.5 15Z"
      />
      <g
        style="transform:rotate({-50 +
          Math.round(position * midiToDeg)}deg); transform-origin:center;"
      >
        <path
          class="knob-face"
          d="M27 15C27 21.6274 21.6274 27 15 27C8.37258 27 3 21.6274 3 15C3 8.37258 8.37258 3 15 3C21.6274 3 27 8.37258 27 15Z"
        />
        <path
          d="M4.84618 15H12.1863"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  </div>
</div>
