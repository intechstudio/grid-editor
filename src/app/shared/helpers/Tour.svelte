<script>
  import { onMount } from 'svelte';

  import { fade } from 'svelte/transition';

  import { tour } from '../../stores/tour.store';

  let selected = 0;

  let tourEnabled = undefined;

  const tourJson = [
    {
      title: 'Welcome!',
      section: '',
      text: 'This demo application serves the purpose to give a look and feel about Grid and Grid Editor features.'
    },
    {
      title: 'Add a module!',
      section: 'DragModule',
      text: `
        <p>Before you can use global and local settings in Grid Editor, a module has to be added.</p>
        <p class="pt-2">1. Open the <i class="pr-1 text-important">Virtual Modules</i> panel.</p>
        <p class="py-1">2. Drag a module and drop it into the highlighted area.</p>
      `
    },
    {
      title: 'Local Settings',
      section: 'LocalSettings',
      text: `
        <p>Here you can adjust and configure functions assigned to a module on a per-element basis.</p>
        <p class="pt-2">1. Close the <i class="pr-1 text-red-500">Virtual Modules</i> panel.</p>
        <p class="pt-1">2. Click on any of the control elements.</p>
        <p class="py-1">3. <i class="pr-1 text-important">Local Settings</i> panel is now populated with settings.</p>
        <p class="">
          A <b>Control Element</b> refers to a specific potentiometer, button, encoder or fader on your Grid module. 
          Each <b>Control Element</b> has a number assigned to it and you can also see the currently selected <b>Control Element</b> highlighted in the layout.
        </p>
      `
    },
    {
      title: 'Events',
      section: 'Events',
      text: `
        <p>
          Events describe every physical interaction that a given Control Element can recognize.
          For example pressing down (DOWN) or releasing a button (UP) are two different inputs.
        </p>
      `
    },
    {
      title: 'Actions',
      section: 'Actions',
      text: `
        <p>Actions describe functions that you can assign to inputs on a per-Element, per-Event basis.</p>
        <p class="pt-1">Click on the select menu to see possible actions for the element you selected.</p>
      `
    },
    {
      title: 'Global Settings',
      section: 'GlobalSettings',
      text: `
        <p>
          Global Settings panel reflects changes made on all the connected control modules as a control surface. 
          As of today, Bank settings are the global settings.
        </p>
        <p class="pt-1">
          The term Bank, refers to an independently customisable mode of a given Grid module. 
          At default you have four (4) Banks available to you on each Grid module. 
          Banks store their settings independently from each other, so you can configure multiple different setups and switch between them on the fly.  
        </p>
      `
    },
    {
      title: 'Plans for the future...',
      section: 'end',
      text: `
        <p>
         Grid Editor is a cross platform software for Mac OS, Windows and Linux, which can be downloaded from our GitHub page. 
         As Chrome does support experimentally serial devices, this browser version of the Editor may be a full featured application in the future.
         For now, it's a demo to give you a bit of insight what can be achieved here.
        </p>
        <p class="pt-1">
          Thank you for giving a spin at Grid Editor demo!
        </p>
      `
    }
  ];

  function incrementSelected(){
    if(selected < tourJson.length-1){
      selected = selected + 1;
      $tour.selectedName = tourJson[selected].section;
    }
  }

  function decrementSelected(){
    if(selected !== 0){
      selected = selected - 1;
      $tour.selectedName = tourJson[selected].section;
    }
  }

  onMount(()=>{
    tourEnabled = true;
  })


</script>


{#if tourEnabled}

  <div transition:fade id="tour-container" class="absolute w-full bottom-1 flex justify-center text-white">
    
    <div style="z-index:9000;width:600px" class="relative inline-block bg-black rounded-lg p-4">
      <button on:click={()=>{tourEnabled = false}} class="absolute top-1 focus:outline-none bg-none border-none right-1 w-4 h-4">
        <svg style="fill:white;"  viewBox="0 0 329.26933 329" xmlns="http://www.w3.org/2000/svg"><path d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.210937-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.824219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.824219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.089844 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.824219 0-30.164063zm0 0"/></svg>
      </button>
      {#each tourJson as tour, index}
        {#if index == selected}
          <h1 class="text-xl font-bold">{tour.title}</h1>
          <p class="py-2">{@html tour.text}</p>
        {/if}
      {/each}
      <div style="z-index:9000" class="pt-2 relative flex w-full justify-between">
        <button on:click={decrementSelected} class="hover:bg-secondary text-white px-2 py-1 rounded focus:outline-none border-secondary">Previous</button>
        {#if selected !== tourJson.length-1}<button on:click={incrementSelected} class="bg-highlight-400 hover:bg-highlight px-2 py-1 rounded focus:outline-none border-none font-semibold">Next</button>{/if}
      </div>
    </div>
  </div>

{/if}

<style>
  :global(.tour){
    @apply border-2;
    @apply border-important;
    @apply border-solid;
  }
</style>