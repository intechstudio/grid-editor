<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  import DynamicWrapper from "../../../view/DynamicWrapper.svelte";
  import ActionPicker from "../../../view/ActionPicker.svelte";
  
  import Macro from "../../../_actions/Macro.svelte";
  import Midi from "../../../_actions/Midi.svelte";
  import LedPhase from '../../../_actions/LedPhase.svelte';
  import CodeBlock from '../../../_actions/CodeBlock.svelte';

  import If from "../../../_modifiers/If.svelte";
  import Then from "../../../_modifiers/Then.svelte";
  import Else from '../../../_modifiers/Else.svelte';
  import ElseIf from '../../../_modifiers/ElseIf.svelte';
  import End from "../../../_modifiers/End.svelte";


  import { changeOrder } from '../../../move.action';
  import { actionIsDragged, runtime, dropStore } from '../../../action-preferences.store'; 

  import DropZone from '../../../view/DropZone.svelte';
  import ActionPreferences from '../../../view/ActionPreferences.svelte';
  import Advanced from '../../../view/Advanced.svelte';
  import ActionBin from '../../../view/ActionBin.svelte';

  export let actions;

  const components = {
    MIDI: Midi,
    MACRO: Macro,
    LEDPHASE: LedPhase,
    CODEBLOCK: CodeBlock,
    IF: If,
    THEN: Then,
    ELSE: Else,
    ELSEIF: ElseIf,
    END: End
  }

  function addActionAtPosition(arg, index){
    const { action } = arg.detail;
    actions = [...actions.slice(0, index), ...initActions(action), ...actions.slice(index , actions.length)];
  }

  function initActions(action){
    let arr = action.components.map((c, index) => {
      return {meta: c.meta, type: action.type, desc: c.desc, component: c.component, baseFunction: c.baseFunction,  script: c.script, id: actions.length + index, parameters: c.parameters};
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
    };
  }

  function calcSingleChangeActions(drag_target, drop_target){
    const grabbed = actions.find((act) => Number(...drag_target) === act.id);
    const from  = actions.indexOf(grabbed);
    let   to    = Number(drop_target);
    if(to < from){ to = to + 1 };
    actions = [...actions.slice(0, from), ...actions.slice(from + 1 )];
    actions = [...actions.slice(0, to), grabbed, ...actions.slice(to)];
  }

  function isDropZoneAvailable(drop_target){
    if(drop_target < 0) drop_target += 1; // dont let negative drop target come into play
    const target_id = actions[drop_target].id;
    const found = $dropStore.disabledDropZones.find(id => id == target_id);
    if(found){
      return 0;
    }
    return 1
  }

  function removeAction(actionsToRemove){
    console.log('actionToRemove: ', actionsToRemove);
    actionsToRemove.forEach(action => {
      actions = actions.filter(a => a.id !== Number(action));
    });
    remakeIdsForEachBlock();
  }

  function handleDrop(e){
    if(drop_target !== 'bin'){
      if(e.detail.multi){
        calcMultiChangeActions(drag_target, drop_target)
      } else {
        calcSingleChangeActions(drag_target, drop_target)
      }
    } else {
      removeAction(drag_target);
    }
  }

  function remakeIdsForEachBlock(){
    // as this regenerates action block, the keyed animation does not run, avoiding content jumps this way.
    actions = actions.map((action,index) => {action.id = index; return action});
  }

  // actions changed
  $: if(actions){
    runtime.set(actions);
    dropStore.disabledDropZones(actions);
  }


</script>


<actions class="w-full block px-4 bg-primary py-2 mt-4">

  <div class="text-gray-700 pt-1 text-sm">
    Actions
  </div>

    <div 
      use:changeOrder={{actions}} 
      on:drag-start={(e)=>{drag_start = true; actionIsDragged.set(true)}}  
      on:drag-target={(e)=>{drag_target = e.detail.id;}}
      on:drop-target={(e)=>{drop_target = e.detail.drop_target;}}
      on:drop={handleDrop}
      on:drag-end={(e)=>{ drag_start = false; actionIsDragged.set(false); drop_target = undefined; drag_target = [];}}
      on:anim-start={()=>{ animation= true;}}
      on:anim-end={()=>{ animation = false;}}  
      class=" relative">

      {#if !drag_start}
        <ActionPicker index={0} {actions} {animation} on:new-action={(e)=>{addActionAtPosition(e, 0)}}/>
      {:else}
        <DropZone index={-1} {drop_target} {drag_target} {animation} {drag_start}/>
      {/if}

      {#each actions as action, index (action.id)}
        <anim-block animate:flip={{duration: 300}} in:fade={{delay: 300}} class="block select-none">
          <DynamicWrapper let:toggle {drag_start} {index} {action}>
              <svelte:component slot="action" this={components[action.component]} {action} on:output={(e)=>{action.script = e.detail; action = action;}}/>  
              <ActionPreferences slot="preferences" {toggle} {index} type={action.type} advanced={action.desc !== "Macro"}/>
          </DynamicWrapper>

          <Advanced {index} {action} on:output={(e)=>{action.script = e.detail; action = action;}}/>

          {#if action.desc !== "If" }
            {#if !drag_start}
              <ActionPicker index={index + 1} {animation} {actions} on:new-action={(e)=>{addActionAtPosition(e, index + 1)}}/>
            {:else}
              <DropZone {index} {drag_target} {drop_target} {animation} {drag_start}/>
            {/if}
          {/if}        
        </anim-block>
      {/each}

      {#if !drag_start}
        <ActionPicker userHelper={true} index={actions.length + 1} {animation} {actions} on:new-action={(e)=>{addActionAtPosition(e, actions.length + 1)}}/>
      {:else}
        <ActionBin/>
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