<script>
  export let index;
  export let drag_start;
  export let drop_target;
  export let drag_target;
  export let animation;
  export let action_id;

  import { dropStore, runtime } from '../action-preferences.store.js';
// pointer-events-none  {dragstart ? 'block' : 'hidden'} 
// class:pointer-events-none="{dragstart}"


  let dropZoneEnabled = true;
  $: if(action_id && drag_target.length > 0){
    let found = drag_target.find(id => Number(id) == action_id);
    const dragged = $runtime.find(a => a.id == Number(drag_target[0]));
    const _index = $runtime.findIndex(a => a.id == Number(drag_target[0]));

    if(!found){
      if(_index - 1 == index){
        found = index
      }
    }
  
    if(found){
      dropZoneEnabled = false;
    }
  }
</script>

{#if dropZoneEnabled}
<!-- enabled drop zone ui, id="dz-" -->
  <drop-zone id="dz-{index}" class="block select-none focus:outline-none border-none outline-none">
    <div class="{(drop_target == index && drag_start) && !animation ? 'opacity-100 ' : 'opacity-0 '} h-5 w-full pointer-events-none transition-opacity duration-300 flex items-center">
      <div class="h-2 w-full rounded-full bg-commit"></div>
    </div>
  </drop-zone>
{:else}
<!-- disabled drop zone ui, id="dzd- ???????" -->
  <drop-zone id="dz-{index}" class="block select-none focus:outline-none border-none outline-none">
    <div class="{(drop_target == index && drag_start) && !animation ? 'opacity-100 ' : 'opacity-0 '} h-5 w-full pointer-events-none transition-opacity duration-300 flex items-center">
      <div class="h-2 w-full rounded-full bg-red-500"></div>
    </div>
  </drop-zone>
{/if}
