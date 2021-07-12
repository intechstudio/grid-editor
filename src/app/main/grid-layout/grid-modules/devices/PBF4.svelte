<script>

  import { onMount } from 'svelte';

  import { appSettings } from '../../../_stores/app-helper.store.js';

  import { select } from '../event-handlers/select.js';

  import Potentiometer from '../elements/Potentiometer.svelte';
  import Led from '../elements/Led.svelte';
  import Fader from '../elements/Fader.svelte';
  import Button from '../elements/Button.svelte';

  export let id = 'PBF4';
  export let selectedElement = {id: '', brc: {}, event: {}};
  export let rotation = 0;
  export let moduleWidth;
  export let color;
  export let eventParam = [];

  let dx, dy; // local device's dx dy coords for self check

  let valueChange = [];

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
    class="module-dimensions {(dx == selectedElement.brc.dx && dy == selectedElement.brc.dy) ? 'border-2 border-gray-500' : ''}" 
    style="--module-size: {moduleWidth+'px'}" 
    >

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}" >
      {#each [0,1,2,3] as elementNumber}
        <div 
          class:active-element={dx == selectedElement.brc.dx && dy == selectedElement.brc.dy && selectedElement.event.elementnumber == elementNumber}
          class="knob-and-led">
          <Led 
            eventInput={handleEventParamChange(elementNumber, eventParam)} 
            userInput={valueChange[elementNumber]} 
            size={$appSettings.size}
            {color}/>
          <Potentiometer 
            eventInput={handleEventParamChange(elementNumber, eventParam)} 
            on:user-interaction={(e)=>{valueChange[elementNumber] = e.detail}}
            {elementNumber} 
            size={$appSettings.size}/>
        </div>
      {/each}
    </div>

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}">
      {#each [4,5,6,7] as elementNumber}
        <div 
          class:active-element={dx == selectedElement.brc.dx && dy == selectedElement.brc.dy && selectedElement.event.elementnumber == elementNumber} 
          class="knob-and-led">
          <Led 
            eventInput={handleEventParamChange(elementNumber, eventParam)} 
            userInput={valueChange[elementNumber]} 
            size={$appSettings.size}
            {color}/>
          <Fader 
            eventInput={handleEventParamChange(elementNumber, eventParam)} 
            on:user-interaction={(e)=>{ valueChange[elementNumber] = Math.round(((e.detail + 22) * 2.886) - 127) * -1 }}
            {elementNumber} 
            size={$appSettings.size} 
            {rotation}/>
        </div>
      {/each}
    </div>

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}; --control-row-mb: {$appSettings.size * 6.835 + 'px'}">
      {#each [8,9,10,11] as elementNumber}
        <div 
          class:active-element={dx == selectedElement.brc.dx && dy == selectedElement.brc.dy && selectedElement.event.elementnumber == elementNumber}
          class="knob-and-led">
          <Led 
            eventInput={handleEventParamChange(elementNumber, eventParam)} 
            userInput={valueChange[elementNumber]} 
            size={$appSettings.size}
            {color}/>
          <Button {elementNumber} size={$appSettings.size}/>
        </div>
      {/each}
    </div>
  </div>

</div>