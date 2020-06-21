<script>
  import { onMount } from 'svelte';

  import { cells } from './cells.store.js';
  
  import PO16 from '../modules/PO16.svelte';
  import PBF4 from '../modules/PBF4.svelte';

  export let size = 2;

  $: cellSize = size * 106.6 + 10;

  console.log($cells.used);
 
</script>

<style>


</style>

<div class="relative overflow-hidden w-full flex flex-col h-full">
settings
</div>

  
