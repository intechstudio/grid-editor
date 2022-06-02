<script>

  import { onMount } from 'svelte';

  import { appSettings } from '../../../../runtime/app-helper.store.js';

  import { select } from '../event-handlers/select.js';

  import Potentiometer from '../elements/Potentiometer.svelte';
  import Led from '../elements/Led.svelte';
  import Fader from '../elements/Fader.svelte';
  import Button from '../elements/Button.svelte';

  import { elementPositionStore } from '../../../../runtime/runtime.store';
  import { ledColorStore } from '../../../../runtime/runtime.store';

  export let id = 'PBF4';
  export let selectedElement = {id: '', brc: {}, event: {}};
  export let rotation = 0;
  export let moduleWidth;

  let dx, dy; // local device's dx dy coords for self check

  let elementposition_array = [0,0,0,0,0,0,0,0,0,0,0,0];
  let ledcolor_array = [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];

  elementPositionStore.subscribe(value => {

    try {
      let eps = value[dx][dy]

      for (const key in eps) {
        elementposition_array[key] = eps[key];
      }

    } catch (error) {
      return;
    }
	});

  ledColorStore.subscribe(value => {
    try {
      let lcs = value[dx][dy]

      for (const key in lcs) {
        ledcolor_array[key] = lcs[key];

      }

    } catch (error) {
      return;
    }
  });



  $: if (id){

    if(id !== undefined && (id.length > 4)){
      dx = +id.split(';')[0].split(':').pop();
      dy = +id.split(';')[1].split(':').pop();
    }

  }

</script>


<div id={id} draggable={$appSettings.layoutMode} style="transform: rotate({rotation*-90+'deg'})">

  <slot></slot>

  <div 
    use:select
    class:disable-pointer-events={$appSettings.layoutMode}
    class="module-dimensions {(dx == selectedElement.brc.dx && dy == selectedElement.brc.dy) ? 'border-2 border-gray-500' : ''}" 
    class:active-systemelement={dx == selectedElement.brc.dx && dy == selectedElement.brc.dy && selectedElement.event.elementnumber == 255}
    style="--module-size: {moduleWidth+'px'}" 
    >

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}" >
      {#each [0,1,2,3] as elementNumber}
        <div 
          class:active-element={dx == selectedElement.brc.dx && dy == selectedElement.brc.dy && selectedElement.event.elementnumber == elementNumber}
          class="knob-and-led">
          <Led
            color={ledcolor_array[elementNumber]} 
            size={$appSettings.size}/>
          <Potentiometer {elementNumber}
            id = {id}
            position={elementposition_array[elementNumber]} 
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
            color={ledcolor_array[elementNumber]} 
            size={$appSettings.size}/>
          <Fader {elementNumber}
            id = {id}
            position={elementposition_array[elementNumber]}
            size={$appSettings.size} 
            rotation={rotation*-90}
            faderHeight={37}/>
        </div>
      {/each}
    </div>

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}; --control-row-mb: {$appSettings.size * 6.835 + 'px'}">
      {#each [8,9,10,11] as elementNumber}
        <div 
          class:active-element={dx == selectedElement.brc.dx && dy == selectedElement.brc.dy && selectedElement.event.elementnumber == elementNumber}
          class="knob-and-led">
          <Led
            color={ledcolor_array[elementNumber]} 
            size={$appSettings.size}/>
          <Button 
            id = {id} {elementNumber} size={$appSettings.size}/>
        </div>
      {/each}
    </div>
  </div>

</div>