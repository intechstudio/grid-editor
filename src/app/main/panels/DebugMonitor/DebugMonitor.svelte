<script>
  
  import { debug_monitor_store } from "./DebugMonitor.store";
  import _utils, { luaParser } from "../../../runtime/_utils";

  import {luadebug_store} from "../../../runtime/runtime.store"

  let runtimeScript = '';
  let runtimeParser = '';

  let configs = [];

  luadebug_store.subscribe(active => {
    _utils.gridLuaToEditorLua(active.config).then(res => { 
      configs = res;
      let code = '';
      configs.forEach((e,i) => {
        code += `--[[@${e.short}]] ` + e.script + "\n";  
      }); 
      runtimeScript = '<?lua ' + '\n' + code + '?>';
      runtimeParser = luaParser(code, {comments: true});
    })
  });


  function charCount(text){
    return text.length;
  }


</script>

<config-debug class="w-full h-full flex flex-col p-4 z-10 bg-primary">

  <textarea spellcheck="false" bind:value={runtimeScript} class="w-full cursor-default bg-secondary rounded px-1 my-2 text-white font-mono"/>


  <div class="flex justify-between items-center overflow-y-auto">  
    
    <div class="mx-1 my-2">
      <div class="text-white">Syntax: {runtimeParser}</div>
      <div class="text-white">Char count: {@html charCount(runtimeScript) > 120 ? `<span class="text-yellow-400">${charCount(runtimeScript)}</span>` : `${charCount(runtimeScript)}`}</div>
    </div>
  </div>


  <div class="flex text-white items-center"> 
    <button class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded" on:click={()=>{debug_monitor_store.update(s => {s = []; return s})}}>Clear DEBUGTEXT</button>
  </div>

  {#if $debug_monitor_store.length != 0}
    <div class="flex flex-col font-mono overflow-y-auto text-white bg-secondary m-1">
      {#each $debug_monitor_store as debug, i}
        <span class="debugtexty px-1 py-0.5 ">{debug}</span>
      {/each}
    </div>
  {/if}
</config-debug>

<style>

  .debugtexty:nth-child(even){
    @apply bg-select;
  }

</style>