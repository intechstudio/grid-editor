<script>
import grid from "../protocol/grid-protocol";
import { pParser } from "../protocol/_utils";
import {serialComm} from "../serialport/serialport.store";

  
  import { runtime } from "../runtime/runtime.store";
  import _utils, { luaParser } from "../runtime/_utils";

  let runtimeScript = '';
  let runtimeParser = '';

  export let configs = {lua: []};

  
  let brc = [0,0,0,0];
  let [command_1, command_2] = ['', ''];
  

 $: if(configs){
    //console.log(s)
    let code = '';
    
    configs.forEach((e,i) => {
      code += `--[[@${e.short}]] ` + e.script + "\n";  
    }); 
    runtimeScript = '<?lua ' + code.replace(/(\r\n|\n|\r)/gm, "") + ' ?>';
    runtimeParser = luaParser(code, {comments: true});
    
  }

	function debug(){
    let data = grid.translate.encode_debugger(brc, command_1+runtimeScript+command_2);
    console.log(data);
		serialComm.write(data);
  }
  
  function store() {
    const command = grid.translate.encode('',`CONFIGSTORE`,'EXECUTE','');
    console.log(command);
    serialComm.write(command);
  }

  function clear() {
    const command = grid.translate.encode('',`CONFIGERASE`,'EXECUTE','');
    console.log(command);
    serialComm.write(command);
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

  <div class="mx-1">
    <div class="text-white">command 2</div>
    <input class="w-full md:w-32 p-1 text-black focus:outline-none"  bind:value={command_2}>
  </div>

  <div class="mx-1 my-2">
    <div class="text-white">Syntax check: {runtimeParser}</div>

    <div class="text-white">Char count: {@html charCount(runtimeScript) > 120 ? `<span class="text-yellow-400">${charCount(runtimeScript)}</span>` : `${charCount(runtimeScript)}`}</div>
  </div>

  <div class="flex">
    <button on:click={debug} class="rounded my-2 bg-green-700 hover:bg-green-900 text-white px-2 py-2 w-32 mr-2">Send To Grid</button>
    <button on:click={()=>{store()}} class="rounded my-2 bg-purple-700 hover:bg-purple-900 text-white px-2 py-2 w-32 mr-2">Store</button>
    <button on:click={()=>{clear()}} class="rounded my-2 bg-yellow-700 hover:bg-yellow-900 text-white px-2 py-2 w-32 mr-2">Clear</button>
    <button on:click={()=>{heartbeat()}} class="rounded my-2 bg-pink-700 hover:bg-pink-900 text-white px-2 py-2 w-32 mr-2">Heartbeat ❤️</button>
  </div>
</config-debug>