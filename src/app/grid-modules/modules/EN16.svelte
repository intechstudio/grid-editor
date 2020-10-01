<script>

  import { onMount } from 'svelte';

  import { elementSettings } from '../../settings/elementSettings.store.js';
  import { appSettings } from '../../stores/app-settings.store.js';

  import { select } from '../event-handlers/select.js';

  import Encoder from '../elements/Encoder.svelte';
  import Led from '../elements/Led.svelte';

  export let moduleWidth;
  export let id = 'EN16';
  export let rotation = 0;
  export let color;

  let selectedElement = {};

  $: moduleId = '';

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

  function handleColorChange(bank){
    //console.log(colors, bank)
  }

  onMount(()=>{
    elementSettings.subscribe((values)=>{
      selectedElement = values;
    })

    if(id !== undefined && (id.length > 4)){
      const dx = id.split(';')[0].split(':').pop();
      const dy = id.split(';')[1].split(':').pop();
      moduleId = 'dx:'+dx+';dy:'+dy;
    }

  });

</script>

<div id={id} draggable={$appSettings.selectedDisplay == 'layout'} style="transform: rotate({rotation+'deg'})">

  <slot></slot>

  <div 
    use:select={[id]}
    class:disable-pointer-events={$appSettings.selectedDisplay == 'layout'}
    class="module-dimensions" 
    style="--module-size: {moduleWidth+'px'}"
    >

    {#each control_block(4) as block }
      <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}; --control-row-mb: {$appSettings.size * 6.835 + 'px'}" >
        {#each control_block(4) as element}
          <div class:active-element={moduleId == selectedElement.position && selectedElement.controlNumber == block * 4 + element} data-element-number={block * 4 + element} class="knob-and-led">
            <Led 
              eventInput={handleEventParamChange(block * 4 + element, selectedElement.controlNumber)}
              userInput={0} 
              size={$appSettings.size}
              {color}/>
            <Encoder elementNumber={(block * 4) + element} size={$appSettings.size}/>
          </div>
        {/each}
      </div>
    {/each}

  </div>
</div>