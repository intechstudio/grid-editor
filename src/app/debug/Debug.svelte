<script>
import grid from "../protocol/grid-protocol";
import { pParser } from "../protocol/_utils";
import {serialComm} from "../serialport/serialport.store";

  
  import { runtime, debug as debugtext } from "../runtime/runtime.store";
  import _utils, { luaParser } from "../runtime/_utils";

  let runtimeScript = '';
  let runtimeParser = '';

  let configs = [];

  runtime.active_config(active => {
    _utils.gridLuaToEditorLua(active.config).then(res => { 
      configs = res;
      let code = '';
      configs.forEach((e,i) => {
        code += `--[[@${e.short}]] ` + e.script + "\n";  
      }); 
      runtimeScript = '<?lua ' + code.replace(/(\r\n|\n|\r)/gm, "") + ' ?>';
      runtimeParser = luaParser(code, {comments: true});
    }).catch(err => {console.error(err); configs = [];})
  })

  
  let brc = [0,0,0,0];
  let [command_1, command_2] = ['', ''];

	function debug(){
    let data = grid.translate.encode_debugger(brc, command_1);
    console.log(data);
		serialComm.write(data);
  }

  function heartbeat() {
    const command = grid.translate.encode(
      {dx: 0, dy: 0, rot: -0},
      `HEARTBEAT`,
      'EXECUTE',
      [
        { TYPE: pParser(255)}, 
        { HWCFG: pParser(255)}, 
        { VMAJOR: pParser(1)}, 
        { VMINOR: pParser(1)}, 
        { VPATCH: pParser(9)}, 
      ], 
      ''
    );
    serialComm.write(command);
  }
  
  function charCount(text){
    return text.length;
  }

  let debugText = [];




</script>

<config-debug class="w-full flex flex-col p-4 z-10">

  <div class="flex flex-col md:flex-row text-white md:items-end p-2">

    <div class="mr-1">
      <div>dx</div>
      <input class="w-full md:w-10 p-1 text-black focus:outline-none" bind:value={brc[0]}>
    </div>
    <div class="mx-1">
      <div>dy</div>
      <input class="w-full md:w-10 p-1 text-black focus:outline-none"  bind:value={brc[1]}>
    </div>
    <div class="mx-1">
      <div>age</div>
      <input class="w-full md:w-10 p-1 text-black focus:outline-none"  bind:value={brc[2]}>
    </div>
    <div class="mx-1">
      <div>rot</div>
      <input class="w-full md:w-10 p-1 text-black focus:outline-none"  bind:value={brc[3]}>
    </div>
    <div class="mx-1">
      <div>command 1</div>
      <input class="w-full md:w-32 p-1 text-black focus:outline-none"  bind:value={command_1}>
    </div>

  </div>

  <textarea style="min-height:100px;" spellcheck="false" bind:value={runtimeScript} class="w-full cursor-default bg-primary rounded px-1 my-2 text-white font-mono"/>


  <div class="mx-1 my-2">
    <div class="text-white">Syntax check: {runtimeParser}</div>

    <div class="text-white">Char count: {@html charCount(runtimeScript) > 120 ? `<span class="text-yellow-400">${charCount(runtimeScript)}</span>` : `${charCount(runtimeScript)}`}</div>
  </div>

  <div class="flex">
    <button on:click={debug} class="rounded my-2 bg-green-700 hover:bg-green-900 text-white px-2 py-2 w-32 mr-2">Send To Grid</button>
    <button on:click={()=>{heartbeat()}} class="rounded my-2 bg-pink-700 hover:bg-pink-900 text-white px-2 py-2 w-32 mr-2">Heartbeat ❤️</button>
  </div>


  <div class="flex flex-col font-mono overflow-y-auto text-white bg-primary-900 p-2">
    {#each $debugtext.data as debug, i}
      <span class="debugtexty py-0.5">{debug}</span>
    {/each}
  </div>

</config-debug>

<style>


  .debugtexty:nth-child(even){
    @apply bg-select;
  }

</style>