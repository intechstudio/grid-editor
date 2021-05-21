<script>
	import { onMount } from 'svelte';

  import Preset from './Preset.svelte';

	import {fly } from 'svelte/transition'

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
		counter++;
	})

</script>

<div class="flex {name == "Presets" ? '' : 'pl-4'} items-start flex-col w-full pointer-events-auto">

	{#if name !== "Presets"}

		<div on:click={toggle} class="flex items-center py-1 w-full cursor-pointer text-white">
			<svg class="{expanded ? 'rotate-90' : 'rotate-0'} transform" width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M4.30351 6L1.03864e-07 1.80265L1.84825 0L8 6L1.84825 12L0 10.1973L4.30351 6Z" fill="#C9C8C8"/>
			</svg>	
			<div class="pl-2">{name}</div>
		</div>
	{/if}
	

	{#if expanded}

		<ul class="text-white w-full">

			{#each configs as [key, value]}

				<li class="{`bg-opacity-${counter*25}`} bg-select-saturate-10 py-1 px-2 my-1 flex flex-col rounded-lg w-full">

						{#if isDeeper(key, value)}
							<svelte:self on:double-click name={key} {counter} {index} configs={Object.entries(value)}/>
						{:else}
							<div>
								<Preset on:double-click {index} {counter} sub={name} {...value}/>
							</div>
						{/if}
	
				</li>

			{/each}

		</ul>

	{/if}
</div>

<style>

</style>