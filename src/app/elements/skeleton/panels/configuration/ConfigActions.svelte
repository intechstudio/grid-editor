<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  import DynamicWrapper from "../../../view/DynamicWrapper.svelte";
  import ActionPicker from "../../../view/ActionPicker.svelte";
  
  import Macro from "../../../_actions/Macro.svelte";
  import Midi from "../../../_actions/Midi.svelte";
  import LedPhase from '../../../_actions/LedPhase.svelte';
  import CodeBlock from '../../../_actions/CodeBlock.svelte';
  import EndIf from "../../../_modifiers/EndIf.svelte";
  import If from "../../../_modifiers/If.svelte";
  import Then from "../../../_modifiers/Then.svelte";

  import { changeOrder } from '../../../move.action';
  import { actionIsDragged, runtime } from '../../../action-preferences.store'; 

  import DropZone from '../../../view/DropZone.svelte';
  import ActionPreferences from '../../../view/ActionPreferences.svelte';
  import Advanced from '../../../view/Advanced.svelte';

  export let actions;

  const components = {
    MIDI: Midi,
    MACRO: Macro,
    LEDPHASE: LedPhase,
    CODEBLOCK: CodeBlock,
    IF: If,
    THEN: Then,
    ENDIF: EndIf
  }

  function addActionAtPosition(arg, index){
    const { action } = arg.detail;
    actions = [...actions.slice(0, index), ...initActions(action), ...actions.slice(index , actions.length)];
  }

  function initActions(action){
    let arr = action.components.map((c, index) => {
      return {type: action.type, desc: c.desc, component: c.component, id: actions.length + 1 + index, parameters: c.parameters};
    });
    return arr;
  }


  let animation = false;
  let drag_start = false;
  let drag_target = '';
  let drop_target = '';

  // actions changed
  $: if(actions){
    runtime.set(actions);
  }

</script>


<actions class="w-full block px-4 bg-primary py-2 mt-4">

  <div class="text-gray-700 py-1 text-sm">
    Actions
  </div>

    <div 
      use:changeOrder 
      on:drag-start={(e)=>{drag_start = true; actionIsDragged.set(true)}}  
      on:drag-target={(e)=>{drag_target = e.detail.id; console.log(e.detail)}}
      on:drop-target={(e)=>{drop_target = e.detail.drop_target;console.log(drop_target)}}
      on:drop={(e)=>{
        const grabbed = actions.find((act) => Number(drag_target) === act.id);
        const from  = actions.indexOf(grabbed);
        let   to    = Number(drop_target);
        if(to < from){ to = to + 1 };
        actions = [...actions.slice(0, from), ...actions.slice(from + 1 )];
        actions = [...actions.slice(0, to), grabbed, ...actions.slice(to)];
      }}
      on:drag-end={(e)=>{drag_start = false; actionIsDragged.set(false); drop_target = undefined}}
      on:anim-start={()=>{ animation= true;}}
      on:anim-end={()=>{ animation = false;}}  
      class="relative select-none">

      {#if !drag_start}
        <ActionPicker {animation} on:new-action={(e)=>{addActionAtPosition(e, 0)}}/>
      {:else}
        <DropZone index={-1} {drop_target} {animation} {drag_start}/>
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
              <ActionPicker {animation} on:new-action={(e)=>{addActionAtPosition(e, index + 1)}}/>
            {:else}
              <DropZone index={index} {drop_target} {animation} {drag_start}/>
            {/if}
          {/if}
        </anim-block>
      {/each}
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