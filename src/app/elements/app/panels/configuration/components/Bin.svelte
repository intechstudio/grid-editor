<script>
  import { onMount } from "svelte";
  import { fade } from 'svelte/transition';

  let isOverBin = false;

  let ready = false;
  onMount(()=>{
    ready = true;
  })

</script>

{#if ready}
  <div
    in:fade={{delay:100, duration: 150}}
    on:mouseenter="{(e)=>{isOverBin = true}}" 
    on:mouseleave="{(e)=>{isOverBin = false}}" 
    on:mouseup="{(e)=>{}}" id="action-bin" class="px-4 pt-1 pb-2 w-full text-white ">
    <div class="{isOverBin ? 'bg-opacity-100' : 'bg-opacity-50'} transition-all duration-300 pointer-events-none p-2 flex w-full items-center justify-center rounded-lg bg-red-500 ">
      <div>Remove action...</div>
      <svg class="ml-2 w-6 h-6 fill-current text-white" viewBox="0 0 512 512"  xmlns="http://www.w3.org/2000/svg">
        <path d="m256 512c-68.378906 0-132.667969-26.628906-181.019531-74.980469-48.351563-48.351562-74.980469-112.640625-74.980469-181.019531s26.628906-132.667969 74.980469-181.019531c48.351562-48.351563 112.640625-74.980469 181.019531-74.980469s132.667969 26.628906 181.019531 74.980469c48.351563 48.351562 74.980469 112.640625 74.980469 181.019531s-26.628906 132.667969-74.980469 181.019531c-48.351562 48.351563-112.640625 74.980469-181.019531 74.980469zm0-472c-119.101562 0-216 96.898438-216 216s96.898438 216 216 216 216-96.898438 216-216-96.898438-216-216-216zm110 195.980469h-220v40h220zm0 0"/>
      </svg>
    </div>
  </div>
{/if}