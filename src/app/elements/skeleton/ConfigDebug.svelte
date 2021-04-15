<script>

  export let actions;

  import { serialComm, serialCommDebug } from '../../core/serialport/serialport.store';

	import { GRID_PROTOCOL } from '../../core/classes/GridProtocol';

  import { runtime } from '../action-preferences.store';

  import * as GLUA from '../__action';

  let runtimeScript = '';
  let runtimeParser = '';

  
  let brc = [0,0,0,0];
  let command ='';
  

  runtime.subscribe(s => {
    let code = '';
    s.forEach((e,i) => {
      code += `--[[@${e.meta}--]]` + e.script + "\n";  
    }); 
    runtimeScript = '<?lua ' + code.replace(/(\r\n|\n|\r)/gm, "") + '?>';
    runtimeParser = GLUA.parser(code, {comments: true});
  })

	function debug(){
    let data = GRID_PROTOCOL.encode_debugger(brc, command+runtimeScript);
    console.log(data);
		serialComm.write(data);
  }
  
  function charCount(text){
    return text.length;
  }


</script>

<config-debug class="w-full flex flex-col p-4">

  <div class="flex flex-col xl:flex-row text-white xl:items-end p-2">

    <div class="mr-1">
      <div>dx</div>
      <input class="w-full xl:w-10 p-1 text-black focus:outline-none" bind:value={brc[0]}>
    </div>
    <div class="mx-1">
      <div>dy</div>
      <input class="w-full xl:w-10 p-1 text-black focus:outline-none"  bind:value={brc[1]}>
    </div>
    <div class="mx-1">
      <div>age</div>
      <input class="w-full xl:w-10 p-1 text-black focus:outline-none"  bind:value={brc[2]}>
    </div>
    <div class="mx-1">
      <div>rot</div>
      <input class="w-full xl:w-10 p-1 text-black focus:outline-none"  bind:value={brc[3]}>
    </div>
    <div class="mx-1">
      <div>command</div>
      <input class="w-full xl:w-24 p-1 text-black focus:outline-none"  bind:value={command}>
    </div>

  </div>

  <textarea style="min-height:100px;" spellcheck="false" bind:value={runtimeScript} class="w-full cursor-default bg-primary rounded px-1 my-2 text-white font-mono"/>

  <div class="text-white">Syntax check: {runtimeParser}</div>

  <div class="text-white">Char count: {@html charCount(runtimeScript) > 120 ? `<span class="text-yellow-400">${charCount(runtimeScript)}</span>` : `${charCount(runtimeScript)}`}</div>

  <button on:click={debug} class="rounded my-2 bg-green-700 hover:bg-green-900 text-white px-2 py-2 w-32">Send To Grid</button>

</config-debug>