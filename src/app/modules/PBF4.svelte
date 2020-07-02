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

      <div data-element-number={12} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Potentiometer size={$appSettings.size}/>
      </div>

      <div data-element-number={13} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Potentiometer size={$appSettings.size}/>
      </div>

      <div data-element-number={14} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Potentiometer size={$appSettings.size}/>
      </div>

      <div data-element-number={15} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Potentiometer size={$appSettings.size}/>
      </div>

    </div>

    <div class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}">
      <div data-element-number={4} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Fader size={$appSettings.size} {rotation}/>
      </div>

      <div data-element-number={5} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Fader size={$appSettings.size} {rotation}/>
      </div>

      <div data-element-number={6} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Fader size={$appSettings.size} {rotation}/>
      </div>

      <div data-element-number={7} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Fader size={$appSettings.size} {rotation}/>
      </div>
    </div>

    <div data-element-number={0} class="control-row" style="--control-row-mt: {$appSettings.size * 3.235 +'px'}; --control-row-mx: {$appSettings.size * 6.835 + 'px'}; --control-row-mb: {$appSettings.size * 6.835 + 'px'}">
      <div class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Button size={$appSettings.size}/>
      </div>

      <div data-element-number={1} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Button size={$appSettings.size}/>
      </div>

      <div data-element-number={2} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Button size={$appSettings.size}/>
      </div>

      <div data-element-number={3} class="knob-and-led">
        <Led size={$appSettings.size}/>
        <Button size={$appSettings.size}/>
      </div>
    </div>
  </div>

</div>