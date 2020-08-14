<script>

  import BU16 from './modules/BU16.svelte';
  import PO16 from './modules/PO16.svelte';
  import PBF4 from './modules/PBF4.svelte';
  import EN16 from './modules/EN16.svelte';

  import ControlNameOverlay from './overlays/ControlNameOverlay.svelte';

  import { appSettings } from '../stores/app-settings.store.js';

  $: moduleWidth = $appSettings.size * 106.6 + 2;

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

  $: selected = components.find(component => component.type === type);

  $: console.log(rotation);

</script>

{#if selected}
  <svelte:component this={selected.component} {moduleWidth} {id} {rotation}>

    {#if $appSettings.overlays.controlName}
      <ControlNameOverlay {id} {moduleWidth} {rotation}></ControlNameOverlay>
    {/if}

  </svelte:component>
{/if}


