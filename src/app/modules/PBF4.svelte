<script>

  import { appSettings } from '../stores/app-settings.store.js';
  import { select } from './event-handlers/select.js';

  import Potentiometer from './elements/Potentiometer.svelte';
  import Led from './elements/Led.svelte';
  import Fader from './elements/Fader.svelte';
  import Button from './elements/Button.svelte';

  $: moduleWidth = $appSettings.size * 106.6 + 'px';

  export let id = 'PBF4';

  export let rotation = 0;

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

</style>

<div id={id} draggable={$appSettings.selectedDisplay == 'layout'} style="transform: rotate({rotation+'deg'})">

  <div 
    use:select={[id, $appSettings.selectedDisplay]}
    class:disable-pointer-events={$appSettings.selectedDisplay == 'layout'}
    class="module-dimensions " 
    style="--module-size: {moduleWidth}" 
    >

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}" >

      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Potentiometer elementNumber={12} size={$appSettings.size}/>
      </div>

      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Potentiometer elementNumber={13} size={$appSettings.size}/>
      </div>

      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Potentiometer elementNumber={14} size={$appSettings.size}/>
      </div>

      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Potentiometer elementNumber={15} size={$appSettings.size}/>
      </div>

    </div>

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}">
      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Fader elementNumber={4} size={$appSettings.size} {rotation}/>
      </div>

      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Fader elementNumber={4} size={$appSettings.size} {rotation}/>
      </div>

      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Fader elementNumber={4} size={$appSettings.size} {rotation}/>
      </div>

      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Fader elementNumber={4} size={$appSettings.size} {rotation}/>
      </div>
    </div>

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}; --control-row-mb: {$appSettings.size * 6.835 + 'px'}">
      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Button elementNumber={0} size={$appSettings.size}/>
      </div>

      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Button elementNumber={1} size={$appSettings.size}/>
      </div>

      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Button elementNumber={2} size={$appSettings.size}/>
      </div>

      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Button elementNumber={3} size={$appSettings.size}/>
      </div>
    </div>
  </div>

</div>