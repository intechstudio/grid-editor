<script>

  import { onMount } from 'svelte';

  import { elementSettings } from '../../settings/elementSettings.store.js';
  import { appSettings } from '../../stores/app-settings.store.js';

  import { select } from '../event-handlers/select.js';

  import Potentiometer from '../elements/Potentiometer.svelte';
  import Led from '../elements/Led.svelte';
  import Fader from '../elements/Fader.svelte';
  import Button from '../elements/Button.svelte';

  export let id = 'PBF4';
  export let rotation = 0;
  export let moduleWidth;
  export let color;

  $: moduleId = '';

  let selectedElement = {};

  let valueChange = [];

  function handleEventParamChange(elementNumber, controlNumber){
    if(elementNumber !== undefined && controlNumber !== undefined && selectedElement.eventparam !== undefined) {
      if(controlNumber.indexOf(elementNumber) !== -1 && moduleId == selectedElement.position){
        const index = controlNumber.indexOf(elementNumber);
        return selectedElement.eventparam[index];
      }
    }
  }

  onMount(()=>{
    elementSettings.subscribe((values)=>{
      selectedElement = values;
    });

    if(id !== undefined && (id.length > 4)){
      const dx = id.split(';')[0].split(':').pop();
      const dy = id.split(';')[1].split(':').pop();
      moduleId = 'dx:'+dx+';dy:'+dy;
    }

  });

</script>

<style>
	.module-dimensions {
    width: var(--module-size);
    height: var(--module-size);
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		background-color: #1E2628;
		border-radius: 0.75rem;
  }
  
  .knob-and-led {
    display: flex;
    padding: 2px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .control-row{
    display: flex;
    flex-direction: row;
    width:100%;
    display: flex;
    justify-content: space-around;
    margin-top: var(--control-row-mt);
    margin-left: var(--control-row-mx);
    margin-right: var(--control-row-mx);
  }

  .control-row:last-child{
    margin-bottom: var(--control-row-mb);
  }

  .disable-pointer-events{
    pointer-events: none;
  }

  .active-element{
    background-color: #cc5b5b;
    padding: 2px;
    border-radius: 0.25rem;
  }

</style>

<div id={id} draggable={$appSettings.selectedDisplay == 'layout'} style="transform: rotate({rotation+'deg'})">

  <slot></slot>

  <div 
    use:select={[id, $appSettings.selectedDisplay]}
    class:disable-pointer-events={$appSettings.selectedDisplay == 'layout'}
    class="module-dimensions " 
    style="--module-size: {moduleWidth+'px'}" 
    >

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}" >
      {#each [0,1,2,3] as elementNumber}
        <div 
          class:active-element={moduleId == selectedElement.position && selectedElement.controlNumber == elementNumber} 
          class="knob-and-led">
          <Led 
            eventInput={handleEventParamChange(elementNumber, selectedElement.controlNumber)} 
            userInput={valueChange[elementNumber]} 
            size={$appSettings.size}
            {color}/>
          <Potentiometer 
            eventInput={handleEventParamChange(elementNumber, selectedElement.controlNumber)} 
            on:user-interaction={(e)=>{valueChange[elementNumber] = e.detail}}
            {elementNumber} 
            size={$appSettings.size}/>
        </div>
      {/each}
    </div>

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}">
      {#each [4,5,6,7] as elementNumber}
        <div 
          class:active-element={moduleId == selectedElement.position && selectedElement.controlNumber == elementNumber} 
          class="knob-and-led">
          <Led 
            eventInput={handleEventParamChange(elementNumber, selectedElement.controlNumber)} 
            userInput={valueChange[elementNumber]} 
            size={$appSettings.size}
            {color}/>
          <Fader 
            eventInput={handleEventParamChange(elementNumber, selectedElement.controlNumber)} 
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
          class:active-element={moduleId == selectedElement.position && selectedElement.controlNumber == elementNumber}  
          class="knob-and-led">
          <Led 
            eventInput={handleEventParamChange(elementNumber, selectedElement.controlNumber)} 
            userInput={valueChange[elementNumber]} 
            size={$appSettings.size}
            {color}/>
          <Button {elementNumber} size={$appSettings.size}/>
        </div>
      {/each}
    </div>
  </div>

</div>