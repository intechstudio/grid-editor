<script>
	import Tailwindcss from './Tailwindcss.svelte';

	import Map from './components/map/Map.svelte';
	import Menu from './components/menu/Menu.svelte';
	import DevTool from './components/tools/devTool/DevTool.svelte';
	import ModuleSettings from './components/settings/module-settings/ModuleSettings.svelte';
	import ElementSettings from './components/settings/element-settings/ElementSettings.svelte';

	import { appSettings } from './components/menu/app-settings.store';


</script>

<style>
	
	:global(body) {
		background-color: #2A3439;
	}

	:global(.primary){
    background-color:#1E2628;
  }

  :global(.secondary){
    background-color:#2A3439;
  }

</style>

<Tailwindcss />

<Menu  />

<div class="relative">
	<Map size={$appSettings.size}/>

	<!--<DevTool />-->

</div>


