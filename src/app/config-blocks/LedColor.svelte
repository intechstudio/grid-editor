<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'glc',
    groupType: 'standard',
    desc: 'LED Color',
    icon: null
  }
</script>

<script>
  import {onMount, createEventDispatcher} from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';

  import _utils from '../runtime/_utils.js';
  import { localDefinitions } from '../runtime/runtime.store';

  export let config;
  export let inputSet;
  export let blockAddedOnClick;
  export let index;

  const dispatch = createEventDispatcher();

  const parameterNames = ['LED Number', 'Layer', 'Red', 'Green', 'Blue'];

  let scriptSegments = [];

  // config.script cannot be undefined
  $: if(config.script){
    scriptSegments = _utils.scriptToSegments({human: config.human, short: config.short, script: config.script})
  };

  function sendData(e, index){
    scriptSegments[index] = e;
    const script = _utils.segmentsToScript({human: config.human, short: config.short, array: scriptSegments}); 
    dispatch('output', {short: config.short, script: script})
  }

  const _suggestions = [
    [
      {value: 'this.ind()', info: 'this led'},
    ],
    [
      {value: '1', info: 'layer 1'},
      {value: '2', info: 'layer 2'}
    ],
    [
      {value: '255', info: '255'}
    ],
    [
      {value: '255', info: '255'}
    ],
    [
      {value: '255', info: '255'}
    ]
  ];

  let suggestions = [];

  $: if($localDefinitions){
   // TODO
  }

  onMount(()=>{
    suggestions = _suggestions;
  })


</script>


<config-led-color class="flex w-full p-2">
  {#each scriptSegments as script, i}
    <div class={'w-1/'+scriptSegments.length + ' atomicInput '}>
      <div class="text-gray-500 text-sm pb-1">{parameterNames[i]}</div>
      <AtomicInput {index} inputValue={script} suggestions={suggestions[i]} on:change={(e)=>{sendData(e.detail,i)}}/>
    </div>
  {/each}
</config-led-color>

<style>
  .atomicInput{
    padding-right:0.5rem;
  }

  .atomicInput:first-child{
    padding-left: 0.5rem;
  }
</style>