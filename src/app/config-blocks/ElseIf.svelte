<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'ei',
    name: 'ElseIf',
    groupType: 'modifier',
    desc: 'Else If',
    icon: null
  }
</script>

<script>
  import { createEventDispatcher, onDestroy } from 'svelte';

  import AtomicInput from '../main/user-interface/AtomicInput.svelte';
import CodeEditor from '../main/user-interface/code-editor/CodeEditor.svelte';
import stringManipulation from '../main/user-interface/_string-operations';
import { parenthesis } from './_validators';

  const dispatch = createEventDispatcher();

  export let config = ''
  export let index;

  let loaded = false;

  let scriptSegment = ''; // local script part

  $: if(config.script && !loaded){
    scriptSegment = stringManipulation.humanize(config.script.slice(8, -5));
    loaded = true;
  }

  onDestroy(()=>{
    loaded = false;
  })

  function sendData(e){
    if(parenthesis(e)){
      const script = stringManipulation.shortify(e);
      dispatch('output', {short: 'ei', script: `else if ${script} then`})
    }
  }
  
</script>


<else-if-block class="w-full flex flex-col text-white ">

  <div class="pl-2 flex items-center bg-purple-400">
    <div class="font-bold py-1">ELSE IF</div>
    <div class="pl-2 pr-1 py-0.5 flex-grow">
      <CodeEditor doc={`${scriptSegment}`} 
        showLineNumbers={false} 
        showCharCount={false} 
        on:output={(e)=>{sendData(e.detail.script)}}/>
    </div>
  </div>

</else-if-block>