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

  let serialMessageLengthArray = [];

  let tick = 0;

  let limit = 100;
/*
  setInterval(()=>{
		
    tick += 1;
    if(serial) {
      if(serialMessageLengthArray.length >= limit) {
        serialMessageLengthArray = serialMessageLengthArray.slice(1);
        serialMessageLengthArray[serialMessageLengthArray.length] = serial.length;
      } else {
        serialMessageLengthArray.push(serial.length);
      }
    }
  },100);
  */
	const x_min = 0
  const x_max = 100
  const y_min = 0
	const y_max = 100

  let el;
  let w = 320;

	const x1 = spring();
  const x2 = spring();
  let msgLen = []

  //$: $x2 = x_max;
	//$: $x1 = x_min;
  //$: msgLen = rolling_array(tick);

  function rolling_array(){
    return serialMessageLengthArray.map((value, index ) => ({x: index, y: value}));
	}

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

<div class="m-4 p-4">
	<div class="flex flex-col">

		<!--
		<div class="chart" bind:this={el}>
			<Pancake.Chart x1="{$x1+10}" x2="{$x2-2.5}" y1={y_min} y2={y_max} clip>

				<Pancake.Grid horizontal count={5} let:value let:first>
					<div class="grid-line horizontal" class:first><span>{value}</span></div>
				</Pancake.Grid>

				<Pancake.Columns data={msgLen} width={2}>
					<div class="column serial"></div>
				</Pancake.Columns>

				<Pancake.Svg>
					<Pancake.SvgLine data={msgLen} let:d>
						<path class="data" {d}></path>
					</Pancake.SvgLine>
			</Pancake.Svg>

			</Pancake.Chart>

		</div>
		-->

		<div id="data" style="height:200px" class="overflow-auto flex-grow rounded font-mono bg-white p-2">
			
			{#each [...input].reverse() as entry}
				<div class:serialOut="{entry.type == 'output'}">{entry.data}</div>
			{/each}

		</div>

		<button on:click={clear} class="p-1 px-2 my-2 w-32 text-white rounded bg-highlight focus:outline-none border-none">clear</button>

	</div>

	<div class="flex text-white items-end py-2 my-2">

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


<style>

	.serialOut{
		color: blue;
		font-weight: bold;
	}

	.data{
		stroke: #fff;
		stroke-width: 2px;
		fill: none;
	}

	.chart {
		position: relative;
		height: 300px;
		width: 300px;
		margin: 0 0 36px 0;
		overflow: hidden;
    padding: 3em 2em 2em 3em;
	}


  .grid-line {
		position: relative;
		display: block;
	}

	.grid-line.horizontal {
		width: calc(100% + 2em);
		left: -2em;
		border-bottom: 1px dashed rgb(115, 113, 113);
	}

	.grid-line.first {
		border-bottom: 1px solid #333;
	}

	.grid-line span {
		position: absolute;
		left: 0;
		bottom: 2px;
		font-family: sans-serif;
		font-size: 14px;
		color: rgb(81, 81, 81);
	}

	.column {
		position: absolute;
    /*left: 1px;
		width: calc(100% - 2px); 
    */
		left: 0;
		padding:0;
		margin:0;
		width: 100%;
		height: 100%;
		opacity: 0.6;
	}

	.column.serial {
		background-color: #1f77b4;
	}

  
</style>