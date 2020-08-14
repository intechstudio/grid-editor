<script>

  import { clickOutside } from './clickOutside.js'
  
  export let dropDownValue = ''
  export let optionList = [];
  
  let focus;

</script>

<main class="w-full relative" use:clickOutside on:click-outside={()=>{focus = false}}>
  <input class:shadow={focus} on:click={()=>{focus = true}} bind:value={dropDownValue} on:input={(e)=>{focus = false}} type="text" class="w-full secondary text-white p-1 pl-2 rounded-none focus:outline-none">
  {#if focus}
    <ul class:shadow={focus} class="block border-t border-important text-white cursor-pointer absolute bg-secondary w-full z-50">
      {#each optionList as option, index}
        <li on:click={(e)=>{dropDownValue = option.value; focus = false;}} class="hover:bg-black p-1 pl-2">{option.info}</li>
      {/each}
    </ul>
  {/if}
</main>