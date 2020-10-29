<script>

  import { onMount } from 'svelte';

  import BU16 from './modules/BU16.svelte';
  import PO16 from './modules/PO16.svelte';
  import PBF4 from './modules/PBF4.svelte';
  import EN16 from './modules/EN16.svelte';

  import ControlNameOverlay from './overlays/ControlNameOverlay.svelte';
  import ProfileLoadOverlay from './overlays/ProfileLoadOverlay.svelte';


  import { appSettings } from '../../stores/app-settings.store.js';
  import { localInputStore } from '../../stores/control-surface-input.store.js';

  const components = [
		{ type: 'BU16', component: BU16 },
		{ type: 'PO16', component: PO16 },
    { type: 'PBF4', component: PBF4 },
    { type: 'EN16', component: EN16 },
	];

  export let type;
  export let id;
  export let rotation;

  let selected;
  let color;
  let bankSettings;
  let bankActive;

  $: moduleWidth = $appSettings.size * 106.6 + 2;

  $: selected = components.find(component => component.type === type);

  onMount(()=>{
    /**
    globalInputStore.subscribe(banks =>{
      color = banks.bankColors[banks.active];
      bankActive = banks.bankActive;
    })
    */
  })

</script>

{#if selected}
  <svelte:component this={selected.component} {moduleWidth} {id} {rotation} {color}>

    {#if $appSettings.overlays.controlName}
      <ControlNameOverlay {id} {moduleWidth} {bankActive} {rotation}/>
    {/if}

    <!--    
    {#if $appSettings.selectedDisplay == 'profiles'}
      <ProfileLoadOverlay {id} {moduleWidth} {bank} {rotation}/>
    {/if}
    -->


  </svelte:component>
{/if}

<style global>
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
    background-color: #eed23766;
    padding: 2px;
    border-radius: 0.25rem;
  }
</style>
