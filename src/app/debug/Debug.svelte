<script>
	import * as Pancake from '@sveltejs/pancake'; 
	import { spring } from 'svelte/motion';
  import { onMount } from 'svelte';

  export let serial;

  let serialMessageLengthArray = [];

  let tick = 0;

  let limit = 100;

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
  
	const x_min = 0
  const x_max = 100
  const y_min = 0
	const y_max = 100

  let el;
  let w = 320;

	const x1 = spring();
  const x2 = spring();
  let msgLen = []

  $: $x2 = x_max;
	$: $x1 = x_min;
  $: msgLen = rolling_array(tick);

  function rolling_array(){
    return serialMessageLengthArray.map((value, index ) => ({x: index, y: value}));
  }

 
  onMount(()=>{
    
  });


  let auto = true;

  $: $x2 = auto ? x_max : 1000;
  $: $x1 = auto ? x_min : 0;


</script>


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


<style>

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