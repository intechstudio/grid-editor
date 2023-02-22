<script>
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
  }

  let ledSize = 6;
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  version="1.1"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:svgjs="http://svgjs.dev/svgjs"
  viewBox="0 0 800 800"
  opacity="1"
  ><defs
    ><filter
      id="nnneon-filter"
      x="-100%"
      y="-100%"
      width="400%"
      height="400%"
      filterUnits="objectBoundingBox"
      primitiveUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feGaussianBlur
        stdDeviation="17 8"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        in="SourceGraphic"
        edgeMode="none"
        result="blur"
      /></filter
    ><filter
      id="nnneon-filter2"
      x="-100%"
      y="-100%"
      width="400%"
      height="400%"
      filterUnits="objectBoundingBox"
      primitiveUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feGaussianBlur
        stdDeviation="10 17"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        in="SourceGraphic"
        edgeMode="none"
        result="blur"
      /></filter
    ></defs
  >

  <g
    stroke-width="16"
    stroke="rgba({rgb[0]},{rgb[1]},{rgb[2]}, {alpha})"
    fill="none"
    ><circle r="150" cx="400" cy="400" filter="url(#nnneon-filter)" /><circle
      fill="rgba({rgb[0]},{rgb[1]},{rgb[2]}, {alpha})"
      r="161"
      cx="412"
      cy="400"
      filter="url(#nnneon-filter2)"
      opacity="0.9"
    /><circle
      fill="rgba({rgb[0]},{rgb[1]},{rgb[2]}, {alpha})"
      r="161"
      cx="388"
      cy="400"
      filter="url(#nnneon-filter2)"
      opacity="0.9"
    /><circle r="150" cx="400" cy="400" /></g
  ></svg
>

<!-- <svg
  width={size * ledSize + "px"}
  height={size * ledSize + "px"}
  viewBox="0 0 14 14"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g filter="url(#filter0_f) ">
    <circle
      cx="7"
      cy="7"
      r="5"
      fill="rgba({rgb[0]},{rgb[1]},{rgb[2]}, {alpha})"
    />
    <circle
      filter="blur(10px)"
      cx="7"
      cy="7"
      r="4.5"
      stroke="rgba(255,255,255,0.2)"
    />
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
 -->
