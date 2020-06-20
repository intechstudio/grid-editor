<script>
  import { onMount } from 'svelte';
  
  import { palette } from '../tools/devTool/palette.store';

  import PO16 from '../modules/PO16.svelte';
  import PBF4 from '../modules/PBF4.svelte';

  import Grid from './Grid.svelte';

  export let size = 1.25;

  let map;

</script>

<style>


</style>

<div class="w-full h-full items-center justify-center">
  <Grid {size}/>
</div>

  
