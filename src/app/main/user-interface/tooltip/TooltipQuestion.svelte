<script>

  import TooltipSetter from "./TooltipSetter.svelte"

  export let key = '';
  export let mode = 0;

</script>




<div class="w-6 h-6 mx-2 cursor-pointer relative rounded-full bg-secondary text-center text-xs flex items-center justify-center hover:text-important p-1">
  ?

  <TooltipSetter key={key}/>


</div>