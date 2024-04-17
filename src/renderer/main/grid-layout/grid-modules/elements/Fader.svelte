<script>
  import { grab } from "../event-handlers/grab.js";

  import { createEventDispatcher } from "svelte";

  export let elementNumber;
  export let size = 1;
  export let rotation = 0;

  const faderWidth = 16;

  export let faderHeight = 0; // was 37 or 68

  export let position = 0;
  export let id;

  let move = 0;
  let startValue = 0;
  let initMove = 0;

  let startSVG;
  let endSVG = 0;
  let svgMove;

  $: range = faderHeight * size;

  const rotMode = (rotation) => {
    rotation == undefined ? (rotation = 0) : null;
    let rot;
    rotation == 1 || rotation == 3 ? (rot = "X") : (rot = "Y");
    return rot;
  };

  const inverse = () => {
    let _inverse = -1;
    rotation == 1 || rotation == 2 ? (_inverse = 1) : (_inverse = -1);
    return _inverse;
  };

  function handleGrabStart(event) {
    var coord = getMousePosition(event);
    const rot = rotMode(rotation).toLowerCase();
    startValue = coord[rot];
  }

  // with all these functions, this could be much more performant.
  function handleGrabMove(event) {
    return;
    var coord = getMousePosition(event);
    const rot = rotMode(rotation).toLowerCase();
    let value = (startValue - (initMove + coord[rot])) * inverse();

    if (value < -((22 / faderHeight) * 37)) {
      value = -((22 / faderHeight) * 37);
    }
    if (value > (22 / faderHeight) * 37) {
      value = (22 / faderHeight) * 37;
    }

    move = value;
    position = move * -1;
  }

  function handleGrabEnd(event) {
    initMove = move;
  }

  function getMousePosition(evt) {
    var BCR = evt.srcElement.getBoundingClientRect();
    return {
      x: evt.detail.x - BCR.x,
      y: evt.detail.y - BCR.y,
    };
  }

  /*
    // CTM does not work on rotated svgs.
    var CTM = evt.srcElement.getScreenCTM(); 
    return {
      x: (evt.detail.x - CTM.e) / CTM.a,
      y: (evt.detail.y - CTM.f) / CTM.d
    };  
    */
</script>

<div class="w-auto h-auto rounded-full">
  <svg
    use:grab
    on:grabstart={handleGrabStart}
    on:grabmove={handleGrabMove}
    on:grabend={handleGrabEnd}
    data-control-number={elementNumber}
    data-module-id={id}
    id="fader-cap"
    width={size * faderWidth + "px"}
    height={size * faderHeight + "px"}
    viewBox="0 0 24 {faderHeight + 23}"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style="overflow:visible;"
  >
    <g id="fader">
      <g id="fader-path" filter="url(#filter0_i)">
        <rect x="9" width="6" height={faderHeight + 23} rx="3" fill="white" />
      </g>
      <g
        class="fader-transform"
        style="--translate-move: {'translateY(' +
          Math.floor(
            (position * -1 + 90) *
              ((0.6 / 68) * faderHeight - (faderHeight - 37) / 700) -
              (68 - faderHeight) * 0.27 -
              (37 - faderHeight) * 0.05
          ) +
          'px)'};"
      >
        <g id="bottom" filter="url(#filter1_i)">
          <rect y="22" width="24" height="16" rx="1" fill="#323232" />
        </g>
        <g id="top" filter="url(#filter2_i)">
          <rect
            x="1.5"
            y="26"
            width="21"
            height="8"
            rx="0.5"
            fill="url(#paint0_linear)"
          />
        </g>
        <path
          id="line"
          d="M3 29C2.44772 29 2 29.4477 2 30C2 30.5523 2.44772 31 3 31L3 29ZM21 31C21.5523 31 22 30.5523 22 30C22 29.4477 21.5523 29 21 29L21 31ZM3 31L21 31L21 29L3 29L3 31Z"
          fill="white"
        />
      </g>
    </g>
    <defs>
      <!-- Previously used value for height instead of 1000: faderHeight + 23 + 4 -->
      <!-- This was causing a visual bug when PBF4 as host, and EF44 was connected -->
      <filter
        id="filter0_i"
        x="9"
        y="-4"
        width="8"
        height={1000}
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
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="2" dy="-4" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <filter
        id="filter1_i"
        x="0"
        y="20"
        width="24"
        height="18"
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
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="-2" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
        />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <filter
        id="filter2_i"
        x="1.5"
        y="24"
        width="21"
        height="10"
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
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="-2" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </filter>
      <linearGradient
        id="paint0_linear"
        x1="12"
        y1="26"
        x2="12"
        y2="34"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#373737" />
        <stop offset="1" stop-color="#373737" stop-opacity="0" />
      </linearGradient>
    </defs>
  </svg>
</div>

<style>
  .fader-transform {
    transform: var(--translate-move);
    transform-origin: center;
  }
</style>
