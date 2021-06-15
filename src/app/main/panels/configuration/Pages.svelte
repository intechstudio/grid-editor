<script>

  import { onMount } from 'svelte';

  import { get } from 'svelte/store';

  import { logger, runtime, user_input } from '../../../runtime/runtime.store.js';

  export let pages;

  let alert = false;

  let manage = false;
  function managePages(){
    manage = ! manage;
  }

  let selectedPage = undefined;
  function handleSelectPage(page) {
    if(get(runtime.unsaved) == 0){
      selectedPage = page;
      user_input.update_pagenumber.pagenumber(selectedPage).sendToGrid();
    }
    else{
      logger.set({type: 'alert', classname: 'pagechange', message: 'Store your config before switching pages!'});
    }
  }

  const design = (page) => {
    let style = '';
    if(page !== ''){
      if(selectedPage == page){
        style = 'shadow-md bg-pick text-white';
      } else {
        style = 'hover:bg-pick-desaturate-10 text-gray-50'
      }
    } else {
      style = 'dummy'
    }

    return style;
  }

  $: selectedPage = pages.selected;

</script>

<page-controller class="{pages.options.includes('') && 'pointer-events-none'} relative rounded-tl-lg px-4 pb-4 pt-2 mt-4 flex flex-col w-full bg-primary">


  {#if alert}
  
  <div class="absolute left-0 mt-4 w-56 -ml-60 text-center text-white bg-red-500 p-4 rounded">
    Store your config before changing pages!
  </div>
  

  {/if}

  <div class="text-gray-500 py-1 text-sm">
    Pages
  </div>

  <div class="flex bg-secondary shadow overflow-x-auto">
    {#each pages.options as page}
      <button 
        on:click={()=>{handleSelectPage(page)}}           
        class="{design(page)} m-2 p-1 flex-grow border-0 rounded focus:outline-none">
        {@html page !== '' ? page : `<span class="invisible">null</span>`}
      </button>

      {#if manage}
        <button class="text-sm py-0.5 px-4 text-white rounded-full hover:bg-select focus:ring-0 focus:outline-none border border-select-saturate-10 shadow hover:border-purple-500">
          <svg class="w-5 h-5 p-1 fill-current text-white" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
            <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
          </svg>
        </button>
      {/if}

      <button class="{ manage ?  'flex' : 'invisible' } h-5 w-5 rounded-full text-center  items-center justify-center bg-pick">
        <svg class="w-5 h-5 p-1" viewBox="0 0 7 7" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 0.5C3.77614 0.5 4 0.723858 4 1V3H6C6.27614 3 6.5 3.22386 6.5 3.5C6.5 3.77614 6.27614 4 6 4H4V6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6V4H1C0.723858 4 0.5 3.77614 0.5 3.5C0.5 3.22386 0.723858 3 1 3H3V1C3 0.723858 3.22386 0.5 3.5 0.5Z" fill="white"/>
        </svg>
      </button>

    {/each}
  </div>

  <!--
  <button 
    on:click={managePages} 
    class="text-sm py-0.5 px-4 text-white rounded-full hover:bg-select focus:ring-0 focus:outline-none border border-select-saturate-10 shadow hover:border-purple-500">
    Select
  </button>
  -->

</page-controller>

<style>

  .dummy{
    @apply bg-select;
    @apply bg-opacity-50;
  }

  .triangle-right{
    width:0px;
    height:0px;
    border:10px solid;
    border-top-color: transparent;
    border-left-color: green;
    border-right-color: transparent;
    border-bottom-color: transparent;
  }
</style>