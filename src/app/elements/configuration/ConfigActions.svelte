<script>
  import { flip } from 'svelte/animate';
  import { fly, fade } from 'svelte/transition';

  import DynamicWrapper from "../DynamicWrapper.svelte";
  import ActionPicker from "./ActionPicker.svelte";
  import Macro from "./_actions/Macro.svelte";

  import Midi from "./_actions/Midi.svelte";
  import EndIf from "./_modifiers/EndIf.svelte";
  import If from "./_modifiers/If.svelte";
  import Then from "./_modifiers/Then.svelte";

  import { changeOrder } from '../move.action';

  export let actions = [
    {type: 'standard', desc: 'MIDI', component: 'MIDI',  id: 0}, 
    {type: 'standard', desc: 'Macro', component: 'Macro', id: 1}, 
    {type: 'standard', desc: 'MIDI', component: 'MIDI',  id: 2}, 
  ];

  const components = {
    MIDI: Midi,
    Macro: Macro,
    If: If,
    Then: Then,
    EndIf: EndIf
  }

  function addActionAtPosition(arg, index){
    const { action } = arg.detail;
    actions = [...actions.slice(0, index), ...initActions(action), ...actions.slice(index , actions.length)];
  }

  function initActions(action){
    let arr = action.components.map((c, index) => {
      return {type: action.type, desc: c.desc, component: c.component, id: actions.length + 1 + index};
    });
    return arr;
  }

  function randomColor(){
    return "rgb(" + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + ","+ Math.floor(Math.random() * 256) + ")";
  }

  let dragstart = false;
  let drag_target = '';
  let drop_target = '';

</script>


<actions class="w-full block px-4 bg-primary py-2 mt-4">

  <div class="text-gray-700 py-1 text-sm">
    Actions
  </div>

  <ActionPicker on:new-action={(e)=>{addActionAtPosition(e, 0)}}/>

  <div 
    use:changeOrder 
    on:drag-start={(e)=>{dragstart = true; drag_target = e.detail.id}}  
    on:drag-over={(e)=>{drop_target = e.detail.id;}}
    on:drag-drop={(e)=>{
      const grabbed = actions.find(act => Number(e.detail.transfer) === act.id);
      const from  = actions.indexOf(grabbed);
      let   to    = Number(drop_target.substr(3,));
      if(to < from){ to = to + 1 };
      actions = [...actions.slice(0, from), ...actions.slice(from + 1 )];
      actions = [...actions.slice(0, to), {type: 'dummy', id: 99}, ...actions.slice(to)];
      setTimeout(()=>{        
        actions.splice(actions.findIndex(act => act.type === 'dummy'), 1);
        actions = [...actions.slice(0, to), grabbed, ...actions.slice(to)];
      }, 200);
      dragstart = false;
      drop_target = ''
    }}
    on:drag-end={(e)=>{dragstart = false; console.log('drag end')}}
    class="flex flex-col">
    {#each actions as action, index (action.id)}
      <anim-block animate:flip={{duration: 200}} >
        <div in:fade={{delay: 200, duration: 200}} draggable="true" id="{action.id}" class="block z-10">
          <div class:pointer-events-none={dragstart}>
            <DynamicWrapper color={randomColor()} name={action.desc} type={action.type}>
              <svelte:component this={components[action.component]}/>
            </DynamicWrapper>

            {#if action.desc !== 'If' && !dragstart}
              <ActionPicker on:new-action={(e)=>{addActionAtPosition(e, index + 1)}}/>
            {/if}
          </div>
        </div>

        <drop-zone id="dz-{index}" class="{dragstart ? 'block' : 'hidden'} -my-2">
          <div class="pointer-events-none {drop_target == ('dz-'+index) && dragstart ? 'opacity-100 ' : 'opacity-0 '} h-5 transition-opacity duration-300 flex items-center relative">
            <div class="h-2 w-full rounded-full bg-green-500 cursor-pointer"></div>
          </div>
        </drop-zone>
      </anim-block>
    {/each}
      

  </div>
  


</actions>