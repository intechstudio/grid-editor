<script>

  import Potentiometer from './elements/Potentiometer.svelte';
  import Led from './elements/Led.svelte';
  import Fader from './elements/Fader.svelte';

  export let size = 1;

  $: moduleWidth = size * 106.6 + 'px';

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

</style>

<div class="module-dimensions" style="--module-size: {moduleWidth}">

  <div class="control-row" style="--control-row-mt: {size * 3.235 +'px'}; --control-row-mx: {size * 6.835 + 'px'}" >

    <div class="knob-and-led">
      <Led {size}/>
      <Potentiometer {size}/>
    </div>

    <div class="knob-and-led">
      <Led {size}/>
      <Potentiometer {size}/>
    </div>

    <div class="knob-and-led">
      <Led {size}/>
      <Potentiometer {size}/>
    </div>

    <div class="knob-and-led">
      <Led {size}/>
      <Potentiometer {size}/>
    </div>

  </div>

  <div class="control-row" style="--control-row-mt: {size * 3.235 +'px'}; --control-row-mx: {size * 6.835 + 'px'}">
    <div class="knob-and-led">
      <Led {size}/>
      <Fader {size}/>
    </div>

    <div class="knob-and-led">
      <Led {size}/>
      <Fader {size}/>
    </div>

    <div class="knob-and-led">
      <Led {size}/>
      <Fader {size}/>
    </div>

    <div class="knob-and-led">
      <Led {size}/>
      <Fader {size}/>
    </div>
  </div>

  <div class="control-row" style="--control-row-mt: {size * 3.235 +'px'}; --control-row-mx: {size * 6.835 + 'px'}; --control-row-mb: {size * 6.835 + 'px'}">
    <div class="knob-and-led">
      <Led {size}/>
      <Potentiometer {size}/>
    </div>

    <div class="knob-and-led">
      <Led {size}/>
      <Potentiometer {size}/>
    </div>

    <div class="knob-and-led">
      <Led {size}/>
      <Potentiometer {size}/>
    </div>

    <div class="knob-and-led">
      <Led {size}/>
      <Potentiometer {size}/>
    </div>
  </div>
</div>