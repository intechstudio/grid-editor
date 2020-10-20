<script>
    
  import { GRID_PROTOCOL } from '../../core/classes/GridProtocol.js';

  import { serialComm } from '../../core/serialport/serialport.store.js';

  import Tooltip from '../../shared/helpers/Tooltip.svelte';

  import { fade } from 'svelte/transition';

  import { commands} from './handshake.store.js';

  import { configStore } from '../../stores/config.store.js';

  import { onMount } from 'svelte';

  export let MODE = '';

  let _comm;

  function handleStore(){
    const command = GRID_PROTOCOL.encode('',`${MODE}STORE`,'','');
    serialComm.write(command);

    // set configs
    commands.validity(`${MODE}STORE`,false)

    commands.start(`${MODE}STORE`);

    console.log(`Store ${MODE} settings on Grid!`)
  }

  function handleRecall(){
    const command = GRID_PROTOCOL.encode('',`${MODE}LOAD`,'','');
    serialComm.write(command);

    commands.start(`${MODE}RECALL`);

    console.log(`Recall ${MODE} settings on Grid!`)
  }

  function handleClear(){
    const command = GRID_PROTOCOL.encode('',`${MODE}CLEAR`,'','');
    serialComm.write(command);

    commands.start(`${MODE}CLEAR`);

    console.log(`Clear ${MODE} settings on Grid!`)
  }

  let tooltip;
  onMount(()=>{
    if(MODE == 'GLOBAL'){
      tooltip = "Store will save your global configuration in your Grid modules memory and Clear will clear it from there."
    } else {
      tooltip = "Store will save your local configuration in your Grid modules memory and Clear will clear it from there."
    }

    commands.subscribe(value => console.log(value))
  });

</script>

<div class="bg-primary flex flex-col rounded-lg z-20">
  <div class="flex flex-grow justify-between m-2 rounded-lg">
    <div class="flex">
      <button 
        on:click={handleStore} 
        class:disabled={!$commands[MODE+'STORE'].valid} 
        class:enabled={$commands[MODE+'STORE'].valid} 
        disabled={!$commands[MODE+'STORE'].valid}
        class:success={$commands[MODE+'STORE'].msg == 'success' && !$commands[MODE+'STORE'].valid} 
        class="button store">
        
        {#if $commands[MODE+'STORE'].msg == 'wait'}      
          <div transition:fade>
            <div class="mr-1 loader ease-linear rounded-full border-2 border-t-2 h-4 w-4 border-secondary"></div>
          </div>
        {/if}
        <div class:clicked={$commands[MODE+'STORE'].msg == 'wait'} class="transition-all duration-500 delay-200 ease-in-out">Store</div>
      </button>
    </div>
    <div class="flex items-center">
      <button 
      on:click={handleClear} 
      class:disabled={$commands[MODE+'CLEAR'].msg == 'wait'} 
      class:success={$commands[MODE+'CLEAR'].msg == 'success'}
      disabled={$commands[MODE+'CLEAR'].msg == 'wait'}
      class="button clear">
        {#if $commands[MODE+'CLEAR'].msg == 'wait'}      
          <div transition:fade>
            <div class="mr-1 loader ease-linear rounded-full border-2 border-t-2 h-4 w-4 border-secondary"></div>
          </div>
        {/if}
        <div class:clicked={$commands[MODE+'CLEAR'].msg == 'wait'} class="transition-all duration-500 delay-200 ease-in-out">Clear</div>
      </button>
      <!--<Tooltip text={tooltip}/>-->
    </div>
    
  </div>

  {#if $commands[MODE+'STORE'].msg == 'failure' || $commands[MODE+'CLEAR'].msg == 'failure'}
    <div class="text-important text-xs pl-2">Failed to catch response from Grid in time...</div>
  {/if}

</div>

<style>

  .clicked {
    margin-left: 8px;
  }

  .loader {
    border-top-color: #e4d203;
    -webkit-animation: spinner 1.5s linear infinite;
    animation: spinner 1.5s linear infinite;
  }
          
  @-webkit-keyframes spinner {
    0% { -webkit-transform: rotate(0deg); }
    100% { -webkit-transform: rotate(360deg); }
  }

  @keyframes spinner {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .button{
    border-radius: 0.25rem;
    padding-right: 0.5rem;
    padding-left: 0.5rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    color: white;
    transition: all 250ms ease-in-out;
    outline: none;
    border-width: 1.5px;
    border-style: solid;
  }

  .clear{
    border-color: #2a3439;
    background-color:#2a3439;
  }

  .disabled {
    cursor:not-allowed;
    background-color: transparent;
  }

  .disabled.store {
    border-color: #cc5b5b;
  }

  .enabled{
    background-color: #cc5b5b;
    border-color:#cc5b5b;
    cursor:pointer;
  }

  .enabled:hover{
    background-color:#c95050;
  }

  .success.store{
    animation: success-store 2s ease-in-out;
  }

  .success.clear{
    animation: success-clear 2s ease-in-out;
  }

  @keyframes success-store {
    0%  { border-color: green; }
    50%  { border-color: green; }
    100% { border-color: #cc5b5b; }
  }

  @keyframes success-clear {
    0%  { border-color: green; }
    50%  { border-color: green; }
    100% { border-color: #2a3439; }
  }

</style>