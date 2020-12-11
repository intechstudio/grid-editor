<script>

  import { onMount } from 'svelte';

  import { localInputStore } from '../../../stores/control-surface-input.store.js';
  import { appSettings } from '../../../stores/app-settings.store.js';

  import { select } from '../event-handlers/select.js';  

  import Potentiometer from '../elements/Potentiometer.svelte';
  import Led from '../elements/Led.svelte';

  export let id = 'PO16';
  export let selectedElement = {};
  export let rotation = 0;
  export let moduleWidth;
  export let color;

  let valueChange = [];

  let dx, dy;

  const control_block = (number) => {
    let array = [];
    for (let i = 0; i < number; i++) {
      array.push(i);
    }
    return array;
  }

  function handleEventParamChange(static_elementNumber, input_elementNumber){
    if(static_elementNumber == input_elementNumber){
      if(dx == selectedElement.dx && dy == selectedElement.dy){
        return selectedElement.eventParam;
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


<div id={id} draggable={$appSettings.layoutMode} style="transform: rotate({rotation+'deg'})">

  <slot></slot>

  <div
    use:select={[id]}
    class:disable-pointer-events={$appSettings.layoutMode}
    class="module-dimensions " 
    style="--module-size: {moduleWidth+'px'}" 
    >

    {#each control_block(4) as block }
      <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}; --control-row-mb: {$appSettings.size * 6.835 + 'px'}" >
        {#each control_block(4) as element}
          <div class:active-element={dx == selectedElement.dx && dy == selectedElement.dy && selectedElement.elementNumber == block * 4 + element} class="knob-and-led">
            <Led 
              eventInput={handleEventParamChange((block * 4) + element, selectedElement.elementNumber)} 
              userInput={valueChange[((block * 4) + element)]} 
              size={$appSettings.size}
              {color}/>
            <Potentiometer 
              eventInput={handleEventParamChange((block * 4) + element, selectedElement.elementNumber)} 
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

    