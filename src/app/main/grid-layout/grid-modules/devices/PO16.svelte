<script>

  import { onMount } from 'svelte';

  import { appSettings } from '../../../_stores/app-helper.store.js';

  import { select } from '../event-handlers/select.js';  

  import Potentiometer from '../elements/Potentiometer.svelte';
  import Led from '../elements/Led.svelte';
  import { user_input } from '../../../../runtime/runtime.store.js';

  export let id = 'PO16';
  export let selectedElement = {id: '', brc: {}, event: {}};
  export let rotation = 0;
  export let moduleWidth;
  export let color;
  export let eventParam = [];

  let valueChange = [];

  let dx, dy;

  const control_block = (number) => {
    let array = [];
    for (let i = 0; i < number; i++) {
      array.push(i);
    }
    return array;
  }

  function handleEventParamChange(static_elementNumber, eventParam){
    if(eventParam.length){
      let v = 0;
      eventParam[1].forEach((e)=>{
        if(eventParam[0].SX == dx && eventParam[0].SY == dy){
          if(static_elementNumber == e.ELEMENTNUMBER){
            v =  e.EVENTPARAM;
            return;
          }
        }
      })
      
      if(v){
        return v;
      }
    }
  }

  onMount(()=>{

    if(id !== undefined && (id.length > 4)){
      dx = +id.split(';')[0].split(':').pop();
      dy = +id.split(';')[1].split(':').pop();
    }

  });

</script>


<div id={id} draggable={$appSettings.layoutMode} style="transform: rotate({rotation*90+'deg'})">

  <slot></slot>

  <div
    use:select={[id]}
    class:disable-pointer-events={$appSettings.layoutMode}
    class="module-dimensions border-2 {(dx == selectedElement.brc.dx && dy == selectedElement.brc.dy) ? ' border-gray-500' : 'border-transparent'} " 
    style="--module-size: {moduleWidth+'px'}" 
    >

    {#each control_block(4) as block }
      <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}; --control-row-mb: {$appSettings.size * 6.835 + 'px'}" >
        {#each control_block(4) as element}
          <div class:active-element={dx == selectedElement.brc.dx && dy == selectedElement.brc.dy && selectedElement.event.elementnumber == block * 4 + element} class="knob-and-led">
            <Led 
              eventInput={handleEventParamChange((block * 4) + element, eventParam)} 
              userInput={valueChange[((block * 4) + element)]} 
              size={$appSettings.size}
              {color}/>
            <Potentiometer 
              eventInput={handleEventParamChange((block * 4) + element, eventParam)} 
              elementNumber={(block * 4) + element} 
              size={$appSettings.size}
              on:user-interaction={(e)=>{valueChange[((block * 4) + element)] = e.detail}}
            />
          </div>
        {/each}
      </div>
    {/each}

  </div>
</div>

    