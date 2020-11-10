<script>
	import * as Pancake from '@sveltejs/pancake'; 
	import { spring } from 'svelte/motion';
	import { onMount } from 'svelte';
	import { serialComm, serialCommDebug } from '../../core/serialport/serialport.store';
	import { GRID_PROTOCOL } from '../../core/classes/GridProtocol';
	import { localInputStore } from '../../stores/control-surface-input.store';
	import { appSettings } from '../../stores/app-settings.store';

	let input = [];
	let counter = 0;

	let elem;

	serialCommDebug.subscribe(store => {
		input = store;
	})


	let brc = [];
	let command;
	
	function debug(){
		let data = GRID_PROTOCOL.encode_debugger(brc, command);
		console.log(brc, command, data);
		serialComm.write(data);
	}

	function clear(){
		serialCommDebug.set([]);
	}


</script>


	<div class="flex m-2 p-2 h-full flex-col">
		<!-- raw command input -->
			<div class="flex flex-col xl:flex-row text-white xl:items-end p-2">

				<div class="mr-1">
					<div>dx</div>
					<input class="w-full xl:w-10 p-1 text-black focus:outline-none" bind:value={brc[0]}>
				</div>
				<div class="mx-1">
					<div>dy</div>
					<input class="w-full xl:w-10 p-1 text-black focus:outline-none"  bind:value={brc[1]}>
				</div>
				<div class="mx-1">
					<div>age</div>
					<input class="w-full xl:w-10 p-1 text-black focus:outline-none"  bind:value={brc[2]}>
				</div>
				<div class="mx-1">
					<div>rot</div>
					<input class="w-full xl:w-10 p-1 text-black focus:outline-none"  bind:value={brc[3]}>
				</div>
				<div class="mx-1">
					<div>command</div>
					<input class="w-full xl:w-24 p-1 text-black focus:outline-none"  bind:value={command}>
				</div>
		
				<button on:click={debug} class="p-1 px-2 mt-4 mx-1 xl:mt-0 bg-blue-600 border-none rounded focus:outline-none">write</button>
		
		
			</div>



		<div class="flex flex-col h-full">
			<button on:click={clear} class="p-1 px-2 m-2 w-32 text-white rounded bg-highlight focus:outline-none border-none">clear</button>

			<div id="data" style="height:300px;" class="overflow-auto select-text flex-grow rounded font-mono bg-white m-2 p-2">
				
				{#each [...input].reverse() as entry}
					<div class:serialOut="{entry.type == 'output'}">{entry.data}</div>
				{/each}

			</div>
		
		</div>
		

	</div>




<style>

	.serialOut{
		color: blue;
		font-weight: bold;
	}
  
</style>