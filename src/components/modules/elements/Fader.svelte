<script>
  import { grab } from '../event-handlers/grab.js';

  export let size = 1;
  const faderWidth = 25.5;
  const faderHeight = 37;

  let move;
  let startValue;
  let initMove = 0;

  let startSVG;
  let endSVG = 0;
  let svgMove;

  $:range = faderHeight*size;

  function handleGrabStart(event){
    var coord = getMousePosition(event);
    startValue = coord.y;
  }

  function handleGrabMove(event){
    var coord = getMousePosition(event);
    let value = (startValue - (initMove +coord.y)) * -1;
    if(-22 <= value && value <= 22){
      move = value;
    }
  }

  function handleGrabEnd(event){
    initMove = move;
  }

  function getMousePosition(evt) {
    var CTM = evt.srcElement.getScreenCTM();
    return {
      x: (evt.detail.x - CTM.e) / CTM.a,
      y: (evt.detail.y - CTM.f) / CTM.d
    };
  }

</script>

<svg 
    use:grab
    on:grabstart={handleGrabStart}
    on:grabmove={handleGrabMove}
    on:grabend={handleGrabEnd}
    id="fader-cap" 
    width={size * faderWidth + 'px'} 
    height={size * faderHeight + 'px'} 
    viewBox="0 0 24 60" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style="overflow:visible;">
  <g id="fader">
    <g id="fader-path" filter="url(#filter0_i)">
      <rect x="9" width="6" height="60" rx="3" fill="white"/>
    </g>
    <g 
    
    style="transform:translateY({move}px)">
      <g id="bottom" filter="url(#filter1_i)">
        <rect y="22" width="24" height="16" rx="1" fill="#323232"/>
      </g>
      <g id="top" filter="url(#filter2_i)">
        <rect x="1.5" y="26" width="21" height="8" rx="0.5" fill="url(#paint0_linear)"/>
      </g>
        <path id="line" d="M3 29C2.44772 29 2 29.4477 2 30C2 30.5523 2.44772 31 3 31L3 29ZM21 31C21.5523 31 22 30.5523 22 30C22 29.4477 21.5523 29 21 29L21 31ZM3 31L21 31L21 29L3 29L3 31Z" fill="white"/>
      </g>
    </g>
  <defs>
    <filter id="filter0_i" x="9" y="-4" width="8" height="64" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="2" dy="-4"/>
      <feGaussianBlur stdDeviation="2"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
    </filter>
    <filter id="filter1_i" x="0" y="20" width="24" height="18" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="-2"/>
      <feGaussianBlur stdDeviation="2"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/>
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
    </filter>
    <filter id="filter2_i" x="1.5" y="24" width="21" height="10" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="-2"/>
      <feGaussianBlur stdDeviation="2"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
    </filter>
    <linearGradient id="paint0_linear" x1="12" y1="26" x2="12" y2="34" gradientUnits="userSpaceOnUse">
      <stop stop-color="#373737"/>
      <stop offset="1" stop-color="#373737" stop-opacity="0"/>
    </linearGradient>
  </defs>
</svg>

