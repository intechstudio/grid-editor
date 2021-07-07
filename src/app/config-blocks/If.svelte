<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'if',
    name: 'If',
    groupType: 'modifier',
    desc: 'If',
    icon: null
  }
</script>

<script>
  import { createEventDispatcher, onDestroy } from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';
import CodeEditor from '../main/user-interface/code-editor/CodeEditor.svelte';
import stringManipulation from '../main/user-interface/_string-operations';
import { parenthesis } from './_validators';

  export let config = ''
  export let index;

  const dispatch = createEventDispatcher();

  let scriptSegment = ''; // local script part

  let loaded = false;

  $: if(config.script && !loaded){
    scriptSegment = stringManipulation.humanize(config.script.slice(3, -5));
    loaded = true;
  }

  onDestroy(()=>{
    loaded = false;
  })

  function sendData(e){
    if(parenthesis(e)){
      const script = stringManipulation.shortify(e);
      dispatch('output', {short: `if`, script:`if ${script} then`})
    }
  }

</script>


<if-block class="w-full flex flex-col text-white">

  <div class="pl-2 flex items-center bg-purple-400 rounded-t-lg">
    <span class="font-bold py-1">IF</span>
    <div class="pl-2 py-0.5 pr-1 w-full">
      <CodeEditor doc={`${scriptSegment}`} 
        showLineNumbers={false} 
        showCharCount={false} 
        on:output={(e)=>{sendData(e.detail.script)}}/>
    </div>
  </div>

</if-block>