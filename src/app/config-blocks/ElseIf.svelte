<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'ei',
    name: 'ElseIf',
    groupType: 'modifier',
    desc: 'ElseIf',
    defaultLua: 'else if  then',
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 277 277" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M131.429 2.92893C135.334 -0.976311 141.666 -0.976311 145.571 2.92893L274.071 131.429C277.976 135.334 277.976 141.666 274.071 145.571L145.571 274.071C141.666 277.976 135.334 277.976 131.429 274.071L2.92893 145.571C-0.976311 141.666 -0.976311 135.334 2.92893 131.429L131.429 2.92893ZM24.1421 138.5L138.5 252.858L252.858 138.5L138.5 24.1421L24.1421 138.5Z" fill="black"/>
    </svg>
    `,
    color: '#ff66ff'
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
    scriptSegment = stringManipulation.humanize(config.script.slice(7, -5));
    loaded = true;
  }

  onDestroy(()=>{
    loaded = false;
  })

  function sendData(e){
    if(parenthesis(e)){
      const script = stringManipulation.shortify(e);
      dispatch('output', {short: 'ei', script: `elseif ${script} then`})
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