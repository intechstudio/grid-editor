<script>
  import { appSettings } from "../../../../runtime/app-helper.store.js";

  export let size = 1;
  export let color = [255, 255, 0];

  let rgb = [255, 255, 0];
  let alpha = 1;

  $: if (color !== undefined) {
    let maximum = Math.max(color[0], color[1], color[2]);
    alpha = (color[0] + color[1] + color[2]) / (2 * 256);

    if (alpha > 1) {
      alpha = 1;
    }

    rgb[0] = (color[0] / maximum) * 255;
    rgb[1] = (color[1] / maximum) * 255;
    rgb[2] = (color[2] / maximum) * 255;

    if (isNaN(rgb[0])) {
      rgb[0] = 150;
    }

    if (isNaN(rgb[1])) {
      rgb[1] = 150;
    }

    if (isNaN(rgb[2])) {
      rgb[2] = 150;
    }
  }

  let ledSize = 6;
</script>

<svg
  width={size * ledSize + "px"}
  height={size * ledSize + "px"}
  viewBox="0 0 14 14"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g filter="url(#filter0_f)">
    <circle
      cx="7"
      cy="7"
      r="5"
      fill="rgba({rgb[0]},{rgb[1]},{rgb[2]}, {alpha})"
    />
    <circle cx="7" cy="7" r="4.5" stroke="rgba(255,255,255,0.2)" />
  </g>

  <circle cx="7" cy="7" r="4.5" stroke="rgba(255,255,255,0.2)" />
  <circle
    cx="7"
    cy="7"
    r="4.5"
    fill="rgba({rgb[0]},{rgb[1]},{rgb[2]}, {alpha})"
  />
  <defs>
    <filter
      id="filter0_f"
      x="10%"
      y="10%"
      width={size * ledSize + "px"}
      height={size * ledSize + "px"}
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="BackgroundImageFix"
        result="shape"
      />
      <feGaussianBlur stdDeviation="1" result="effect1_foregroundBlur" />
    </filter>
  </defs>
</svg>
