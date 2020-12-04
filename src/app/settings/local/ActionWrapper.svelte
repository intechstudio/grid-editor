<script>

  import { createEventDispatcher, onMount } from 'svelte';

  import MidiRelative from './actions/MidiRelative.svelte';
  import MidiAbsolute from './actions/MidiAbsolute.svelte';
  import SetLedColor from './actions/SetLedColor.svelte';
  import SetLedPhase from './actions/SetLedPhase.svelte';
  import RawAction from './actions/RawAction.svelte';
  import HidKeyboard from './actions/HidKeyboard.svelte';
  import MacroKeyboard from './actions/MacroKeyboard.svelte';

  const dispatch = createEventDispatcher();

  export let action;
  export let index;
  export let eventInfo;
  export let elementInfo;

  const components = {
    'MIDIRELATIVE': MidiRelative,
    'MIDIABSOLUTE': MidiAbsolute,
    'LEDCOLOR': SetLedColor,
    'LEDPHASE': SetLedPhase,
    'RAW': RawAction,
    'HIDKEYBOARD': HidKeyboard,
    'MACROKEYBOARD': MacroKeyboard
  }

  function handleRemove(){
    dispatch('remove', {
      action: action,
      index: index
    })
  }

  function sendData(e){
    dispatch('change', {
      action: e.detail.action, // important! action parameters are converted at action level to grid protocol readable format
      index: index
    })
  }


</script>

<main class="flex flex-col w-full"> 
  
  <div class="w-full flex p-0 mx-2">

    <svelte:component this={components[action.value]} on:send={sendData} bind:action={action} {index} {eventInfo} {elementInfo} />    

    <div>
      <div class="invisible text-xs">Remove</div>
      <div on:click={handleRemove} class="block p-2 w-8 h-8  bg-secondary hover:bg-black cursor-pointer">
        <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 1.00001L1.01053 13M12.9895 13L1 1" stroke="#BBBBBB" stroke-width="2"/>
        </svg>
      </div>
    </div>
  </div>

</main>

