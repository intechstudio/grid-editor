<script>

  import { onMount } from 'svelte';

  import BU16 from './devices/BU16.svelte';
  import PO16 from './devices/PO16.svelte';
  import PBF4 from './devices/PBF4.svelte';
  import EN16 from './devices/EN16.svelte';

  import ControlNameOverlay from './overlays/ControlNameOverlay.svelte';
  import ProfileLoadOverlay from './overlays/ProfileLoadOverlay.svelte';

  import { appSettings } from '../../../main/_stores/app-helper.store.js';
  import { runtime, user_input} from '../../../runtime/runtime.store.js';


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
  let bankColors;
  let bankActive = 0; // future page!
  let selectedElement;
  let eventParam;

  $: moduleWidth = $appSettings.size * 106.6 + 2;

  $: selected = components.find(component => component.type === type);

  $: if(bankColors){
    color = bankColors[bankActive];
  }

  let ready = false;

  onMount(()=>{

    user_input.active_input(store => {
      selectedElement = store.selected;
      eventParam = store.eventparams;
    })
    
  })

</script>

{#if selected}
  <svelte:component this={selected.component} {moduleWidth} {id} {rotation} {color} {selectedElement} {eventParam}>

    {#if $appSettings.overlays.controlName}
      <ControlNameOverlay {id} {moduleWidth} bankActive={0} {rotation}/>
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
    background-color: #ffffff66;
    padding: 2px;
    border-radius: 0.25rem;
  }
</style>
