<script>
  import { createEventDispatcher } from 'svelte';

  import { appSettings } from './app-settings.store';

  $appSettings.size = 2;

</script>

<div class="w-full flex text-white items-center primary ">
  <div class="text-xlbold p-4 uppercase">Editor</div>

  <label class="">
  Size
  <input class="text-black w-10 text-center" type="number" bind:value={$appSettings.size}>
  </label>
</div>