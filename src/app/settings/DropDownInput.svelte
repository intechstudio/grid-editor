<script>

  import { clickOutside } from './clickOutside.js'
  
  export let dropDownValue = {value:'', info: '', gridProtocolname: ''};
  export let optionList = [];

  $: {
    dropDownValue.gridProtocolName =  optionList[0].gridProtocolName;
  }
  
  let focus;

</script>

<main class="relative w-full" use:clickOutside on:click-outside={()=>{focus = false}}>
  <input class:shadow={focus} on:focus={()=>{focus = true}} bind:value={dropDownValue.value} type="text" class="w-full secondary text-white p-1 pl-2 rounded-none focus:outline-none">
  {#if focus}
    <ul class:shadow={focus} style="z-index:9999" class="block border-t border-important text-white cursor-pointer absolute bg-secondary w-full">
      {#each optionList as option}
        <li on:click={(e)=>{dropDownValue = option; focus = false;}} class="hover:bg-black p-1 pl-2 ">{option.value + ' | ' + option.info}</li>
      {/each}
    </ul>
  {/if}
</main>