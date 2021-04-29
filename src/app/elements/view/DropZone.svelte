<script>
  export let index;
  export let drag_start;
  export let drop_target;
  export let drag_target;
  export let animation;

  import { runtime,dropStore } from '../action-preferences.store.js';
  // pointer-events-none  {dragstart ? 'block' : 'hidden'} 
  // class:pointer-events-none="{dragstart}"


  let dropZoneEnabled = true;
  $: if(drag_target.length > 0){

    const _index_low = $runtime.findIndex(a => a.id == Number(drag_target[0]));

    if(_index_low == index || _index_low - 1 == index){
      dropZoneEnabled = false;
    }

    if(drag_target.length > 1){

      const _index_high = $runtime.findIndex(a => a.id == Number(drag_target[drag_target.length-1]));

      if(_index_low <= index && index <= _index_high){
        dropZoneEnabled = false
      }

      if($dropStore.disabledDropZones.includes(index)){
        dropZoneEnabled = false
      }

    };
    
  }
</script>

<!-- enabled drop zone ui, id="dz-" -->
<drop-zone id="dz-{index}" class="block select-none focus:outline-none border-none outline-none">
  <div class="{(drop_target == index && drag_start) && !animation ? 'opacity-100 ' : 'opacity-0 '} h-5 w-full pointer-events-none transition-opacity duration-300 flex items-center">
    <div class="h-2 w-full rounded-full {dropZoneEnabled ? 'bg-commit' : 'bg-red-500'}"></div>
  </div>
</drop-zone>

