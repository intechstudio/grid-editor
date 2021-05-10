<script>

  import { onMount } from 'svelte';

  import { appSettings } from '../../../_stores/app-helper.store.js';

  import { select } from '../event-handlers/select.js';

  import Encoder from '../elements/Encoder.svelte';
  import Led from '../elements/Led.svelte';

  export let moduleWidth;
  export let selectedElement = {};
  export let id = 'EN16';
  export let rotation = 0;
  export let color;

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
      console.log(id);
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
    class="module-dimensions" 
    style="--module-size: {moduleWidth+'px'}"
    >

    {#each control_block(4) as block }
      <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}; --control-row-mb: {$appSettings.size * 6.835 + 'px'}" >
        {#each control_block(4) as element}
          <div class:active-element={dx == selectedElement.dx && dy == selectedElement.dy && selectedElement.elementNumber == block * 4 + element} data-element-number={block * 4 + element} class="knob-and-led">
            <Led 
              eventInput={handleEventParamChange(block * 4 + element, selectedElement.elementNumber)}
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