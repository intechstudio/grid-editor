<script>
import { onMount } from 'svelte';

  import Preset from './Preset.svelte';

	export let expanded = false;
	export let name;
	export let index;
	export let configs;
	export let counter;

	function toggle() {
		expanded = !expanded;
	}

  function isDeeper(key, obj){
		let deeper = false;
		if(!Object.keys(obj).includes('configs')){
			Object.entries(obj).forEach((elem)=>{
				elem.forEach(e => {
					if(Object.prototype.toString.call(e) == '[object Object]' || Object.prototype.toString.call(e) == '[object Array]' ) deeper = true;
				})
			})
		}
		return deeper;
	}

	onMount(()=>{
		console.log(name);
		counter++;
	})

</script>

<div class="flex {name == "Presets" ? '' : 'pl-4'} items-start flex-col w-full pointer-events-auto">

	{#if name !== "Presets"}

		<div on:click={toggle} class="flex items-center py-1  w-full cursor-pointer text-white">
			<svg class="{true ? null : 'invisible'}" width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M4.30351 6L1.03864e-07 1.80265L1.84825 0L8 6L1.84825 12L0 10.1973L4.30351 6Z" fill="#C9C8C8"/>
			</svg>	
			<div class="pl-2">{name}</div>
		</div>
	{/if}
	

	{#if expanded}

		<ul class="text-white w-full">

			{#each configs as [key, value]}

				<li class="{`bg-opacity-${counter*25}`} bg-select-saturate-10 py-1 px-2 my-1 flex flex-col rounded-lg  w-full">

						{#if isDeeper(key, value)}
							<svelte:self name={key} {counter} {index} configs={Object.entries(value)}/>
						{:else}
							<Preset {index} {counter} sub={name} {...value}/>
						{/if}
	
				</li>

			{/each}

		</ul>

	{/if}
</div>

<action-menu class="flex flex-row w-full flex-grow">
	
	<!--
	<list-of-presets class="w-1/2 flex flex-col">
		<div class="py-1 text-gray-700 text-sm mb-1">Presets</div>
		<ul class=" bg-secondary ml-1 p-1 text-white h-full flex flex-col">
			{#each selectedConfig as preset,index}
				<li on:click={()=>{selectedActionPreset = preset}} class="flex items-center my-1 cursor-pointer justify-between rounded-lg w-full {selectedActionPreset == preset ? 'bg-select text-white' : 'hover:bg-select-saturate-10 text-gray-50'}">
						<div class="flex items-center  py-1 px-2 " >
							<svg class="{selectedActionPreset == preset ? null : 'invisible'}" width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4Z" fill="#C9C8C8"/>
							</svg>
							<div class="pl-2">
								{preset.name}
								{@html checkIfPlacementPossible(preset.desc, preset.type)}
							</div>
						</div>
						<div on:click|stopPropagation={()=>{changeFavourite(preset)}} class="rounded-full hover:bg-select-desaturate-20 mx-1">
							<svg class="fill-current {preset.isFav ? 'text-yellow-300' : 'text-black'} w-6 h-6 p-1 " viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M8.892 0.25813C8.82614 0.101837 8.67149 0 8.5 0C8.32851 0 8.17386 0.101837 8.108 0.25813L5.96169 5.3518L0.390642 5.79266C0.219701 5.80619 0.0737906 5.9199 0.0207975 6.08089C-0.0321956 6.24187 0.0181361 6.41852 0.148375 6.52864L4.39292 10.1176L3.09615 15.4837C3.05635 15.6484 3.12083 15.8205 3.25956 15.92C3.3983 16.0195 3.58406 16.0268 3.73041 15.9386L8.5 13.063L13.2696 15.9386C13.4159 16.0268 13.6017 16.0195 13.7404 15.92C13.8792 15.8205 13.9436 15.6484 13.9039 15.4837L12.6071 10.1176L16.8516 6.52864C16.9819 6.41852 17.0322 6.24187 16.9792 6.08089C16.9262 5.9199 16.7803 5.80619 16.6094 5.79266L11.0383 5.3518L8.892 0.25813Z"/>
							</svg>
						</div>
				</li>
			{/each}
		</ul>
	</list-of-presets>
	-->
</action-menu>

<style>

</style>