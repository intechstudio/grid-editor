<script>

  import { onMount } from 'svelte';

  import { clickOutside } from './clickOutside.js'
  
  export let dropDownValue;
  export let dropDownInfo;
  export let optionList = [];
  export let parameterType;
  
  let focus;

  onMount(()=>{
    console.log(parameterType);
  })

</script>

<main class="relative w-full" use:clickOutside on:click-outside={()=>{focus = false}}>
  <input class:shadow={focus} on:focus={()=>{focus = true}} bind:value={dropDownValue}  type="text" class="w-full secondary text-white p-1 pl-2 rounded-none focus:outline-none">
  {#if focus}
    <ul class:shadow={focus} style="z-index:9999" class="block border-t border-important text-white cursor-pointer absolute bg-secondary w-full">
      {#each optionList as option}
        <li on:click={(e)=>{dropDownValue = option.value; dropDownInfo = option.info_1; focus = false;}} class="hover:bg-black p-1 pl-2 ">{option.value + ' ' + option.info_1 + ' ' + option.info_2}</li>
      {/each}
    </ul>
  {/if}
</main>