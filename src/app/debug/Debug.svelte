<script>
	import * as Pancake from '@sveltejs/pancake'; 
	import { spring } from 'svelte/motion';
	import { onMount } from 'svelte';
	import { serialComm } from '../serialport/serialport.store';
	import { GRID_PROTOCOL } from '../serialport/GridProtocol';
	import { elementSettings } from '../settings/elementSettings.store';
	import { appSettings } from '../stores/app-settings.store';
	import { debugStore } from '../stores/debug.store';

	let input = [];
	let counter = 0;

	let elem;

	debugStore.subscribe(store => {
		input = store;
	})


	let brc = [];
	let command;
	
	function debug(){
		let data = GRID_PROTOCOL.encode_debugger(brc, command);

		serialComm.write(data);
	}

	function clear(){
		debugStore.set([]);
	}

 
  onMount(()=>{
    elem = document.getElementById('data');
  });


  let auto = true;

  //$: $x2 = auto ? x_max : 1000;
  //$: $x1 = auto ? x_min : 0;


</script>

<div class="m-2 p-2">
	<div class="flex flex-col">

		<div class="flex flex-row">

			<div id="data" style="height:200px" class=" overflow-auto select-text flex-grow rounded font-mono bg-white m-2 p-2">
				
				{#each [...input].reverse() as entry}
					<div class:serialOut="{entry.type == 'output'}">{entry.data}</div>
				{/each}

			</div>
			<div class="flex flex-col">
				<button on:click={clear} class="p-1 px-2 m-2 w-32 text-white rounded bg-highlight focus:outline-none border-none">clear</button>
				<div class="flex text-white items-end p-2">

					<div class="mr-1">
						<div>dx</div>
						<input class="w-10 p-1 text-black focus:outline-none" bind:value={brc[0]}>
					</div>
					<div class="mx-1">
						<div>dy</div>
						<input class="w-10 p-1 text-black focus:outline-none"  bind:value={brc[1]}>
					</div>
					<div class="mx-1">
						<div>age</div>
						<input class="w-10 p-1 text-black focus:outline-none"  bind:value={brc[2]}>
					</div>
					<div class="mx-1">
						<div>rot</div>
						<input class="w-10 p-1 text-black focus:outline-none"  bind:value={brc[3]}>
					</div>
					<div class="mx-1">
						<div>command</div>
						<input class="w-40 p-1 text-black focus:outline-none"  bind:value={command}>
					</div>
			
					<button on:click={debug} class="p-1 px-2 mx-1 bg-blue-600 border-none rounded focus:outline-none">write</button>
			
			
				</div>
	
			</div>

		
		</div>
	
		

	</div>

	

</div>


<style>

	.serialOut{
		color: blue;
		font-weight: bold;
	}
  
</style>