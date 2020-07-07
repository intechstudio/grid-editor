<script>

  import { onMount } from 'svelte';

  import { elementSettings } from '../settings/elementSettings.store.js';
  import { appSettings } from '../stores/app-settings.store.js';
  import { select } from './event-handlers/select.js';

  import Encoder from './elements/Encoder.svelte';
  import Led from './elements/Led.svelte';

  $: moduleWidth = $appSettings.size * 106.6 + 2 + 'px';

  export let id = 'EN16';

  export let rotation = 0;

  let selectedElement = {};

  $: moduleId = '';

  const control_block = (number) => {
    let array = [];
    for (let i = 0; i < number; i++) {
      array.push(i);
    }
    return array;
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

  <div 
    use:select={[id, $appSettings.selectedDisplay]}
    class:disable-pointer-events={$appSettings.selectedDisplay == 'layout'}
    class="module-dimensions" 
    style="--module-size: {moduleWidth}"
    >

    {#each control_block(4) as block }
      <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}; --control-row-mb: {$appSettings.size * 6.835 + 'px'}" >
        {#each control_block(4) as element}
          <div class:active-element={moduleId == selectedElement.position && selectedElement.controlNumber ==(16 - (block * 4) + element - 4)} data-element-number={block * 4 + element} class="knob-and-led">
            <Led size={$appSettings.size}/>
            <Encoder elementNumber={16 - (block * 4) + element - 4} size={$appSettings.size}/>
          </div>
        {/each}
      </div>
    {/each}

  </div>
</div>