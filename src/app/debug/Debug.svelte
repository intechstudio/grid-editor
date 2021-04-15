<script>
	import * as Pancake from '@sveltejs/pancake'; 
	import { spring } from 'svelte/motion';
	import { onMount } from 'svelte';
	import { serialComm } from '../core/serialport/serialport.store';
	import { GRID_PROTOCOL } from '../core/classes/GridProtocol';
	import { localInputStore } from '../stores/control-surface-input.store';
	import { appSettings } from '../stores/app-settings.store';

	let input = [];

</script>


	<div class="flex m-2 p-2 h-full flex-col">
		<!-- raw command input -->


	</div>




<style>

  
</style>