<script>
	import * as Pancake from '@sveltejs/pancake';
	import data from './data.js';

	const fruits = ['apples', 'bananas', 'cherries', 'dates'];

	const x1 = 0;
	const x2 = 100;

  const y1 = 0;
  const y2 = 100;

  const rndArray = (len) =>{
    let arr = [];
    for (let i = 0; i < len; i++) {
      arr[i] = Math.floor((Math.random()*101))
    }
    return arr;;
  }

  let base_array = rndArray(100);
  
  const arr = base_array.map((value,index) => {return {x: index, y: value}});

</script>

<div class="chart">
	<Pancake.Chart {x1} {x2} {y1} {y2}>
		<Pancake.Svg>
				<Pancake.SvgPolygon data={arr} let:d>
					<path class="data" style="stroke: #fff" {d}></path>
				</Pancake.SvgPolygon>
		</Pancake.Svg>
	</Pancake.Chart>
</div>

<style>
	.chart {
		height: 200px;
		padding: 3em 1em 2em 2em;
		margin: 0 0 36px 0;
		overflow: hidden;
	}

	.grid-line {
		position: relative;
		display: block;
	}

	.grid-line.horizontal {
		width: calc(100% + 2em);
		left: -2em;
		border-bottom: 1px dashed #ccc;
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
		color: #999;
	}

	.x-label {
		position: absolute;
		width: 4em;
		left: -2em;
		bottom: -22px;
		font-family: sans-serif;
		font-size: 14px;
		color: #999;
		text-align: center;
	}

	path.data {
		stroke: none;
	}
</style>