<script lang="ts">
  import { run } from 'svelte/legacy';

  interface Props {
    value?: number;
    info?: string;
    color: any;
    trackColor: any;
    textColor: any;
    thickness?: string; // Thickness of stroke
    decimals?: boolean;
  }

  let {
    value = 0,
    info = "",
    color,
    trackColor,
    textColor,
    thickness = "5%",
    decimals = false
  }: Props = $props();

  let newValue = 0; // Value already validated
  let radius = $state(), xaxis = $state(), yaxis = $state(), side;
  let circle = $state(), hidCircle = $state(), btnCircle;
  let rootEle = $state();
  let rootWidth = $state(), rootHeight = $state();
  let max = 100;
  let discRadius = 80;


  function calculate() {
    newValue = (value > max ? max : value < newValue ? newValue : value) || 0;
    if (circle && hidCircle) {
      let isPercent = thickness.slice(-1) == "%";
      let breadth = parseInt(thickness) || 5;
      side = Math.min(rootWidth, rootHeight);
      let border = isPercent ? (breadth / 100) * side : breadth;

      // Discount the stroke thickness on both sides
      radius = (side - border * 2) / 2;
      xaxis = rootWidth / 2;
      yaxis = rootHeight / 2;

      // Colors
      if (color) {
        rootEle.style.setProperty("--def-circlebar-color", color);
      }
      if (trackColor) {
        rootEle.style.setProperty("--def-circlebar-track", trackColor);
      }
      if (textColor) {
        rootEle.style.setProperty("--def-circlebar-text", textColor);
      }

      // Bar graph
      let dashValue = Math.round(2 * Math.PI * radius);
      circle.style.strokeDasharray = dashValue;

      circle.style.strokeWidth = border;
      hidCircle.style.strokeWidth = border;

      // Decimals
      if (decimals) {
        newValue = Math.round((newValue + Number.EPSILON) * 100) / 100;
      } else {
        newValue = Math.round(newValue);
      }

      // Value for dashoffset
      circle.style.strokeDashoffset = dashValue - (dashValue * newValue) / 100;
    }
  }
  run(() => {
    calculate(value, rootWidth, rootHeight, circle, hidCircle);
  });
</script>

<section
  bind:clientWidth={rootWidth}
  bind:clientHeight={rootHeight}
  bind:this={rootEle}
  class="circle"
>
  <svg transform="rotate(270)">
    <circle cx={xaxis} cy={yaxis} r={radius} bind:this={hidCircle}></circle>
    <circle cx={xaxis} cy={yaxis} r={radius} {color} bind:this={circle}
    ></circle>
  </svg>
</section>

<style>
  section {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    --def-circlebar-color: #dc143c;
    --def-circlebar-track: #555;
    --def-circlebar-text: #999;
  }

  svg {
    box-sizing: border-box;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  svg > circle {
    width: 100%;
    height: 100%;
    fill: transparent;
    stroke: var(--circlebar-track, var(--def-circlebar-track));
  }

  svg > circle.btn {
    stroke-width: 0;
    fill: var(--circlebar-track, var(--def-circlebar-track));
    cursor: pointer;
  }

  svg > circle.btn.sel {
    stroke: var(--circlebar-color, var(--def-circlebar-color));
    fill: var(--circlebar-color, var(--def-circlebar-color));
  }

  svg > circle:nth-child(2) {
    stroke: var(--circlebar-color, var(--def-circlebar-color));
  }
</style>
