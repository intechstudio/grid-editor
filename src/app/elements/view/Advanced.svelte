<script>
  import { actionPrefStore, selectedControlElement } from '../action-preferences.store';

  import { clickOutside } from '../../settings/ui/helpers/clickOutside';

  import { menuBoundaries } from '../boundaries.action';
  import Midi from '../_actions/Midi.svelte';
  import CodeBlock from '../_actions/CodeBlock.svelte';
  import { onMount, run } from 'svelte/internal';

  import CodeEditor from '../user-interface/code-editor/CodeEditor.svelte';
  
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

  let sg = "all"; // show suggestion

  // managing lifecycle as child components dont receive data otherwise
  let ready = false;
  onMount(()=>{
    ready = true;
  });

</script>

{#if ready}

  {#if index == $actionPrefStore.advanced.index && $actionPrefStore.advanced.visible}

  <advanced-config class="relative w-full flex ">
    <container 
      id="action-menu"
      use:menuBoundaries
      on:offset-top={(e)=>{topOffset = e.detail;}} 
      style="right: calc(100% + 2rem);top:{-150 + topOffset}px;width:600px;height:600px;position:absolute;" 
      class=" shadow-md rounded-md bg-primary p-2 z-50">
      <wrapper 
        use:clickOutside
        on:click-outside={()=>{actionPrefStore.showAdvanced(index, 'outside')}} 
        class="flex flex-col h-full font-mono">

        <div class="flex items-center justify-between">
          <div class="font-bold w-auto py-2 mx-2 border-b border-gray-700 text-white">Advanced</div>
          <div on:click={()=>{actionPrefStore.showAdvanced(index, false)}} id="close-btn" class="p-1 mx-1 cursor-pointer not-draggable hover:bg-secondary">
            <svg class="w-5 h-5 p-1 fill-current text-gray-500" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
              <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
            </svg>
          </div>
        </div>

        <div class="flex flex-grow">

          <advanced-menu class="w-2/5 flex flex-col">
            
              <select-config-suggestions class="w-full text-white flex flex-col text-sm">
                <div class=" flex flex-row py-2 flex-wrap">
                  {#each ['all', 'variables', 'operators', 'setters', 'getters', 'actions'] as key}
                    <div on:click={()=>{sg = key}} class="{sg == key ? 'bg-select' : 'hover:bg-select-desaturate-10'} m-1 px-2 py-1 rounded-lg cursor-pointer">{key}</div>
                  {/each}
                </div>
              </select-config-suggestions>

              <config-pool class="w-full flex flex-col overflow-y-scroll">
                {#if sg == "all" || sg == "math"}
                  <basic-functions class="w-full flex flex-col p-2">
                    
                    {#if sg == "all"}<span class="text-gray-500 text-sm">Basic Functions</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each meta.filter(m => m.type === 'function' && m.allowed.find(a => a === $selectedControlElement)) as func}
                        <div on:click={()=>{addThisManually(func)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{func.desc}</div>
                      {/each}
                    </div>
                  </basic-functions>
                {/if}

                {#if sg == "all" || sg == "operators"}
                  <oparators class="w-full flex flex-col p-2">
                    {#if sg == "all"}<span class="text-gray-500 text-sm">Operators</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each meta.filter(m => m.type === 'operator' && m.allowed.find(a => a === $selectedControlElement)) as operator}
                        <div on:click={()=>{addThisManually(operator)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{operator.desc}</div>
                      {/each}
                    </div>
                  </oparators>

                {/if}

                {#if sg == "all" || sg == "getters"}
                  <getters class="w-full flex flex-col p-2">

                    {#if sg == "all"}<span class="text-gray-500 text-sm">Get Functions</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each meta.filter(m => m.type === 'getter' && m.allowed.find(a => a === $selectedControlElement)) as getter}
                        <div on:click={()=>{addThisManually(getter)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{getter.desc}</div>
                      {/each}
                    </div>
                  </getters>
                {/if}

                {#if sg == "all" || sg == "setters"}
                  <!-- Show setter functions only in codeblock -->
                  {#if action.component == 'CODEBLOCK'}
                  <setters class="w-full flex flex-col p-2">
                    {#if sg == "all"}<span class="text-gray-500 text-sm">Set Functions</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each meta.filter(m => m.type === 'setter' && m.allowed.find(a => a === $selectedControlElement)) as setter}
                        <div on:click={()=>{addThisManually(setter)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{setter.desc}</div>
                      {/each}
                    </div>
                  </setters>
                  {/if}
                {/if}

                {#if sg == "all" || sg == "actions"}
                  <action-functions class="w-full flex flex-col p-2">
                    {#if sg == "all"}<span class="text-gray-500 text-sm">Action Funcitons</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each meta.filter(m => m.type === 'action' && m.allowed.find(a => a === $selectedControlElement)) as action}
                        <div  on:click={()=>{addThisManually(action)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{action.desc}</div>
                      {/each}
                    </div>
                  </action-functions>
                  {/if}

                {#if sg == "all" || sg == "variables"}
                  <variables class="w-full flex flex-col p-2">
                    {#if sg == "all"}<span class="text-gray-500 text-sm">Read Only Variables</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each meta.filter(m => m.type === 'variable' && m.allowed.find(a => a === $selectedControlElement)) as variable}
                        <div on:click={()=>{addThisManually(variable)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{variable.desc}</div>
                      {/each}
                    </div>
                  </variables>
                {/if}
              </config-pool>
      
          </advanced-menu>

          <advanced-code class="w-3/5">
            <CodeEditor doc={action.script} on:output/>
          </advanced-code>

        </div>

        <!--
        <svelte:component this={components[action.component]} advanced={true} inputSet={createInputSet(action.component, $selectedControlElement, meta)} {blockAddedOnClick} on:output></svelte:component>
-->
      </wrapper>

    </container>
      
  </advanced-config>


  {/if}
{/if}

<style>

  ::-webkit-scrollbar {
      height: 6px;
      width: 6px;
      background: #1e2628;
  }
  
  ::-webkit-scrollbar-thumb {
      background: #286787;
      box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }
  
  ::-webkit-scrollbar-corner {
      background: #1e2628
  }

</style>