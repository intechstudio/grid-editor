<script>
  import grid from "../protocol/grid-protocol";
  import { pParser } from "../protocol/_utils";
  import {serialComm} from "../serialport/serialport.store";
  
  import { runtime, debug_store } from "../runtime/runtime.store";
  import _utils, { luaParser } from "../runtime/_utils";

  let runtimeScript = '';
  let runtimeParser = '';

  let configs = [];

  debug_store.subscribe(active => {
    _utils.gridLuaToEditorLua(active.config).then(res => { 
      configs = res;
      let code = '';
      configs.forEach((e,i) => {
        code += `--[[@${e.short}]] ` + e.script + "\n";  
      }); 
      runtimeScript = '<?lua ' + '\n' + code + ' ?>';
      runtimeParser = luaParser(code, {comments: true});
    }).catch(err => {console.error(err); configs = [];})
  })

  
  let brc = [0,0,0,0];
  let [command_1, command_2] = ['', ''];

	function debug(){
    let data = grid.translate.encode_debugger(brc, command_1);
		serialComm.write(data);
  }

  function charCount(text){
    return text.length;
  }


</script>

<config-debug class="w-full h-full flex flex-col p-4 z-10 bg-primary">
  <!--
    <div class="flex flex-col w-full text-white p-2">

      <div class="flex w-full">

        <div class="mr-1">
          <div>dx</div>
          <input class="w-full rounded bg-secondary py-0.5 px-1 text-white focus:outline-none" bind:value={brc[0]}>
        </div>
        <div class="mx-1">
          <div>dy</div>
          <input class="w-full rounded bg-secondary py-0.5 px-1 text-white focus:outline-none" bind:value={brc[1]}>
        </div>
        <div class="mx-1">
          <div>age</div>
          <input class="w-full rounded bg-secondary py-0.5 px-1 text-white focus:outline-none" bind:value={brc[2]}>
        </div>
        <div class="ml-1">
          <div>rot</div>
          <input class="w-full rounded bg-secondary py-0.5 px-1 text-white focus:outline-none" bind:value={brc[3]}>
        </div>

      </div>

      <div class="w-full mt-1">

        <div>command 1</div>
        <input class="w-full rounded bg-secondary py-0.5 px-1 text-white focus:outline-none"  bind:value={command_1}>

      </div>

    </div>
  -->
  <textarea style="min-height:300px;" spellcheck="false" bind:value={runtimeScript} class="w-full cursor-default bg-secondary rounded px-1 my-2 text-white font-mono"/>


  <div class="flex justify-between items-center">  
    
    <div class="mx-1 my-2">
      <div class="text-white">Syntax: {runtimeParser}</div>
      <div class="text-white">Char count: {@html charCount(runtimeScript) > 120 ? `<span class="text-yellow-400">${charCount(runtimeScript)}</span>` : `${charCount(runtimeScript)}`}</div>
    </div>

    <button on:click={debug} class="rounded my-2 bg-green-700 hover:bg-green-900 text-white px-2 py-2 w-32 mr-2">Send To Grid</button>

  </div>

  <div class="flex text-white items-center"> 
    <input class="mr-1" type="checkbox" bind:checked={$debug_store.enabled}>
    <div class="ml-1">Enable DEBUGTEXT</div>
  </div>

  <div class="flex text-white items-center"> 
    <button class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded" on:click={()=>{debug_store.update(s => {s.data = []; return s})}}>Clear DEBUGTEXT</button>
  </div>

  {#if $debug_store.data.length }
    <div class="flex flex-col font-mono overflow-y-auto text-white bg-secondary m-1">
      {#each $debug_store.data as debug, i}
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