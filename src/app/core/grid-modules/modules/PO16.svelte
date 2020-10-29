<script>

  import { onMount } from 'svelte';

  import { localInputStore } from '../../../stores/control-surface-input.store.js';
  import { appSettings } from '../../../stores/app-settings.store.js';

  import { select } from '../event-handlers/select.js';  

  import Potentiometer from '../elements/Potentiometer.svelte';
  import Led from '../elements/Led.svelte';

  export let id = 'PO16';
  export let rotation = 0;
  export let moduleWidth;
  export let color;

  let valueChange = [];

  let dx, dy;

  let selectedElement = {};

  const control_block = (number) => {
    let array = [];
    for (let i = 0; i < number; i++) {
      array.push(i);
    }
    return array;
  }

  function handleEventParamChange(elementNumber, controlNumber){
    if(elementNumber !== undefined && controlNumber !== undefined && selectedElement.eventparam !== undefined) {
      if(controlNumber.indexOf(elementNumber) !== -1 && moduleId == selectedElement.position){
        const index = controlNumber.indexOf(elementNumber);
        return selectedElement.eventparam[index]
      }
    }
  }

  onMount(()=>{
    localInputStore.subscribe((values)=>{
      selectedElement = values;
    });

    if(id !== undefined && (id.length > 4)){
      dx = +id.split(';')[0].split(':').pop();
      dy = +id.split(';')[1].split(':').pop();
     
    }

  });

</script>


<div id={id} draggable={$appSettings.selectedDisplay == 'layout'} style="transform: rotate({rotation+'deg'})">

  <slot></slot>

  <div
    use:select={[id]}
    class:disable-pointer-events={$appSettings.selectedDisplay == 'layout'}
    class="module-dimensions " 
    style="--module-size: {moduleWidth+'px'}" 
    >

    {#each control_block(4) as block }
      <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}; --control-row-mb: {$appSettings.size * 6.835 + 'px'}" >
        {#each control_block(4) as element}
          <div class:active-element={dx == selectedElement.dx && dy == selectedElement.dy && selectedElement.elementNumber == block * 4 + element} class="knob-and-led">
            <Led 
              eventInput={handleEventParamChange((block * 4) + element, selectedElement.controlNumber)} 
              userInput={valueChange[((block * 4) + element)]} 
              size={$appSettings.size}
              {color}/>
            <Potentiometer 
              eventInput={handleEventParamChange((block * 4) + element, selectedElement.controlNumber)} 
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

    