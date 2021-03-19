<script>
  export let index;
  export let drag_start;
  export let drop_target;
  export let animation;
// pointer-events-none  {dragstart ? 'block' : 'hidden'} 
// class:pointer-events-none="{dragstart}"
</script>

<drop-zone id="dz-{index}" class="block select-none focus:outline-none border-none outline-none">
  <div class="{(drop_target == index && drag_start) && !animation ? 'opacity-100 ' : 'opacity-0 '} h-5 w-full pointer-events-none transition-opacity duration-300 flex items-center">
    <div class="h-2 w-full rounded-full bg-green-500"></div>
  </div>
</drop-zone>
