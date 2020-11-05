<script>

  import { tour } from '../../stores/tour.store';

  let selected = 0;

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
    }
  ];

  function incrementSelected(){
    if(tourJson.length){
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


</script>


<div id="tour-container" class="absolute w-full bottom-1 flex justify-center text-white">
  <div style="z-index:9000;width:600px" class="relative inline-block bg-black rounded-lg p-4">
    {#each tourJson as tour, index}
      {#if index == selected}
        <h1 class="text-xl font-bold">{tour.title}</h1>
        <p class="py-2">{@html tour.text}</p>
      {/if}
    {/each}
    <div style="z-index:9000" class="pt-2 relative flex w-full justify-between">
      <button on:click={decrementSelected} class="hover:bg-secondary text-white px-2 py-1 rounded focus:outline-none border-secondary">Previous</button>
      <button on:click={incrementSelected} class="bg-highlight-400 hover:bg-highlight px-2 py-1 rounded focus:outline-none border-none font-semibold">Next</button>
    </div>
  </div>
</div>

<style>
  :global(.tour){
    @apply border-2;
    @apply border-important;
    @apply border-solid;
  }
</style>