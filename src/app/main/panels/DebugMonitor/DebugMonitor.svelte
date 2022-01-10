<script>
  import { get } from 'svelte/store';
  import { debug_monitor_store, debug_lowlevel_store } from "./DebugMonitor.store";
  import _utils, { luaParser } from "../../../runtime/_utils";
  import { appSettings } from '../../../runtime/app-helper.store';
  import {luadebug_store} from "../../../runtime/runtime.store"

  let runtimeScript = '';
  let runtimeParser = '';

  let configs = [];

  luadebug_store.subscribe(active => {
    let res = _utils.gridLuaToEditorLua(active.config)
     
    configs = res;
    let code = '';
    configs.forEach((e,i) => {
      code += `--[[@${e.short}]] ` + e.script + "\n";  
    }); 
    runtimeScript = '<?lua ' + '\n' + code + '?>';
    runtimeParser = luaParser(code, {comments: true});
    
  });


  function charCount(text){
    return text.length;
  }


  let frozen = false;

  function freezeDebugtext() {
    frozen = true;
    debug_monitor_store.freeze()
    debug_lowlevel_store.freeze()

  }  
  
  function unfreezeDebugtext() {
    frozen = false;
    debug_monitor_store.unfreeze()
    debug_lowlevel_store.unfreeze()
    
  }

  function clearDebugtext() {
    
    debug_monitor_store.update(s => {s = []; return s})
    debug_lowlevel_store.update(s => {s = []; return s})
  }

  let display = "CHAR"

</script>

<config-debug class="w-full h-full flex flex-col p-4 z-10 bg-primary">

  <div class="text-white">
    Editor v{$appSettings.version.major}.{$appSettings.version.minor}.{$appSettings.version.patch}  
  </div>
  <textarea spellcheck="false" bind:value={runtimeScript} class="w-full cursor-default min-h-[200px] bg-secondary rounded px-1 my-2 text-white font-mono"/>


  <div class="flex justify-between  min-h-[70px] items-center overflow-y-auto">  
    
    <div class="mx-1 my-2">
      <div class="text-white">Syntax: {runtimeParser}</div>
      <div class="text-white">Char count: {@html charCount(runtimeScript) > 120 ? `<span class="text-yellow-400">${charCount(runtimeScript)}</span>` : `${charCount(runtimeScript)}`}</div>
    </div>
  </div>


  <div class="flex text-white items-center"> 
    <button 
      class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded" 
      on:click={clearDebugtext}>Clear
    </button>
    <button 
      class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded" 
      on:click={()=>{display = "DEC"}}>DEC
    </button>
    <button 
      class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded" 
      on:click={()=>{display = "HEX"}}>HEX
    </button>
    <button 
      class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded" 
      on:click={()=>{display = "CHAR"}}>CHAR
    </button>

    {#if frozen == false}   
      <button 
        class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded" 
        on:click={freezeDebugtext}>Freeze
      </button>
    {:else}
      <button 
        class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded" 
        on:click={unfreezeDebugtext}>Unfreeze
      </button>
    {/if}


  </div>

  {#if $debug_monitor_store.length != 0}
    <div class="text-white">
      Debug Text: 
    </div>
    <div class="flex flex-col font-mono overflow-y-auto text-white bg-secondary m-1 min-h-[200px]">
      {#each $debug_monitor_store as debug, i}
        <span class="debugtexty px-1 py-0.5 ">{debug}</span>
      {/each}
    </div>
  {/if}

  {#if $debug_lowlevel_store.length != 0}
    <div class="text-white">
      Raw Packet: 
    </div>
 
    <div class="selectable flex flex-col font-mono overflow-y-auto text-white m-1 h-1/2">
      {#each $debug_lowlevel_store as debug, i}
        
        <span class="px-1 py-0.5 my-1 {debug.direction == "IN"?"input":"output"}">
          {#each debug.data as char, i}
            {#if display=="DEC"}
            {char + " "}
            {:else if display=="HEX"}
            {"0x"+(char<16?"0":"")+char.toString(16).toUpperCase() + " "}
            {:else}
            {String.fromCharCode(char)}
            {/if}
          {/each}

        </span>
      {/each}
    </div>
  {/if}



</config-debug>

<style>

  .debugtexty:nth-child(even){
    @apply bg-select;
  }

	.output{
		background-color: rgb(44, 44, 80);
		font-weight: bold;
	}

	.input{
		background-color: rgb(39, 87, 50);
		font-weight: bold;
	}

  .selectable{
    user-select: text;
  }

</style>