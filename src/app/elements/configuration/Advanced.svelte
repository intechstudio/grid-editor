<script>
  import { actionPrefStore, selectedControlElement } from '../action-preferences.store';

  import { clickOutside } from '../../settings/ui/helpers/clickOutside';

  import { menuBoundaries } from '../boundaries.action';
  import Midi from './_actions/Midi.svelte';
  import CodeBlock from './_actions/CodeBlock.svelte';
  import { onMount, run } from 'svelte/internal';
  
  export let index = undefined;
  export let action = undefined;

  let topOffset = 0;

  const components = {
    MIDI: Midi,
    CODEBLOCK: CodeBlock
  }

  const paramArray = (num) => {
    let arr = [];
    for (let i = 0; i < num; i++) {
      arr.push({required: true, validator: ''});
    }
    return arr;
  }

  const meta = [
    {type: 'function', allowed: ['encoder', 'potentiometer', 'button', 'fader'], blacklist: ['CODEBLOCK'], desc:'if', value: 'if', parameters: paramArray(3)},
    {type: 'function', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'abs', value: 'abs', parameters: paramArray(1)},
    {type: 'function', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'sqrt', value: 'sqrt', parameters: paramArray(1)},
    {type: 'function', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'sin', value: 'sin', parameters: paramArray(1)},
    {type: 'function', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'cos', value: 'cos', parameters: paramArray(1)},

    {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'*', value: '\\*'}, 
    {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'+', value: '\\+'}, 
    {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'-', value: '\\-'}, 
    {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'(', value: '\\('},
    {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:')', value: '\\)'}, 
    {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'%', value: '\\%'},
    {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'/', value: '\\/'},
    {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'==', value: '\\=='},
    {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'!=', value: '\\=='},
    {type: 'operator', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc:'>=', value: '\\=='},

    {type: 'setter', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'setDefaultBankColor', value: 'bank_set_default_color', parameters: paramArray(5)},
    {type: 'setter', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'setActiveBank', value: 'bank_set_active', parameters: paramArray(1)},

    {type: 'setter', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'setElementDefaultNumber', value: 'set_element_default_number', parameters: paramArray(2)},
    {type: 'setter', allowed: ['encoder'], desc: 'setEncoderVelocityParameters', value: 'set_encoder_velocity_parameters', parameters: paramArray(3)},

    {type: 'getter', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'getAbsoluteValue', value: 'get_absolute_value', parameters: paramArray(2)} ,
    {type: 'getter', allowed: ['encoder'], desc: 'getRelativeChange', value: 'get_relative_change', parameters: paramArray(1)},

    {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'midi', value: 'midi_send', parameters: paramArray(4)},
    {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'ledColor', value: 'led_set_color', parameters: paramArray(5)},
    {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'ledPhase', value: 'led_set_phase', parameters: paramArray(3)},
    {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'ledMode', value: 'led_set_mode', parameters: paramArray(2)},
    {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'keyboardMacro', value: 'keyboard_macro_send', parameters: paramArray(6)},
    {type: 'action', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'keyboardChange', value: 'keyboard_change_send', parameters: paramArray(2)},

    {type: 'variable', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'elapsedTime', value: 'elapsed_time'},
    {type: 'variable', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'activeBank', value: 'active_bank'},
    {type: 'variable', allowed: ['encoder'], desc: 'relativeChange', value: 'relative_change'},
    {type: 'variable', allowed: ['encoder', 'potentiometer', 'button', 'fader'], desc: 'absoluteValue', value: 'absolute_value'}
  ]

  let blockAddedOnClick;
  function addThisManually(elem){
    blockAddedOnClick = elem;
  }

  // filtering params are "component" and "element"
  function createInputSet(component, element, metaInputList = []){
    if(component == undefined && element == undefined && metaInputList.length == 0) { return [] };
    let arr = metaInputList;
    arr = arr.filter(obj => !(component !== 'CODEBLOCK' && obj.type === "setter") && obj.allowed.find(a => a === element));
    return arr;
  }

  // managing lifecycle as child components dont receive data otherwise
  let ready = false;
  onMount(()=>{
    ready = true;
  });

</script>

{#if ready}

  {#if index == 0}

  <advanced-config class="relative w-full flex ">
    <container 
      id="action-menu"
      use:menuBoundaries
      on:offset-top={(e)=>{topOffset = e.detail;}} 
      style="right: calc(100% + 2rem);top:{-150 + topOffset}px;width:400px;height:600px;position:absolute;" 
      class=" shadow-md rounded-md bg-primary p-2 z-50">
      <wrapper 
        use:clickOutside
        on:click-outside={()=>{actionPrefStore.showAdvanced(index, false)}} 
        class="flex flex-col flex-grow h-full">
        <config-pool class="flex flex-wrap">
            <basic-functions class="w-1/2 flex flex-col p-2">
              <span class="text-gray-500 text-sm">Basic Functions</span>
              <div class="flex -ml-1 items-start flex-wrap">
                {#each meta.filter(m => m.type === 'function' && m.allowed.find(a => a === $selectedControlElement)) as func}
                  <div on:click={()=>{addThisManually(func)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{func.desc}</div>
                {/each}
              </div>
            </basic-functions>

            <oparators class="w-1/2 flex flex-col p-2">
              <span class="text-gray-500 text-sm">Operators</span>
              <div class="flex -ml-1 items-start flex-wrap">
                {#each meta.filter(m => m.type === 'operator' && m.allowed.find(a => a === $selectedControlElement)) as operator}
                  <div on:click={()=>{addThisManually(operator)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{operator.desc}</div>
                {/each}
              </div>
            </oparators>

            <getters class="w-1/2 flex flex-col p-2">
              <span class="text-gray-500 text-sm">Get Functions</span>
              <div class="flex -ml-1 items-start flex-wrap">
                {#each meta.filter(m => m.type === 'getter' && m.allowed.find(a => a === $selectedControlElement)) as getter}
                  <div on:click={()=>{addThisManually(getter)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{getter.desc}</div>
                {/each}
              </div>
            </getters>

            <!-- Show setter functions only in codeblock -->
            {#if action.component == 'CODEBLOCK'}
            <setters class="w-1/2 flex flex-col p-2">
              <span class="text-gray-500 text-sm">Set Functions</span>
              <div class="flex -ml-1 items-start flex-wrap">
                {#each meta.filter(m => m.type === 'setter' && m.allowed.find(a => a === $selectedControlElement)) as setter}
                  <div on:click={()=>{addThisManually(setter)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{setter.desc}</div>
                {/each}
              </div>
            </setters>
            {/if}

            <action-functions class="w-1/2 flex flex-col p-2">
              <span class="text-gray-500 text-sm">Action Funcitons</span>
              <div class="flex -ml-1 items-start flex-wrap">
                {#each meta.filter(m => m.type === 'action' && m.allowed.find(a => a === $selectedControlElement)) as action}
                  <div  on:click={()=>{addThisManually(action)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{action.desc}</div>
                {/each}
              </div>
            </action-functions>

            <variables class="w-1/2 flex flex-col p-2">
              <span class="text-gray-500 text-sm">Read Only Variables</span>
              <div class="flex -ml-1 items-start flex-wrap">
                {#each meta.filter(m => m.type === 'variable' && m.allowed.find(a => a === $selectedControlElement)) as variable}
                  <div on:click={()=>{addThisManually(variable)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{variable.desc}</div>
                {/each}
              </div>
            </variables>

        </config-pool>

        <svelte:component this={components[action.component]} advanced={true} inputSet={createInputSet(action.component, $selectedControlElement, meta)} {blockAddedOnClick} on:output></svelte:component>

      </wrapper>

    </container>
      
  </advanced-config>


  {/if}
{/if}

<style>


</style>