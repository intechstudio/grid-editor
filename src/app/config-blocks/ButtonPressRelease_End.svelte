<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'bpre',
    name: 'ButtonPressRelease_End',
    rendering: 'modifier',
    category: null,
    desc: 'End',
    blockTitle: 'End',
    rounding: 'bottom',
    hiddenIcon: true,
    defaultLua: 'end',
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 277 277" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M131.429 2.92893C135.334 -0.976311 141.666 -0.976311 145.571 2.92893L274.071 131.429C277.976 135.334 277.976 141.666 274.071 145.571L145.571 274.071C141.666 277.976 135.334 277.976 131.429 274.071L2.92893 145.571C-0.976311 141.666 -0.976311 135.334 2.92893 131.429L131.429 2.92893ZM24.1421 138.5L138.5 252.858L252.858 138.5L138.5 24.1421L24.1421 138.5Z" fill="black"/>
    </svg>
    `,
    color: '#4A4AA7'
  }
</script>

<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function sendData(){
    dispatch('output', {short: information.short, script: information.defaultLua})
  }

  onMount(()=>{
    sendData();
  })

</script>




<else-block class="w-full h-fit flex flex-col text-white py-1 {information.rounding == 'top'?"rounded-tl-2xl ":""} {information.rounding == 'bottom'?"rounded-bl-2xl ":""} " style="min-height: 2.5rem; background: {information.color};">
  


</else-block>

