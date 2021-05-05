<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  import Midi from '../../../configs/Midi.svelte';
  import Macro from '../../../configs/Macro.svelte';
  import LedPhase from '../../../configs/LedPhase.svelte';
  import LedColor from '../../../configs/LedColor.svelte';
  import CodeBlock from '../../../configs/CodeBlock.svelte';
  import If from '../../../configs/If.svelte';
  import Else from '../../../configs/Else.svelte';
  import ElseIf from '../../../configs/ElseIf.svelte';
  import End from '../../../configs/End.svelte';
  import Locals from '../../../configs/Locals.svelte';

  import MultiSelect from './components/MultiSelect.svelte';
  import Bin from './components/Bin.svelte';
  import DropZone from './components/DropZone.svelte';
  import DynamicWrapper from './components/DynamicWrapper.svelte';
  import Options from './components/Options.svelte';

  import ConfigExtension from './ConfigExtension.svelte';
  import ConfigPicker from './ConfigPicker.svelte';

  import { changeOrder } from '../../actions/move.action.js';

  import { dropStore, actionIsDragged } from '../../stores/app-helper.store.js';
  import { runtime } from '../../../runtime/runtime.store.js';

  let actions;

  const components = {
    MIDI: Midi,
    MACRO: Macro,
    LEDPHASE: LedPhase,
    LEDCOLOR: LedColor,
    CODEBLOCK: CodeBlock,
    IF: If,
    ELSE: Else,
    ELSEIF: ElseIf,
    END: End,
    LOCALS: Locals
  }

  function addActionAtPosition(arg, index){
    const { action } = arg.detail;
    actions = [...actions.slice(0, index), ...initActions(action), ...actions.slice(index , actions.length)];
    actionsChanged(actions);
  }

  function initActions(action){
    let arr = action.components.map((variables, index) => {
      return {...variables, id: actions.length + index}
    });
    return arr;
  }

  let animation = false;
  let drag_start = false;
  let drag_target = '';
  let drop_target = '';

  function calcMultiChangeActions(drag_target, drop_target){
    if(isDropZoneAvailable(drop_target)){
      let grabbed = [];
      drag_target.forEach(id => {
        grabbed.push(actions.find((act) => Number(id) === act.id));
      });
      const firstElem = actions.indexOf(grabbed[0]);
      const lastElem = actions.indexOf(grabbed[grabbed.length-1]);
      let to = Number(drop_target) + 1;
      // correction for multidrag
      if(to > firstElem){
        to = to - drag_target.length;
      }
      actions = [...actions.slice(0, firstElem), ...actions.slice(lastElem + 1)];
      actions = [...actions.slice(0, to), ...grabbed, ...actions.slice(to)];
      actionsChanged(actions);
    };
  }

  function calcSingleChangeActions(drag_target, drop_target){
    const grabbed = actions.find((act) => Number(...drag_target) === act.id);
    const from  = actions.indexOf(grabbed);
    let   to    = Number(drop_target);
    if(to < from){ to = to + 1 };
    actions = [...actions.slice(0, from), ...actions.slice(from + 1 )];
    actions = [...actions.slice(0, to), grabbed, ...actions.slice(to)];
    actionsChanged(actions);
  }

  function isDropZoneAvailable(drop_target){
    if(drop_target < 0) drop_target += 1; // dont let negative drop target come into play
    const target_index = actions.indexOf(drop_target);
    const found = $dropStore.disabledDropZones.find(index => index == target_index);
    if(found){
      return 0;
    }
    return 1
  }

  function handleDrop(e){
    if(drop_target !== 'bin'){
      if(e.detail.multi){
        calcMultiChangeActions(drag_target, drop_target)
      } else {
        calcSingleChangeActions(drag_target, drop_target)
      }
    } else {
      appActionManagement.remove(drag_target);
    }
  }

  // actions changed
  function actionsChanged(actions){
    runtime.set(actions);
    dropStore.disabledDropZones();
  }

  runtime.subscribe(values=>{
    actions = values;
  })


</script>


<actions class="w-full block px-4 bg-primary py-2 mt-4">

  <div class="pt-1 flex items-center justify-between">
    <div class="text-gray-600 text-sm">Actions</div>
    <MultiSelect/>
  </div>

    <div 
      use:changeOrder={{actions}} 
      on:drag-start={(e)=>{drag_start = true; actionIsDragged.set(true)}}  
      on:drag-target={(e)=>{drag_target = e.detail.id;}}
      on:drop-target={(e)=>{drop_target = e.detail.drop_target; console.log('DROP_TARGET', drop_target)}}
      on:drop={handleDrop}
      on:drag-end={(e)=>{ drag_start = false; actionIsDragged.set(false); drop_target = undefined; drag_target = [];}}
      on:anim-start={()=>{ animation= true;}}
      on:anim-end={()=>{ animation = false;}}  
      class="relative">

      {#if !drag_start}
        <ConfigPicker index={0} {actions} {animation} on:new-action={(e)=>{addActionAtPosition(e, 0)}}/>
      {:else}
        <DropZone index={-1} {drop_target} {drag_target} {animation} {drag_start}/>
      {/if}

      {#each actions as action, index (action.id)}
        <anim-block animate:flip={{duration: 300}} in:fade={{delay: 300}} class="block select-none">
          <DynamicWrapper let:toggle {drag_start} {index} {action}>
              <svelte:component slot="action"  this={components[action.component]} {action} {index} on:output={(e)=>{action.script = e.detail; action = action; runtime.set(actions)}}/>  
              <Options slot="preferences" {toggle} {index} component={action.component} type={action.type} advanced={action.desc !== "Macro"}/>
          </DynamicWrapper>

          <ConfigExtension {index} {action} on:output={(e)=>{action.script = e.detail; action = action; actionsChanged(actions)}}/>
          
          {#if !drag_start}
            <ConfigPicker index={index + 1} {animation} {actions} on:new-action={(e)=>{addActionAtPosition(e, index + 1)}}/>
          {:else}
            <DropZone {index} {drag_target} {drop_target} {animation} {drag_start}/>
          {/if}
                
        </anim-block>
      {/each}

      {#if !drag_start}
        <ConfigPicker userHelper={true} index={actions.length + 1} {animation} {actions} on:new-action={(e)=>{addActionAtPosition(e, actions.length + 1)}}/>
      {:else}
        <Bin/>
      {/if}
      
    </div>

</actions>

<style global>

  .grabbed{
    cursor: move !important;
  }

  .unselectable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    cursor: default;
  }

</style>