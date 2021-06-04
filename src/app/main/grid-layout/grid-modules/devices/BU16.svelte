<script>

  import { onMount } from 'svelte';

  import { appSettings } from '../../../_stores/app-helper.store.js';

  import { select } from '../event-handlers/select.js';

  import Button from '../elements/Button.svelte';
  import Led from '../elements/Led.svelte';

  export let moduleWidth;
  export let selectedElement = {id: '', brc: {}, event: {}};
  export let id = 'BU16';
  export let rotation = 0;
  export let color;

  let valueChange = [];

  let dx, dy

  const control_block = (number) => {
    let array = [];
    for (let i = 0; i < number; i++) {
      array.push(i);
    }
    return array;
  }

  function handleEventParamChange(static_elementNumber, input_elementNumber){
    if(static_elementNumber == input_elementNumber){
      if(dx == selectedElement.brc.dx && dy == selectedElement.brc.dy){
        return selectedElement.event.eventParam;
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


<div id={id} draggable={$appSettings.layoutMode} style="transform: rotate({rotation+'deg'})" >

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
              eventInput={handleEventParamChange(block * 4 + element, selectedElement.event.elementnumber)} 
              userInput={valueChange[(block * 4 + element)]}
              size={$appSettings.size}
              {color}/>
            <Button 
              on:click={valueChange[(block * 4 + element)] = ! true}
              elementNumber={(block * 4) + element} size={$appSettings.size}/>
          </div>
        {/each}
      </div>
    {/each}


  </div>
</div>