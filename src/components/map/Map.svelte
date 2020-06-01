<script>
  import { onMount } from 'svelte';
  
  import { palette } from '../tools/devTool/palette.store';

  import PO16 from '../modules/PO16.svelte';
  import PBF4 from '../modules/PBF4.svelte';

  import Grid from './Grid.svelte';

  export let size = 1;

  let map;

</script>

<style>

  #map{
    position: absolute;
    display: flex;
    z-index: 9999;
  }

</style>

<div id="map" class="w-full items-center justify-center">
  <Grid {size}/>
  <!--<svelte:component this={PBF4} {size}/>-->
  </div>

  
