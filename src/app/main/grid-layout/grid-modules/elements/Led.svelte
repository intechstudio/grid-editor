<script>

  export let size = 1;
  export let eventInput = 0;
  export let userInput;
  export let color = [255, 255, 0];
  
  let ledSize = 6;

  let alpha;

  let rgb;

  $: {color ? rgb = color : rgb = [255,255,0];}
  
  $: if(userInput !== undefined){
    alpha = userInput / 127;
  }

  $: if(eventInput !== undefined){
    alpha = eventInput / 127;
  }

</script>

<svg width={size*ledSize+'px'} height={size*ledSize+'px'}  viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="7" cy="7" r="5" fill="rgba({rgb[0]},{rgb[1]},{rgb[2]}, {alpha})"/>
  <g filter="url(#filter0_f)">
    <circle cx="7" cy="7" r="4.5" stroke="white"/>
  </g>
  <circle cx="7" cy="7" r="4.5" fill="rgba({rgb[0]},{rgb[1]},{rgb[2]}, {alpha})"/>
  <defs>
    <filter id="filter0_f" x="10%" y="10%" width={size*ledSize+'px'} height={size*ledSize+'px'} filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="1" result="effect1_foregroundBlur"/>
    </filter>
  </defs>
</svg>
